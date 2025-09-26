import redis
import os
import json
from dotenv import load_dotenv

load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_db = int(os.getenv("REDIS_DB", 0))

try:
    redis_clients = redis.StrictRedis(
        host=redis_host,
        port=redis_port,
        db=redis_db,
        decode_responses=True  # trả về string thay vì bytes
    )
    redis_clients.ping()
    print(f"Kết nối Redis thành công tại {redis_host}:{redis_port} (db {redis_db})")
except redis.ConnectionError as e:
    redis_clients = None
    print(f"Không thể kết nối đến Redis: {e}")


# ===== USER CACHE =====
def cache_user(user_id: int, user_data: dict, ttl: int = 600):
    """Lưu thông tin của user vào Redis với TTL 10 phút"""
    redis_clients.setex(f"User:{user_id}", ttl, json.dumps(user_data))


def get_cached_user(user_id: int):
    """Lấy thông tin user từ Redis"""
    data = redis_clients.get(f"User:{user_id}")
    return json.loads(data) if data else None


def delete_cached_user(user_id: int):
    """Xóa cached user khi có thay đổi"""
    redis_clients.delete(f"User:{user_id}")


# ===== USER ROLES CACHE =====
def get_user_role_from_cache(user_id: int):
    """Truy xuất danh sách vai trò của user từ Redis"""
    cache_key = f"user_roles_{user_id}"
    cached_data = redis_clients.get(cache_key)
    if cached_data:
        return json.loads(cached_data)  # Trả về list[str]
    return None


def set_user_role_in_cache(user_id: int, role_names: list[str]):
    """Lưu danh sách tên vai trò (list[str]) vào Redis"""
    cache_key = f"user_roles_{user_id}"
    redis_clients.setex(cache_key, 3600, json.dumps(role_names))  # TTL = 1 giờ
