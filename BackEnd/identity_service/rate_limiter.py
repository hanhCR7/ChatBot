from fastapi import Request, HTTPException, status, Depends
from redis import Redis
from service.redis_client import redis_clients
from databases import db_dependency
from models import Role
RATE_LIMITER = 5
RATE_LIMIT_TTL = 60

def rate_limiters(redis_client: Redis, key_prefix: str = "rate_limit"):
    async def limiter(request: Request):
        #Ưu tiên user_id nếu có, fallback về IP
        user = request.scope.get("user")
        identity = user.get("user") if user else request.client.host
        key = f"rate_limit:{key_prefix}:{identity}"
        count = redis_client.get(key)
        try:
            if count and int(count) >= RATE_LIMITER:
                raise HTTPException(
                    status_code=429, 
                    detail="Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.",
                    headers={"Retry-After": str(RATE_LIMIT_TTL)}
                )
            pipe = redis_client.pipeline()
            pipe.incr(key, 1)
            if not count:
                pipe.expire(key, RATE_LIMIT_TTL)
            pipe.execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi rate limit: {str(e)}")
    return limiter

async def admin_role(db: db_dependency):
    if redis_clients.exists("role_admin"):
        print("Quyền admin đã tồn tại.")
        return
    role_admin = db.query(Role).filter(Role.name == "Admin").first()
    if not role_admin:
        role_admin = Role(name="Admin", description="Quyền quản trị viên")
        db.add(role_admin)
        db.commit()
        db.refresh(role_admin)
        redis_clients.set("role_admin", role_admin.id)
        print("Đã tạo quyền Admin và lưu vào cache.")
    else:
        redis_clients.set("role_admin", role_admin.id)
        print("Đã cập nhật quyền Admin trong cache.")
async def role_get_user(db: db_dependency):
    if redis_clients.exists("role_user"):
        print("Quyền user đã tồn tại.")
        return
    role_user = db.query(Role).filter(Role.name == "User").first()
    if not role_user:
        role_user = Role(name="User", description="Quyền người dùng")
        db.add(role_user)
        db.commit()
        db.refresh(role_user)
        redis_clients.set("role_user", role_user.id)
        print("Đã tạo quyền User và lưu vào cache.")
    else:
        redis_clients.set("role_user", role_user.id)
        print("Đã cập nhật quyền User trong cache.")