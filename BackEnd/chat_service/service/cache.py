from service.redis_client import redis_client
from db_config import db_dependency
from models import BanedKeywords
BANNED_KEYWORDS_KEY = "banned_keywords"
BANNED_KEYWORDS_TTL = 3600  # TTL 1 giờ

def load_keywords_from_cache():
    """Tải danh sách từ khóa vi phạm từ Redis cache."""
    if not redis_client:
        return []
    
    if not redis_client.exists(BANNED_KEYWORDS_KEY):
        return []
    return list(redis_client.smembers(BANNED_KEYWORDS_KEY))

def refresh_keywords_cache(db: db_dependency):
    """Làm mới cache từ khóa vi phạm."""
    if not redis_client:
        return False
    
    redis_client.delete(BANNED_KEYWORDS_KEY)
    keywords = db.query(BanedKeywords).all()
    if keywords:
        redis_client.sadd(BANNED_KEYWORDS_KEY, *[kw.keyword for kw in keywords])
        redis_client.expire(BANNED_KEYWORDS_KEY, BANNED_KEYWORDS_TTL)
    return True