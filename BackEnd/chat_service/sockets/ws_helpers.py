import contextlib
import datetime
import logging
from typing import Any, Dict, List
import uuid
from fastapi import WebSocket
from starlette.websockets import WebSocketState
from models import ChatSession
from service.redis_client import redis_client
from db_config import db_dependency
from service.violation_handler import contains_violation, process_violation
from routers.openai_utils import generate_response, generate_title
from crud import add_message_to_chat, update_chat_session
from schemas import AddMessage, ChatSessionUpdate
from sockets.connection_manager import ConnectionManager

logger = logging.getLogger("chatbot.websocket")

# THời gian VN
VN_TIMEZONE = datetime.timezone(datetime.timedelta(hours=7))
manager = ConnectionManager()

def now_vn() -> datetime.datetime:
    return datetime.datetime.now(VN_TIMEZONE)


async def handle_typing(manager: ConnectionManager, chat_id: uuid.UUID, user_id: int) -> None:
    """Gửi sự kiện typing tới các client khác trong cùng chat"""
    payload = {"event": "TYPING", "user_id": user_id, "timestamp": now_vn().isoformat()}
    await manager.broadcast(chat_id, payload, skip_user_id=user_id)
    logger.debug(f"Gửi thông báo 'đang nhập' cho người dùng {user_id} trong cuộc trò chuyện {chat_id}.")


async def stream_ai_response(
    websocket: WebSocket,
    db: db_dependency,
    chat_id: uuid.UUID,
    chat_log: List[Dict[str, Any]],
    user_id: int,
) -> str:
    """
    Gọi generate_response(chat_log) -> trả về async iterator.
    Gửi các chunk tới client, dùng buffer logic (dấu câu / length / timeout).
    Trả về toàn bộ assistant_reply (string).
    """
    assistant_reply = ""
    buffer = ""
    last_send_time = now_vn()

    # generate_response là hàm async trả về async iterator/stream
    stream = await generate_response(chat_log)

    try:
        async for chunk in stream:
            # chunk cấu trúc phụ thuộc implement của bạn; giữ cách bạn đang dùng
            try:
                delta = chunk.choices[0].delta
            except Exception:
                # fallback: chunk may be a plain dict-like
                delta = getattr(chunk, "delta", None) or (chunk.get("delta") if isinstance(chunk, dict) else None)

            if not getattr(delta, "content", None):
                continue

            text = delta.content
            assistant_reply += text
            buffer += text
            now = now_vn()

            should_flush = (
                any(buffer.endswith(p) for p in [".", "!", "?", "…", "。", "！", "？"]) or
                len(buffer) >= 80 or  # send chunk after 80 chars to reduce latency
                (now - last_send_time).total_seconds() > 1.5
            )

            if should_flush:
                payload = {"role": "assistant", "content": buffer, "timestamp": now.isoformat()}
                if websocket.client_state == WebSocketState.CONNECTED:
                    with contextlib.suppress(Exception):
                        await websocket.send_json(payload)
                # broadcast cho những client khác cùng chat
                await manager.broadcast(chat_id, payload, skip_user_id=user_id)
                buffer = ""
                last_send_time = now

    except Exception as e:
        logger.exception("Error while streaming AI response: %s", e)
        # báo lỗi cho client
        if websocket.client_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await websocket.send_json({"role": "system", "content": "Error streaming AI response.", "timestamp": now_vn().isoformat()})
        # re-raise để caller xử lý (nếu cần)
        raise

    # send remainder
    if buffer.strip():
        payload = {"role": "assistant", "content": buffer, "timestamp": now_vn().isoformat()}
        if websocket.client_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await websocket.send_json(payload)
        await manager.broadcast(chat_id, payload, skip_user_id=user_id)

    # DONE event
    if websocket.client_state == WebSocketState.CONNECTED:
        with contextlib.suppress(Exception):
            await websocket.send_json({"event": "DONE", "timestamp": now_vn().isoformat()})

    return assistant_reply


