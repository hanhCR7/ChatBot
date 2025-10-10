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
from service.redis_client import redis_client
from db_config import SessionLocal, db_dependency
from schemas import ChatSessionUpdate, ChatSessionOut, ChatHistoryOut, AllChatUsersResponse, UserDetailOut, SessionWithMessageOut
from starlette.websockets import WebSocketState
from models import ChatSession, ChatHistory
from connect_service import get_current_user, validate_token_from_query, get_user
from sockets.connection_manager import ConnectionManager
from sockets.ws_helpers import handle_send_message, handle_typing, now_vn
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
            user_data = info.get("user") or {}
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
    user_data = user_response.get("user")
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
        chat_data = ChatSessionCreate(
            user_id=user["user_id"],
            title=chat_session.title or "New Chat"
        )
        return create_chat_session(db, chat_data)
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
        # 1. Auth
        try:
            user_data = await validate_token_from_query(websocket)
            if not user_data:
                await websocket.close(code=1008)
                return
            user_id = int(user_data.get("user_id") or user_data.get("sub"))
        except JWTError:
            logger.warning("Xác thực JWT cho WebSocket thất bại")
            await websocket.close(code=1008)
            return

        # 2. Kiểm tra quyền sở hữu phiên trò chuyện (chat_session)
        chat_session = db.query(ChatSession).filter(
            ChatSession.id == chat_id,
            ChatSession.user_id == user_id,
        ).first()
        if not chat_session:
            logger.warning(f"Truy cập WebSocket không được phép: user {user_id} -> chat {chat_id}")
            await websocket.close(code=1008)
            return

        # 3. Chấp nhận và kết nối
        await websocket.accept()
        await manager.connect(websocket, chat_id, user_id)
        logger.info(f"User {user_id} connected to chat {chat_id}")

        # 4. Tải lịch sử trò chuyện giới hạn (chỉ lấy N tin nhắn gần nhất để tiết kiệm token)
        N_CONTEXT = 40
        chat_log: List[Dict[str, Any]] = [{"role": "system", "content": "Bạn là một trợ lý hữu ích, phản hồi rõ ràng và súc tích."}]
        messages = (
            db.query(ChatHistory)
            .filter(ChatHistory.chat_id == chat_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(N_CONTEXT)
            .all()
        )
        for m in reversed(messages):
            chat_log.append({"role": m.role, "content": m.content})

        # 5. Vòng lặp chính
        while websocket.client_state == WebSocketState.CONNECTED:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                logger.info(f"WebSocket bị ngắt kết nối bởi client: user {user_id}, chat {chat_id}")
                break
            except Exception as e:
                # Không đóng socket vì một JSON không hợp lệ; tiếp tục lắng nghe
                logger.exception("Lỗi khi nhận dữ liệu JSON từ WebSocket: %s", e)
                continue

            action = data.get("action")
            content = data.get("content")

            if action == "typing":
                await handle_typing(manager, chat_id, user_id)
                continue

            if action != "sendMessage" or not content:
                # Bỏ qua các hành động không xác định
                continue

            # Giao toàn bộ quy trình gửi tin nhắn cho hàm hỗ trợ (helper)
            await handle_send_message(
                websocket=websocket,
                db=db,
                chat_id=chat_id,
                chat_log=chat_log,
                chat_session=chat_session,
                user_id=user_id,
                user_input=content,
                user_data=user_data,
            )

    except Exception as e:
        logger.exception("Fatal websocket error: %s", e)
        if websocket.client_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await websocket.send_json({
                    "role": "system",
                    "content": "Đã xảy ra lỗi. Vui lòng thử lại.",
                    "timestamp": now_vn().isoformat(),
                })
    finally:
        with contextlib.suppress(Exception):
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
        # đảm bảo disconnect khỏi manager
        with contextlib.suppress(Exception):
            if user_id is not None:
                await manager.disconnect(websocket, chat_id, user_id)
        db.close()
        logger.info(f"Đã đóng kết nối WebSocket cho người dùng {user_id} chat {chat_id}")
