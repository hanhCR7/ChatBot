import contextlib
import uuid
import asyncio
import openai
import os
import logging
import datetime
from sqlalchemy import func
from crud import *
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from jose import JWTError
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from db_config import SessionLocal, db_dependency
from schemas import ChatSessionUpdate, ChatSessionOut, ChatHistoryOut, AllChatUsersResponse, UserDetailOut, SessionWithMessageOut
from starlette.websockets import WebSocketState
from models import ChatSession, ChatHistory
from connect_service import get_current_user, validate_token_from_query, get_user
from sockets.connection_manager import ConnectionManager
from sockets.ws_helpers import handle_send_message, handle_typing, now_vn
from service.prompts import SYSTEM_MESSAGE
from service.violation_handler import get_user_strike_count, is_user_banned_from_chat
router = APIRouter(prefix="/api/chatbot_service",tags=["chatbot"])
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
VN_TIMEZONE = datetime.timezone(datetime.timedelta(hours=7))
timestamp = datetime.datetime.now(VN_TIMEZONE)
manager = ConnectionManager()
logger = logging.getLogger("chatbot.websocket")
#ADMIN
@router.get("/all-chat-users", response_model=AllChatUsersResponse)
async def get_all_chat_with_users(db: db_dependency, page: int=1, limit:int=10, user=Depends(get_current_user)):
    if not user["role"] == "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này")
    total_users = db.query(ChatSession.user_id).distinct().count()

    # Lấy danh sách user_id phân trang
    user_ids = (
        db.query(ChatSession.user_id)
        .distinct()
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    user_ids = [row[0] for row in user_ids]
    async def fetch_user(user_id):
        try:
            info = await get_user(user_id)
            # Xử lý cả trường hợp response là dict trực tiếp hoặc có key "user"
            if isinstance(info, dict):
                if "user" in info:
                    user_data = info["user"]
                else:
                    user_data = info
            else:
                if hasattr(info, 'model_dump'):
                    user_data = info.model_dump()
                elif hasattr(info, 'dict'):
                    user_data = info.dict()
                else:
                    user_data = {}
            
            if not isinstance(user_data, dict):
                user_data = {}
            
            return {
                "user_id": user_id,
                "username": user_data.get("username"),
                "email": user_data.get("email")
            }
        except Exception:
            return {
                "user_id": user_id,
                "username": None,
                "email": None
            }
    user_infos = await asyncio.gather(*[fetch_user(user_id) for user_id in user_ids])
    results = []
    for user_info in user_infos:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_info["user_id"])
            .order_by(ChatSession.created_at.desc())
            .all()
        )
        session_data = []
        for s in sessions:
            msg_count = (
                db.query(func.count(ChatHistory.id))
                .filter(ChatHistory.chat_id == s.id)
                .scalar()
            )
            session_data.append({
                "chat_id": str(s.id),
                "title": s.title,
                "created_at": s.created_at,
                "message_count": msg_count
            })
        results.append({
            **user_info,
            "sessions": session_data
        })
    return {
        "data": results,
        "pagination": {
            "total": total_users,
            "page": page,
            "limit": limit
        }
    }
