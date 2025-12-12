import asyncio
import uuid
import logging
from sqlalchemy import select
from service.redis_client import redis_client
from datetime import timezone, timedelta, datetime
from fastapi import  WebSocket
from db_config import db_dependency
from models import ViolationLog, ViolationStrike
from schemas import ViolationStrikeCreate
from connect_service import send_violation_lock_email, get_user
from service.cache import load_keywords_from_cache
from sockets.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

manager = ConnectionManager()
VN_TIMEZONE = timezone(timedelta(hours=7))
async def contains_violation(message: str) -> bool:
    """
    Kiểm tra xem message có chứa từ khóa bị cấm không.
    Sử dụng word boundary để tránh false positive (ví dụ: "class" không chứa "ass").
    """
    import re
    BANNED_KEYWORDS = await load_keywords_from_cache()
    logger.info(f"📋 Loaded banned keywords: {BANNED_KEYWORDS}")
    if not BANNED_KEYWORDS:
        logger.warning("⚠️ Không có từ khóa bị cấm nào trong database")
        return False
    
    message_lower = message.lower()
    logger.info(f"🔍 Kiểm tra message: '{message_lower}' với {len(BANNED_KEYWORDS)} từ khóa bị cấm")
    # Kiểm tra từng keyword với word boundary để tránh false positive
    for keyword in BANNED_KEYWORDS:
        # Sử dụng regex với word boundary để match chính xác từ
        pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
        if re.search(pattern, message_lower):
            logger.info(f"✅ Phát hiện từ khóa bị cấm: '{keyword}' trong message: '{message}'")
            return True
    logger.info(f"❌ Không phát hiện từ khóa bị cấm trong message: '{message}'")
    return False

async def log_violation_to_db(user_id: int, message: str, level: int, db: db_dependency):
    """Ghi lại vi phạm vào cơ sở dữ liệu."""
    violation = ViolationLog(
        user_id=user_id,
        message=message,
        level=level,
        created_at=datetime.utcnow()
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)

async def update_strike_to_db(strikes: ViolationStrikeCreate, current_strikes: int, db: db_dependency):
    """Cập nhật hoặc tạo mới số lần vi phạm trong database."""
    result = db.execute(select(ViolationStrike).where(ViolationStrike.user_id == strikes.user_id))
    strike_record = result.scalars().first()
    if strike_record:
        strike_record.strike_count = current_strikes
        strike_record.last_updated = datetime.utcnow()
    else:
        strike_record = ViolationStrike(
            user_id=strikes.user_id,
            strike_count=current_strikes,
            last_updated=datetime.utcnow()
        )
        db.add(strike_record)
    db.commit()
    db.refresh(strike_record)

async def sync_strike_from_db(user_id: int, db: db_dependency):
    """Đồng bộ số lần vi phạm từ database về Redis."""
    strike_key = f"strike:{user_id}"
    if not await redis_client.exists(strike_key):
        result = db.execute(select(ViolationStrike).where(ViolationStrike.user_id == user_id))
        strike_record = result.scalars().first()
        if strike_record:
            await redis_client.set(f"strike:{user_id}", strike_record.strike_count, ex=86400)  # TTL 1 ngày
async def process_violation(
    websocket: WebSocket,
    message: str,
    db: "db_dependency",
    user_current: dict,
    chat_id: "uuid.UUID" = None
):
    user_id = user_current['user_id']
    strike_key = f"strike:{user_id}"
    ban_key = f"chat_ban:{user_id}"

    VIOLATION_LEVELS = {
        1: {"message": "Cảnh báo: Vui lòng không sử dụng ngôn từ vi phạm.", "ban_time": 0},
        2: {"message": "Bạn bị cấm chat 5 phút (vi phạm lần 2).", "ban_time": 300},
        3: {"message": "Bạn bị cấm chat 1 giờ (vi phạm lần 3).", "ban_time": 3600},
        4: {"message": "Tài khoản của bạn đã bị khóa do vi phạm nhiều lần.", "ban_time": 86400}
    }

    # --- Tăng strike trên Redis ---
    current_strikes = int(await redis_client.incr(strike_key))
    await redis_client.expire(strike_key, 86400)

    # Xác định level
    level = min(current_strikes, max(VIOLATION_LEVELS.keys()))
    level_info = VIOLATION_LEVELS[level]

    # Nếu có ban_time > 0 thì đặt key cấm chat
    if level_info["ban_time"] > 0:
        await redis_client.set(ban_key, 1, ex=level_info["ban_time"])

    # --- Gửi payload violation ngay lập tức ---
    violation_payload = {
        "type": "violation",
        "role": "system",
        "user_id": user_id,
        "level": level,
        "message": level_info["message"],
        "ban_time": level_info["ban_time"],
        "violations": [message],
        "timestamp": datetime.now(VN_TIMEZONE).isoformat()
    }
    logger.info(f"📤 Gửi violation payload: {violation_payload}")
    try:
        await websocket.send_json(violation_payload)
        logger.info(f"✅ Đã gửi violation message thành công cho user {user_id}")
    except Exception as e:
        logger.error(f"❌ Lỗi khi gửi violation message: {e}")
    # --- Broadcast cho phòng nếu chat_id được truyền ---
    if chat_id:
        asyncio.create_task(manager.broadcast(
            chat_id,
            {**violation_payload, "type": "alert"},
            skip_user_id=user_id
        ))
    # --- Log DB và update strike không block WebSocket ---
    async def log_and_update():
        try:
            await update_strike_to_db(ViolationStrikeCreate(user_id=user_id), current_strikes, db)
            await log_violation_to_db(user_id, message, current_strikes, db)
        except Exception as e:
            print("⚠️ DB log error:", e)
    asyncio.create_task(log_and_update())
    # --- Gửi email khóa account nếu strike >= 4 ---
    if current_strikes >= 4:
        async def send_lock_email():
            try:
                # Lấy thông tin user để gửi email
                user_info = await get_user(user_id)
                if user_info:
                    email = user_info.get("email", "")
                    username = user_info.get("username", user_info.get("first_name", "Người dùng"))
                    await send_violation_lock_email(email, username, '1 ngày')
            except Exception as e:
                logger.exception(f"Lỗi khi gửi email thông báo khóa tài khoản cho user {user_id}: {e}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "role": "system",
                        "message": "Không thể gửi email thông báo khóa tài khoản.",
                        "timestamp": datetime.now(VN_TIMEZONE).isoformat()
                    })
                except Exception:
                    pass  # Nếu websocket đã đóng thì bỏ qua
        asyncio.create_task(send_lock_email())