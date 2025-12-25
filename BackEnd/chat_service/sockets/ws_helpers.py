import contextlib
import datetime
import logging
import os
import uuid
from typing import Any, Dict, List
from fastapi import WebSocket
from starlette.websockets import WebSocketState
import httpx
from models import ChatSession
from service.redis_client import redis_client
from db_config import db_dependency
from service.violation_handler import contains_violation, process_violation, get_user_strike_count, is_user_banned_from_chat
from routers.openai_utils import generate_response, generate_title
from crud import add_message_to_chat, update_chat_session
from schemas import AddMessage, ChatSessionUpdate
from sockets.connection_manager import ConnectionManager

logger = logging.getLogger("chatbot.websocket")

# THời gian VN
VN_TIMEZONE = datetime.timezone(datetime.timedelta(hours=7))
manager = ConnectionManager()
UPLOAD_DIR = "upload/files"

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
    """Gửi phản hồi AI theo luồng (streaming), tự buffer theo dấu câu / thời gian."""
    assistant_reply = ""
    buffer = ""
    last_send_time = now_vn()

    stream = await generate_response(chat_log)

    async def send_payload(payload: dict):
        try:
            if websocket and getattr(websocket, "client_state", None) == WebSocketState.CONNECTED:
                await websocket.send_json(payload)
            else:
                await manager.broadcast(chat_id, payload)
        except Exception:
            logger.debug("Không thể gửi payload tới client", exc_info=True)

    try:
        async for chunk in stream:
            # Lấy text từ chunk stream
            try:
                delta = chunk.choices[0].delta
                text = getattr(delta, "content", None)
            except Exception:
                continue

            if not text:
                continue

            assistant_reply += text
            buffer += text
            now = now_vn()

            # Flush khi đủ độ dài / có dấu câu / quá thời gian
            should_flush = (
                len(buffer) >= 40
                or (now - last_send_time).total_seconds() > 1.5
                or any(buffer.endswith(p) for p in [".", "!", "?", "…", "。", "！", "？"])
            )

            if should_flush:
                await send_payload({
                    "role": "assistant",
                    "content": buffer,
                    "streaming": True,
                    "timestamp": now.isoformat(),
                })
                buffer = ""
                last_send_time = now

        # Nếu còn phần đệm
        if buffer.strip():
            await send_payload({
                "role": "assistant",
                "content": buffer,
                "streaming": False,
                "timestamp": now_vn().isoformat(),
            })

        # Thông báo hoàn tất
        done_payload = {"event": "DONE", "timestamp": now_vn().isoformat()}
        await manager.broadcast(chat_id, done_payload)
        if websocket and getattr(websocket, "client_state", None) == WebSocketState.CONNECTED:
            await websocket.send_json(done_payload)
        
        # Lưu kết quả hoàn chỉnh (chỉ khi có nội dung)
        if assistant_reply and assistant_reply.strip():
            try:
                add_message_to_chat(db, AddMessage(chat_id=chat_id, role="assistant", content=assistant_reply, timestamp=now_vn().isoformat()))
            except Exception as save_error:
                logger.exception("Không thể lưu phản hồi assistant vào DB: %s", save_error)
                # Không raise để không làm gián đoạn flow, nhưng log lại để theo dõi
        
        return assistant_reply
    except (httpx.RemoteProtocolError, httpx.ReadTimeout, httpx.ConnectError, httpx.NetworkError) as network_error:
        # Xử lý lỗi network/protocol một cách graceful
        logger.warning("Lỗi kết nối khi stream AI response: %s. Đã nhận được %d ký tự.", network_error, len(assistant_reply))
        
        # Gửi phần buffer còn lại nếu có
        if buffer.strip():
            await send_payload({
                "role": "assistant",
                "content": buffer,
                "streaming": False,
                "timestamp": now_vn().isoformat(),
            })
        
        # Nếu đã có một phần response, vẫn lưu và thông báo
        if assistant_reply and assistant_reply.strip():
            try:
                add_message_to_chat(db, AddMessage(chat_id=chat_id, role="assistant", content=assistant_reply, timestamp=now_vn().isoformat()))
            except Exception as save_error:
                logger.exception("Không thể lưu phản hồi assistant vào DB: %s", save_error)
            
            # Thông báo cho user biết response bị cắt
            await send_payload({
                "role": "system",
                "content": "Kết nối bị ngắt, nhưng đã nhận được một phần phản hồi. Vui lòng thử lại nếu cần.",
                "timestamp": now_vn().isoformat(),
            })
        else:
            # Nếu chưa nhận được gì, thông báo lỗi
            await send_payload({
                "role": "system",
                "content": "Lỗi kết nối khi nhận phản hồi từ AI. Vui lòng thử lại.",
                "timestamp": now_vn().isoformat(),
            })
        
        # Gửi event DONE để frontend biết stream đã kết thúc
        done_payload = {"event": "DONE", "timestamp": now_vn().isoformat()}
        await manager.broadcast(chat_id, done_payload)
        if websocket and getattr(websocket, "client_state", None) == WebSocketState.CONNECTED:
            try:
                await websocket.send_json(done_payload)
            except Exception:
                pass
        
        # Trả về phần đã nhận được (nếu có) thay vì raise exception
        return assistant_reply
    except Exception as e:
        logger.exception("Lỗi khi stream phản hồi AI: %s", e)
        
        # Gửi phần buffer còn lại nếu có
        if buffer.strip():
            await send_payload({
                "role": "assistant",
                "content": buffer,
                "streaming": False,
                "timestamp": now_vn().isoformat(),
            })
        
        # Nếu đã có một phần response, vẫn lưu
        if assistant_reply and assistant_reply.strip():
            try:
                add_message_to_chat(db, AddMessage(chat_id=chat_id, role="assistant", content=assistant_reply, timestamp=now_vn().isoformat()))
            except Exception:
                pass
        
        await send_payload({
            "role": "system",
            "content": "Lỗi khi phản hồi AI. Vui lòng thử lại.",
            "timestamp": now_vn().isoformat(),
        })
        
        # Gửi event DONE
        done_payload = {"event": "DONE", "timestamp": now_vn().isoformat()}
        await manager.broadcast(chat_id, done_payload)
        if websocket and getattr(websocket, "client_state", None) == WebSocketState.CONNECTED:
            try:
                await websocket.send_json(done_payload)
            except Exception:
                pass
        
        # Trả về phần đã nhận được thay vì raise
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
    # Hàm tiện ích dùng để gửi dữ liệu (payload) thông qua WebSocket hoặc broadcast.
    async def send_to_clients(payload: str, skip_user: int = None) -> None:
        try:
            if websocket and getattr(websocket, "client_state", None) == WebSocketState.CONNECTED:
                with contextlib.suppress(Exception):
                    await websocket.send_json(payload)
            # Phát đến các client khác (hoặc tất cả nếu skip_user_id là None). Lớp Manager đã hỗ trợ tham số skip_user_id.
            await manager.broadcast(chat_id, payload, skip_user_id=skip_user)
        except Exception:
            logger.warning("Không thể gửi dữ liệu đến các client (qua websocket hoặc broadcast).", exc_info=True)     
    # Kiểm tra vi phạm TRƯỚC (để tăng strike nếu có vi phạm mới)
    has_violation = await contains_violation(user_input)
    logger.info(f"Kiểm tra vi phạm cho message: '{user_input}' - Kết quả: {has_violation}")
    if has_violation:
        logger.info(f"Phát hiện hành vi vi phạm của người dùng {user_id}. Message: {user_input}")
        await process_violation(websocket, user_input, db, user_data, chat_id)
        logger.info(f"Đã xử lý vi phạm và gửi violation message cho user {user_id}")
        # Return sớm để không lưu message vi phạm vào DB
        return
    
    # Sau khi check violation, kiểm tra ban (strike có thể đã tăng sau khi process_violation)
    is_banned = await is_user_banned_from_chat(user_id)
    strike_count = await get_user_strike_count(user_id, db)
    
    # Nếu user có >= 4 lần vi phạm, chặn hoàn toàn
    if strike_count >= 4:
        await send_to_clients({
            "role": "system",
            "type": "violation",
            "content": "Tài khoản của bạn đã bị khóa do vi phạm nhiều lần. Vui lòng liên hệ admin để được hỗ trợ.",
            "level": 4,
            "ban_time": 86400,
            "timestamp": timestamp.isoformat(),
        }, skip_user=user_id)
        logger.info("User %s bị chặn do có %d lần vi phạm", user_id, strike_count)
        return
    
    # Nếu đang bị ban (strike >= 2), chặn chat
    if is_banned or strike_count >= 2:
        violation_message = "Bạn đang bị cấm chat do vi phạm nội dung. "
        if strike_count == 2:
            violation_message += "Bạn bị cấm chat 5 phút (vi phạm lần 2)."
        elif strike_count == 3:
            violation_message += "Bạn bị cấm chat 1 giờ (vi phạm lần 3)."
        
        await send_to_clients({
            "role": "system",
            "type": "violation",
            "content": violation_message,
            "level": strike_count,
            "ban_time": 300 if strike_count == 2 else 3600 if strike_count == 3 else 0,
            "timestamp": timestamp.isoformat(),
        }, skip_user=user_id)
        logger.info("User %s bị cấm chat (strike: %d, banned: %s) - Chặn không cho gửi tin nhắn", user_id, strike_count, is_banned)
        # Return ngay để chặn không cho gửi tin nhắn khi đang bị ban
        return

    # Lưu tin nhắn của người dùng (transaction-safe)
    user_message_saved = False
    try:
        add_message_to_chat(db, AddMessage(chat_id=chat_id, role="user", content=user_input, timestamp=timestamp))
        # add_message_to_chat đã tự commit, không cần commit lại
        user_message_saved = True
        logger.debug(f"Đã lưu tin nhắn của người dùng {user_id} trong đoạn chat {chat_id}.")
    except Exception:
        db.rollback()
        logger.exception("Không thể lưu tin nhắn user")
        # Không return ngay, vẫn broadcast để user biết message đã được gửi
        # nhưng log warning để theo dõi

    # Gửi phản hồi hoặc phát tin nhắn tới các client.
    # Chỉ broadcast nếu đã lưu thành công hoặc nếu muốn hiển thị ngay cả khi lưu fail
    user_payload = {"role": "user", "content": user_input, "violations": [], "timestamp": timestamp.isoformat()}
    await send_to_clients(user_payload, skip_user=user_id)
    
    # Nếu không lưu được, log warning nhưng vẫn tiếp tục để user có trải nghiệm tốt
    if not user_message_saved:
        logger.warning(f"User message không được lưu vào DB nhưng vẫn được broadcast cho user {user_id}")

    # Thêm tin nhắn vào nhật ký trò chuyện cục bộ để làm ngữ cảnh cho mô hình AI
    chat_log.append({"role": "user", "content": user_input})

    # Truyền phản hồi của AI theo luồng
    assistant_reply = ""
    try:
        assistant_reply = await stream_ai_response(websocket, db, chat_id, chat_log, user_id)
    except Exception:
        logger.exception("Truyền phản hồi AI thất bại")
        return

    # Cập nhật chat_log với phản hồi của assistant (message đã được lưu trong stream_ai_response)
    if assistant_reply:
        chat_log.append({"role": "assistant", "content": assistant_reply})
        logger.debug("Đã cập nhật chat_log với phản hồi của trợ lý")

    # CẬP NHẬT TIÊU ĐỀ (có cache với Redis)
    try:
        # Nếu DB có tiêu đề mặc định hoặc rỗng -> thử generate
        cur_title = (getattr(chat_session, "title", None) or "").strip()
        if cur_title in ["", "New Chat", "Cuộc trò chuyện mới"]:
            new_title = None
            # Kiểm tra cache Redis trước
            title_cache_key = f"chat_title:{chat_id}"
            try:
                cached = await redis_client.get(title_cache_key)
                if cached:
                    new_title = cached.decode() if isinstance(cached, (bytes, bytearray)) else str(cached)
                    logger.debug(f"Lấy tiêu đề từ cache Redis: {new_title}")
            except Exception as e:
                logger.debug(f"Không thể lấy title từ Redis cache: {e}")
                cached = None
            
            # Nếu không có trong cache, generate title mới
            if not new_title:
                try:
                    title_context = [
                        {"role": "user", "content": user_input}, 
                        {"role": "assistant", "content": assistant_reply}
                    ]
                    new_title = await generate_title(title_context)
                    logger.debug(f"Đã generate title mới: {new_title}")
                    
                    # Lưu cache (nếu hợp lệ)
                    if new_title and new_title not in ["New Chat", "Cuộc trò chuyện mới"]:
                        try:
                            # Lưu cache với TTL 1 giờ để tránh cache vĩnh viễn
                            await redis_client.setex(title_cache_key, 3600, new_title)
                        except Exception as e:
                            logger.warning(f"Không thể lưu title vào Redis: {e}")
                except Exception as e:
                    logger.error(f"Lỗi khi generate title: {e}")
                    new_title = None

            # Cập nhật DB nếu title hợp lệ
            if new_title and new_title.strip() and new_title not in ["New Chat", "Cuộc trò chuyện mới"]:
                try:
                    update_chat_session(db, chat_id, ChatSessionUpdate(title=new_title.strip()))
                    db.commit()
                    await send_to_clients({"role": "system", "event": "TITLE_UPDATED", "title": new_title.strip()})
                    logger.info(f"Đã cập nhật tiêu đề cho cuộc trò chuyện {chat_id} -> {new_title.strip()}")
                except Exception as e:
                    db.rollback()
                    logger.exception(f"Không thể cập nhật tiêu đề trong DB: {e}")
    except Exception as e:
        logger.warning(f"Không thể cập nhật tiêu đề cuộc trò chuyện: {e}")