async def handle_send_message(
    websocket: WebSocket,
    db: db_dependency,
    chat_id: uuid.UUID,
    chat_log: List[Dict[str, Any]],
    chat_session: ChatSession,
    user_id: int,
    user_input: str,
    user_data: Dict[str, Any],
) -> None:
    """
    Toàn bộ flow khi nhận action sendMessage:
    - check ban
    - check violation -> process_violation
    - save user message
    - broadcast user message
    - stream AI response (gọi stream_ai_response)
    - save assistant message
    - update title nếu cần (chỉ khi là chat mới)
    """
    timestamp = now_vn()

    # Check ban
    ban_key = f"chat_ban:{user_id}"
    if await redis_client.exists(ban_key):
        logger.info(f"Người dùng {user_id} đã bị cấm truy cập (mã cấm: {ban_key}).")
        if websocket.client_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await websocket.send_json({
                    "role": "system",
                    "content": "Bạn đang bị cấm chat tạm thời do vi phạm nội dung.",
                    "timestamp": timestamp.isoformat(),
                })
        return

    # Kiểm tra vi phạm
    if await contains_violation(user_input):
        logger.info(f"Phát hiện hành vi vi phạm của người dùng {user_id}.")
        await process_violation(websocket, user_input, db, user_data)

    # Lưu tin nhắn của người dùng (transaction-safe)
    try:
        add_message_to_chat(db, AddMessage(chat_id=chat_id, role="user", content=user_input, timestamp=timestamp))
        db.commit()
        logger.debug(f"Đã lưu tin nhắn của người dùng {user_id} trong đoạn chat {chat_id}.")
    except Exception:
        db.rollback()
        logger.exception("Không thể lưu tin nhắn user")

    # Gửi phản hồi hoặc phát tin nhắn tới các client.
    user_payload = {"role": "user", "content": user_input, "violations": [], "timestamp": timestamp.isoformat()}
    if websocket.client_state == WebSocketState.CONNECTED:
        with contextlib.suppress(Exception):
            await websocket.send_json(user_payload)
    await manager.broadcast(chat_id, user_payload, skip_user_id=user_id)

    # Thêm tin nhắn vào nhật ký trò chuyện cục bộ để làm ngữ cảnh cho mô hình AI
    chat_log.append({"role": "user", "content": user_input})

    # Truyền phản hồi của AI theo luồng
    assistant_reply = ""
    try:
        assistant_reply = await stream_ai_response(websocket, db, chat_id, chat_log, user_id)
    except Exception:
        logger.exception("Truyền phản hồi AI thất bại")
        return

    # Lưu tin nhắn của trợ lý (assistant)
    try:
        add_message_to_chat(db, AddMessage(chat_id=chat_id, role="assistant", content=assistant_reply, timestamp=now_vn()))
        db.commit()
        chat_log.append({"role": "assistant", "content": assistant_reply})
        logger.debug("Phản hồi của trợ lý đã được lưu vào cơ sở dữ liệu")
    except Exception:
        db.rollback()
        logger.exception("Không thể lưu tin nhắn assistant")

    # 🧠 CẬP NHẬT TIÊU ĐỀ (có cache với Redis)
    try:
        # Nếu DB có tiêu đề mặc định hoặc rỗng -> thử generate
        cur_title = (getattr(chat_session, "title", None) or "").strip()
        if cur_title in ["", "New Chat", "Cuộc trò chuyện mới"]:
            # Kiểm tra cache Redis trước
            title_cache_key = f"chat_title:{chat_id}"
            try:
                cached = await redis_client.get(title_cache_key)
            except Exception:
                cached = None

            if cached:
                new_title = cached.decode() if isinstance(cached, (bytes, bytearray)) else str(cached)
                logger.debug(f"Lấy tiêu đề từ cache Redis: {new_title}")
            else:
                title_context = [{"role": "user", "content": user_input}, {"role": "assistant", "content": assistant_reply}]
                new_title = await generate_title(title_context)
                # Lưu cache (nếu hợp lệ)
                if new_title and new_title not in ["New Chat", "Cuộc trò chuyện mới"]:
                    try:
                        # lưu không TTL (persistent) - bạn có thể thêm TTL nếu muốn
                        await redis_client.set(title_cache_key, new_title)
                    except Exception:
                        logger.warning("Không thể lưu title vào Redis")

            # Cập nhật DB nếu title hợp lệ
            if new_title and new_title not in ["New Chat", "Cuộc trò chuyện mới"]:
                try:
                    update_chat_session(db, chat_id, ChatSessionUpdate(title=new_title))
                    db.commit()
                    if websocket.client_state == WebSocketState.CONNECTED:
                        with contextlib.suppress(Exception):
                            await websocket.send_json({"role": "system", "event": "TITLE_UPDATED", "title": new_title})
                    logger.info(f"Đã cập nhật tiêu đề cho cuộc trò chuyện {chat_id} -> {new_title}")
                except Exception:
                    db.rollback()
                    logger.exception("Không thể cập nhật tiêu đề trong DB")
    except Exception as e:
        logger.warning(f"Không thể cập nhật tiêu đề cuộc trò chuyện: {e}")
