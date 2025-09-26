import contextlib
import traceback
import uuid
import asyncio
import openai
import os
import datetime
from sqlalchemy import func
from crud import *
from typing import List
from dotenv import load_dotenv
from jose import JWTError
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from service.redis_client import redis_client
from db_config import SessionLocal, db_dependency
from schemas import ChatSessionUpdate, ChatSessionOut, AddMessage, ChatHistoryOut, AllChatUsersResponse, UserDetailOut, SessionWithMessageOut
from starlette.websockets import WebSocketState
from service.violation_handler import contains_violation, process_violation
from models import ChatSession, ChatHistory
from connect_service import get_current_user, validate_token_from_query, get_user
from routers.openai_utils import generate_response, generate_title
from sockets.connection_manager import ConnectionManager
router = APIRouter(prefix="/api/chatbot_service",tags=["chatbot"])
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
VN_TIMEZONE = datetime.timezone(datetime.timedelta(hours=7))
timestamp = datetime.datetime.now(VN_TIMEZONE)
manager = ConnectionManager()
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
    db: Session = SessionLocal()  # tạo session mới cho mỗi kết nối websocket
    try:
        user_data = await validate_token_from_query(websocket)
        if not user_data:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return
    user_id = user_data.get("user_id") or user_data.get("sub")
    chat_session = db.query(ChatSession).filter(
        ChatSession.id == chat_id,
        ChatSession.user_id == int(user_id)
    ).first()
    if not chat_session:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    await manager.connect(websocket, chat_id, user_id)
    chat_log = [{"role": "system", "content": "You are a helpful assistant that replies clearly and concisely."}]
    messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).order_by(ChatHistory.created_at).all()
    for m in messages:
        chat_log.append({"role": m.role, "content": m.content})
    try:
        while True:
            if websocket.client_state != WebSocketState.CONNECTED:
                break
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                break
            except Exception:
                break
            action = data.get("action")
            content = data.get("content")
            if action == "typing":
                await manager.broadcast(
                    chat_id,
                    {
                        "event": "TYPING",
                        "user_id": user_id
                    },
                    skip_user_id=user_id  # không gửi lại cho chính người đang gõ
                )
                continue
            if action != "sendMessage" or not content:
                continue
            user_input = content
            timestamp = datetime.datetime.now(VN_TIMEZONE)
            # Check ban
            ban_key = f"chat_ban:{user_id}"
            if await redis_client.exists(ban_key):
                await websocket.send_json({
                    "role": "system",
                    "content": "Bạn đang bị cấm chat tạm thời do vi phạm nội dung.",
                    "timestamp": timestamp.isoformat()
                })
                continue
            # Check violation
            if await contains_violation(user_input):
                await process_violation(websocket, user_input, db, user_data)
                continue
            # Save user message
            add_message_to_chat(db, AddMessage(
                chat_id=chat_id,
                role="user",
                content=user_input,
                timestamp=timestamp
            ))
            db.commit()  # commit ngay sau khi thêm tin nhắn
            await websocket.send_json({
                "role": "user",
                "content": user_input,
                "violations": [],
                "timestamp": timestamp.isoformat()
            })
            await manager.broadcast(
                chat_id, {
                    "role": "user",
                    "content": user_input,
                    "timestamp": timestamp.isoformat()
                },
                skip_user_id=user_id
            )
            chat_log.append({"role": "user", "content": user_input})
            # Generate AI response
            stream = await generate_response(chat_log)
            assistant_reply = ""
            buffer = ""
            reply_timestamp = datetime.datetime.now(VN_TIMEZONE)
            last_send_time = datetime.datetime.now(VN_TIMEZONE)
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if not delta.content:
                    continue
                text = delta.content
                assistant_reply += text
                buffer += text
                now = datetime.datetime.now(VN_TIMEZONE)
                if any(buffer.endswith(punct) for punct in [".", "!", "?", "…", "。", "！", "？"]) \
                or len(buffer) >= 10 \
                or (now - last_send_time).total_seconds() > 1.0:
                    await websocket.send_json({
                        "role": "assistant",
                        "content": buffer,
                        "timestamp": now.isoformat()
                    })
                    buffer = ""
                    last_send_time = now
            if buffer.strip():
                await websocket.send_json({
                    "role": "assistant",
                    "content": buffer,
                    "timestamp": datetime.datetime.now(VN_TIMEZONE).isoformat()
                })
            await websocket.send_json({
                "event": "DONE",
                "timestamp": datetime.datetime.now(VN_TIMEZONE).isoformat()
            })
            # Save assistant message
            add_message_to_chat(db, AddMessage(
                chat_id=chat_id,
                role="assistant",
                content=assistant_reply,
                timestamp=reply_timestamp
            ))
            db.commit()
            chat_log.append({"role": "assistant", "content": assistant_reply})
            # Update title nếu cần
            if chat_session.title in ["New Chat", "Cuộc trò chuyện mới"]:
                new_title = await generate_title([user_input, assistant_reply])
                update_chat_session(db, chat_id, ChatSessionUpdate(title=new_title))
                db.commit()
                await websocket.send_json({
                    "role": "system",
                    "event": "TITLE_UPDATED",
                    "title": new_title
                })
    except Exception as e:
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json({
                "role": "system",
                "content": "An error occurred. Please try again.",
                "timestamp": datetime.datetime.now(VN_TIMEZONE).isoformat()
            })
    finally:
        if websocket.client_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await websocket.close()
        await manager.disconnect(websocket, chat_id, user_id)
        db.close()