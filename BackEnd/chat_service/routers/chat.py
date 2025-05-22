import contextlib
import uuid
from service.redis_client import redis_client
import openai
import os
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from datetime import datetime
from typing import List
from db_config import db_dependency
from schemas import ChatSessionCreate, ChatSessionUpdate, ChatSessionOut, AddMessage, ChatHistoryOut, MessageOut
from crud import *
from service.violation_handler import contains_violation, process_violation, sync_strike_from_db
from models import ChatSession, ChatHistory
from connect_service import get_current_user, validate_token_from_query
from dotenv import load_dotenv
from jose import JWTError
from routers.openai_utils import generate_response, generate_title

router = APIRouter(prefix="/api/chatbot_service",tags=["chatbot"])
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/chat/", response_model=ChatSessionOut)
def create_chat(chat_data: ChatSessionCreate, db:db_dependency, user=Depends(get_current_user)):
    chat_data.user_id = user["user_id"]
    return create_chat_session(db, chat_data)

@router.get("/chat/", response_model=List[ChatSessionOut])
def get_user_chats(db:db_dependency, user=Depends(get_current_user)):
    return get_chat_sessions(db, user["user_id"])

@router.get("/chat/{chat_id}", response_model=ChatHistoryOut)
def get_chat(chat_id: uuid.UUID, db:db_dependency, user=Depends(get_current_user)):
    chat = get_chat_history(db, chat_id)
    if not chat or chat.chat_session.user_id != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found or not yours")
    return chat

@router.patch("/chat/{chat_id}", response_model=ChatSessionOut)
def update_chat(chat_id: uuid.UUID, chat_update: ChatSessionUpdate, db:db_dependency, user=Depends(get_current_user)):
    chat = get_chat_history(db, chat_id)
    if not chat or chat.chat_session.user_id != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your chat")
    return update_chat_session(db, chat_id, chat_update)

@router.delete("/chat/{chat_id}")
def delete_chat(chat_id: uuid.UUID, db:db_dependency, user=Depends(get_current_user)):
    chat = get_chat_history(db, chat_id)
    if not chat or chat.chat_session.user_id != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your chat")
    delete_all_messages(db, chat_id)
    delete_chat_session(db, chat_id)
    return {"detail": "Chat deleted"}

@router.delete("/message/{message_id}")
def delete_one_message(message_id: uuid.UUID, db:db_dependency, user=Depends(get_current_user)):
    msg = db.query(ChatHistory).filter(ChatHistory.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    chat = db.query(ChatSession).filter(ChatSession.id == msg.chat_id).first()
    if chat.user_id != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your message")
    delete_message(db, message_id)
    return {"detail": "Message deleted"}

# --------------------- WebSocket ---------------------

@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: uuid.UUID, db: db_dependency):
    try:
        user_data = await validate_token_from_query(websocket)
        if not user_data:
            return
        user_id = user_data.get("user_id")
        print("🔑 User ID:", user_id, "📩 Chat ID:", chat_id)
        await sync_strike_from_db(user_id, db)
    except JWTError:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    chat_session = db.query(ChatSession).filter(ChatSession.id == chat_id, ChatSession.user_id == user_id).first()
    if not chat_session:
        await websocket.close(code=1008)
        return
    chat_log = [{"role": "system", "content": "You are a helpful assistant that replies clearly and concisely."}]
    messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).order_by(ChatHistory.created_at).all()
    for m in messages:
        chat_log.append({"role": m.role, "content": m.content})
    try:
        while True:
            user_input = await websocket.receive_text()
            ban_key = f"chat_ban:{user_id}"
            if await redis_client.exists(ban_key):
                await websocket.send_text("Bạn đang bị cấm chat tạm thời do vi phạm nội dung.")
                continue
            if await contains_violation(user_input):
                await websocket.send_text("Tin nhắn của bạn chứa từ ngữ vi phạm. Vui lòng không sử dụng ngôn từ này.")
                await process_violation(websocket, user_input, db, user_data)
                continue
            timestamp = datetime.utcnow()
            add_message_to_chat(db, AddMessage(
                chat_id=chat_id,
                role="user",
                content=user_input,
                timestamp=timestamp
            ))
            await websocket.send_json({
                "role": "user",
                "content": user_input,
                "timestamp": timestamp.isoformat()
            })
            chat_log.append({"role": "user", "content": user_input})
            stream = await generate_response(chat_log)
            assistant_reply = ""
            buffer = ""
            reply_timestamp = datetime.utcnow()
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    text = delta.content
                    assistant_reply += text
                    buffer += text
                    if any(text.endswith(punct) for punct in [".", "!", "?", "…", "。", "！", "？"]):
                        await websocket.send_json({
                            "role": "assistant",
                            "content": buffer.strip(),
                            "timestamp": reply_timestamp.isoformat()
                        })
                        buffer = ""
            if buffer.strip():
                await websocket.send_json({
                    "role": "assistant",
                    "content": buffer.strip(),
                    "timestamp": reply_timestamp.isoformat()
                })
            add_message_to_chat(db, AddMessage(
                chat_id=chat_id,
                role="assistant",
                content=assistant_reply,
                timestamp=reply_timestamp
            ))
            chat_log.append({"role": "assistant", "content": assistant_reply})
            # ✅ Cập nhật tiêu đề nếu là tin nhắn đầu tiên
            if chat_session.title == "New Chat":
                new_title = await generate_title(user_input)
                update_chat_session(db, chat_id, ChatSessionUpdate(title=new_title))
                await websocket.send_json({
                    "role": "system",
                    "event": "TITLE_UPDATED",
                    "title": new_title
                })
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for chat {chat_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.send_json({
            "role": "system",
            "content": "An error occurred. Please try again.",
            "timestamp": datetime.utcnow().isoformat()
        })
    finally:
        with contextlib.suppress(Exception):
            await websocket.close()


