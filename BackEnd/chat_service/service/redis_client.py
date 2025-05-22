from redis.asyncio import Redis
import os
from dotenv import load_dotenv

load_dotenv()

redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT"))
redis_db = int(os.getenv("REDIS_DB"))

redis_client = Redis(
    host=redis_host,
    port=redis_port,
    db=redis_db,
    decode_responses=True
)

async def test_redis_connection():
    try:
        await redis_client.ping()
        print(f"✅ Redis connected at {redis_host}:{redis_port} (db {redis_db})")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
