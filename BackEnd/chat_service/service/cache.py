from service.redis_client import redis_client
from db_config import SessionLocal, db_dependency
from models import BannedKeywords

BANNED_KEYWORDS_KEY = "banned_keywords"
BANNED_KEYWORDS_TTL = 3600  # TTL 1 giờ

async def load_keywords_from_cache():
    """Lấy danh sách từ khóa vi phạm trực tiếp từ DB"""
    db = SessionLocal()
    try:
        # Lấy tất cả keyword từ bảng BannedKeywords
        keywords = db.query(BannedKeywords.keyword).all()
        # db.query trả về list tuple, nên chuyển sang list str
        return [k[0] for k in keywords]
    finally:
        db.close()

async def refresh_keywords_cache():
    db = SessionLocal()
    try:
        await redis_client.delete(BANNED_KEYWORDS_KEY)
        keywords = db.query(BannedKeywords.keyword).all()
        keywords = [k[0] for k in keywords]  # convert từ tuple sang str
        if keywords:
            await redis_client.sadd(BANNED_KEYWORDS_KEY, *keywords)
            await redis_client.expire(BANNED_KEYWORDS_KEY, BANNED_KEYWORDS_TTL)
    finally:
        db.close()
