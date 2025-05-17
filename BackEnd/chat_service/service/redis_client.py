import redis
import os
from dotenv import load_dotenv

load_dotenv()

redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_db = os.getenv("REDIS_DB")

def get_redis_client():
    """Create a Redis client instance."""
    try:
        client = redis.StrictRedis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        client.ping() 
        print(f"Kết nối Redis thành công tại {redis_host}:{redis_port} (db {redis_db})")
        return client
    except redis.ConnectionError as e:
        print(f"Không thể kết nối đến Redis: {e}")
        return None

redis_client = get_redis_client()