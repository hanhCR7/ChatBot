from sqlalchemy import select
from service.redis_client import redis_client
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, WebSocket
from db_config import db_dependency
from service.cache import load_keywords_from_cache
from models import ViolationLog, ViolationStrike
from schemas import ViolationStrikeCreate
from connect_service import send_violation_lock_email, get_current_user



async def contains_violation(message: str) -> bool:
    from service.cache import load_keywords_from_cache
    BANNED_KEYWORDS = await load_keywords_from_cache()
    return any(word in message.lower() for word in BANNED_KEYWORDS)

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

async def update_strike_to_db(strikes: ViolationStrikeCreate, current_strikes: int,db: db_dependency):
    """Cập nhật hoặc tạo mới số lần vi phạm trong database."""
    result = await db.execute(select(ViolationStrike).where(ViolationStrike.user_id == strikes.user_id))
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
    await db.commit()

async def sync_strike_from_db(user_id: int, db: db_dependency):
    """Đồng bộ số lần vi phạm từ database về Redis."""
    strike_key = f"strike:{user_id}"
    if not await redis_client.exists(strike_key):
        result = db.execute(select(ViolationStrike).where(ViolationStrike.user_id == user_id))
        strike_record = result.scalars().first()
        if strike_record:
            await redis_client.set(f"strike:{user_id}", strike_record.strike_count, ex=86400)  # TTL 1 ngày
async def process_violation(websocket: WebSocket, message: str, db: db_dependency, user_current: dict):
    user_id = user_current['user_id']
    strike_key = f"strike:{user_id}"
    ban_key = f"chat_ban:{user_id}"

    VIOLATION_LEVELS = {
        1: {"message": "Cảnh báo: Vui lòng không sử dụng ngôn từ vi phạm.", "ban_time": 0},
        2: {"message": "Bạn bị cấm chat 5 phút (vi phạm lần 2).", "ban_time": 300},
        3: {"message": "Bạn bị cấm chat 1 giờ (vi phạm lần 3).", "ban_time": 3600},
        4: {"message": "Tài khoản của bạn đã bị khóa do vi phạm nhiều lần.", "ban_time": 86400}
    }

    current_strikes = int(await redis_client.incr(strike_key))
    await redis_client.expire(strike_key, 86400)

    await update_strike_to_db(ViolationStrikeCreate(user_id=user_id), current_strikes, db)
    await log_violation_to_db(user_id, message, current_strikes, db)

    level = min(current_strikes, max(VIOLATION_LEVELS.keys()))
    level_info = VIOLATION_LEVELS[level]

    if level_info["ban_time"] > 0:
        await redis_client.set(ban_key, 1, ex=level_info["ban_time"])

    await websocket.send_text(level_info["message"])

    if current_strikes >= 4:
        await redis_client.set(ban_key, 1, ex=86400)
        await websocket.send_text("Tài khoản của bạn đã bị khóa do vi phạm nhiều lần.")
        try:
            await send_violation_lock_email(user_id, '1 ngày', db)
            await websocket.send_text("Email thông báo đã được gửi đến bạn.")
        except Exception as e:
            await websocket.send_text(f"Không thể gửi email thông báo: {str(e)}")
            raise HTTPException(status_code=500, detail="Không thể gửi email thông báo.")
