import contextlib
import datetime
import uuid
import openai
import os
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import List
from db_config import db_dependency
from schemas import ChatSessionCreate, ChatSessionUpdate, ChatSessionOut, AddMessage, ChatHistoryOut, MessageOut
from crud import *
from models import ChatSession, ChatHistory
from connect_service import get_current_user, validate_token_from_query
from dotenv import load_dotenv
from jose import JWTError

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
        raise HTTPException(status_code=404, detail="Chat not found or not yours")
    return chat

@router.patch("/chat/{chat_id}", response_model=ChatSessionOut)
def update_chat(chat_id: uuid.UUID, chat_update: ChatSessionUpdate, db:db_dependency, user=Depends(get_current_user)):
    chat = get_chat_history(db, chat_id)
    if not chat or chat.chat_session.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your chat")
    return update_chat_session(db, chat_id, chat_update)

@router.delete("/chat/{chat_id}")
def delete_chat(chat_id: uuid.UUID, db:db_dependency, user=Depends(get_current_user)):
    chat = get_chat_history(db, chat_id)
    if not chat or chat.chat_session.user_id != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your chat")
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
        raise HTTPException(status_code=403, detail="Not your message")
    delete_message(db, message_id)
    return {"detail": "Message deleted"}

# --------------------- WebSocket ---------------------

@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: uuid.UUID, db: db_dependency):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        user_data = await validate_token_from_query(token)
        user_id = user_data.get("user_id")
    except JWTError:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    chat_session = db.query(ChatSession).filter(
        ChatSession.id == chat_id, ChatSession.user_id == user_id
    ).first()
    if not chat_session:
        await websocket.close(code=1008)
        return

    # System prompt
    chat_log = [{"role": "system", "content": "You are a helpful assistant that replies clearly and concisely."}]

    # Load previous messages
    messages = db.query(ChatHistory).filter(ChatHistory.chat_id == chat_id).order_by(ChatHistory.created_at).all()
    for m in messages:
        chat_log.append({"role": m.role, "content": m.content})

    try:
        while True:
            user_input = await websocket.receive_text()
            timestamp = datetime.utcnow()
            add_message_to_chat(db, AddMessage(chat_id=chat_id, role="user", content=user_input, timestamp=timestamp))

            await websocket.send_json({
                "role": "user",
                "content": user_input,
                "timestamp": timestamp.isoformat()
            })

            chat_log.append({"role": "user", "content": user_input})

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=chat_log,
                temperature=0.5,
                stream=True
            )

            assistant_reply = ""
            buffer = ""
            reply_timestamp = datetime.utcnow()

            async for chunk in response:
                if chunk.choices[0].delta.get("content"):
                    text = chunk.choices[0].delta["content"]
                    buffer += text
                    assistant_reply += text
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