@router.get("/chat-users/{user_id}")
async def get_chat_of_user_id(db: db_dependency, user_id: int,user=Depends(get_current_user)):
    if not user["role"] == "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này")
    user_response = await get_user(user_id)
    if not user_response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    
    # Xử lý cả trường hợp response là dict trực tiếp hoặc có key "user"
    if isinstance(user_response, dict):
        if "user" in user_response:
            user_data = user_response["user"]
        else:
            user_data = user_response
    else:
        if hasattr(user_response, 'model_dump'):
            user_data = user_response.model_dump()
        elif hasattr(user_response, 'dict'):
            user_data = user_response.dict()
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    
    if not isinstance(user_data, dict):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    
    # Lấy tất cả session của user + load luôn messages
    sessions = (
        db.query(ChatSession)
        .options(joinedload(ChatSession.chat_history))
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return UserDetailOut(
        user_id=user_id,
        username = user_data["username"],
        email = user_data["email"],
        sessions=[
            SessionWithMessageOut(
                id=s.id,
                title=s.title,
                created_at=s.created_at,
                message=[
                    MessageOut.model_validate(m, from_attributes=True)
                    for m in s.chat_history
                ]
            )
            for s in sessions
        ]
    )
# User
@router.get("/chat", response_model=List[ChatSessionOut])
async def get_chats_by_user_id(db: db_dependency, user=Depends(get_current_user)):
    try:
        chats = db.query(ChatSession).filter(ChatSession.user_id == user["user_id"]).order_by(ChatSession.created_at.desc()).all()
        return chats
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi lấy danh sách chat")

@router.get("/check-violations/{user_id}")
async def check_user_violations(user_id: int, db: db_dependency):
    """Endpoint để kiểm tra vi phạm của user (dùng cho identity_service)"""
    try:
        strike_count = await get_user_strike_count(user_id, db)
        is_banned = await is_user_banned_from_chat(user_id)
        return {
            "user_id": user_id,
            "strike_count": strike_count,
            "is_banned": is_banned,
            "can_login": strike_count < 4,
            "can_chat": strike_count < 2 and not is_banned
        }
    except Exception as e:
        logger.error(f"Lỗi khi kiểm tra vi phạm cho user {user_id}: {e}")
        # Trả về giá trị mặc định an toàn
        return {
            "user_id": user_id,
            "strike_count": 0,
            "is_banned": False,
            "can_login": True,
            "can_chat": True
        }

@router.get("/chat/{chat_id}", response_model=ChatHistoryOut)
async def get_chat(chat_id: uuid.UUID, db: db_dependency, user=Depends(get_current_user)):
    try:
        chat = get_chat_history(db, chat_id)
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat không tồn tại")
        if chat.chat_session.user_id != user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chat không thuộc về bạn")
        return chat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi lấy chat")
@router.post("/chat", response_model=ChatSessionOut)
async def create_chat(chat_session: ChatSessionCreate, db: db_dependency, user=Depends(get_current_user)):
    try:
        user_id = user["user_id"]
        
        # Kiểm tra vi phạm: nếu có vi phạm (strike >= 2) thì không cho tạo chat mới
        strike_count = await get_user_strike_count(user_id, db)
        is_banned = await is_user_banned_from_chat(user_id)
        
        if strike_count >= 4:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản của bạn đã bị khóa do vi phạm nhiều lần. Vui lòng liên hệ admin để được hỗ trợ."
            )
        
        if is_banned or strike_count >= 2:
            violation_message = "Bạn đang bị cấm chat do vi phạm nội dung. "
            if strike_count == 2:
                violation_message += "Bạn bị cấm chat 5 phút (vi phạm lần 2)."
            elif strike_count == 3:
                violation_message += "Bạn bị cấm chat 1 giờ (vi phạm lần 3)."
            else:
                violation_message += "Vui lòng liên hệ admin để được hỗ trợ."
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=violation_message
            )
        
        chat_data = ChatSessionCreate(
            user_id=user_id,
            title=chat_session.title or "New Chat"
        )
        return create_chat_session(db, chat_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi tạo chat")
@router.put("/chat/{chat_id}", response_model=ChatSessionOut)
async def update_chat(chat_id: uuid.UUID, chat_update: ChatSessionUpdate, db: db_dependency, user=Depends(get_current_user)):
    try:
        chat = get_chat_history(db, chat_id)
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat không tồn tại")
        if chat.chat_session.user_id != user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chat không thuộc về bạn")
        return update_chat_session(db, chat_id, chat_update)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi cập nhật chat")

@router.delete("/chat/{chat_id}")
async def delete_chat(chat_id: uuid.UUID, db: db_dependency, user=Depends(get_current_user)):
    try:
        chat = get_chat_history(db, chat_id)
        if not chat:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat không tồn tại")
        if chat.chat_session.user_id != user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chat không thuộc về bạn")
        delete_all_messages(db, chat_id)
        delete_chat_session(db, chat_id)
        db.commit()
        return {"detail": "Chat đã được xóa"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi xóa chat")

@router.delete("/message/{message_id}")
async def delete_one_message(message_id: uuid.UUID, db: db_dependency, user=Depends(get_current_user)):
    try:
        msg = db.query(ChatHistory).filter(ChatHistory.id == message_id).first()
        if not msg:
            raise HTTPException(status_code=404, detail="Tin nhắn không tồn tại")
        chat = db.query(ChatSession).filter(ChatSession.id == msg.chat_id).first()
        if chat.user_id != user["user_id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tin nhắn không thuộc về bạn")
        delete_message(db, message_id)
        db.commit()
        return {"detail": "Tin nhắn đã được xóa"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi server khi xóa tin nhắn")

# --------------------- WebSocket ---------------------
@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: uuid.UUID):
    db: Session = SessionLocal()
    user_id: Optional[int] = None
    try:
        # Xác thực
        try:
            user_data = await validate_token_from_query(websocket)
            if not user_data:
                await websocket.close(code=1008)
                return
            user_id = int(user_data.get("user_id") or user_data.get("sub"))
        except JWTError:
            await websocket.close(code=1008)
            return
        # Kiểm tra quyền sở hữu
        chat_session = db.query(ChatSession).filter(
            ChatSession.id == chat_id, ChatSession.user_id == user_id
        ).first()
        if not chat_session:
            await websocket.close(code=1008)
            return
        # Kết nối
        await websocket.accept()
        await manager.connect(websocket, chat_id, user_id)
        logger.info(f"User {user_id} connected to chat {chat_id}")
        # Vòng lặp nhận dữ liệu
        while websocket.client_state == WebSocketState.CONNECTED:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.warning(f"Lỗi nhận dữ liệu WS: {e}")
                continue
            action = data.get("action")
            content = data.get("content")
            # Trạng thái typing
            if action == "typing":
                await handle_typing(manager, chat_id, user_id)
                continue
            # Gửi tin nhắn bình thường
            if action != "sendMessage" or not content:
                continue
            # Tạo context từ lịch sử
            chat_log: List[Dict[str, Any]] = [
                {"role": "system", "content": SYSTEM_MESSAGE}
            ]
            try:
                messages = (
                    db.query(ChatHistory)
                    .filter(ChatHistory.chat_id == chat_id)
                    .order_by(ChatHistory.created_at.desc())
                    .limit(40)
                    .all()
                )
                for m in reversed(messages):
                    chat_log.append({"role": m.role, "content": m.content})
            except Exception as e:
                logger.error(f"Lỗi khi tải lịch sử chat {chat_id}: {e}")
                await websocket.send_json({
                    "role": "system",
                    "content": "Không thể tải lịch sử trò chuyện.",
                    "timestamp": now_vn().isoformat()
                })
                continue
            # Gọi AI xử lý (stream qua websocket)
            await handle_send_message(
                websocket, db, chat_id, chat_log, chat_session, user_id, content, user_data
            )
    except Exception as e:
        logger.exception("Fatal websocket error: %s", e)
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json({
                "role": "system",
                "content": "Đã xảy ra lỗi. Vui lòng thử lại.",
                "timestamp": now_vn().isoformat(),
            })
    finally:
        with contextlib.suppress(Exception):
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
        with contextlib.suppress(Exception):
            if user_id is not None:
                await manager.disconnect(websocket, chat_id, user_id)
        db.close()
        logger.info(f"WebSocket closed for user {user_id} chat {chat_id}")
