import os
from dotenv import load_dotenv
from security import hash_password
from db_config import db_dependency
from models import Users
from connect_service import assign_admin_role_to_user
from service.redis_client import redis_clients
load_dotenv()

DEAFULT_ADMIN_EMAIL = os.getenv("DEAFULT_ADMIN_EMAIL")
DEAFULT_ADMIN_PASSWORD = os.getenv("DEAFULT_ADMIN_PASSWORD")

async def init_admin(db: db_dependency):
    if redis_clients.exists("admin_initialized"):
        print("Admin đã được khởi tạo trước đó.")
        return

    admin = db.query(Users).filter_by(email=DEAFULT_ADMIN_EMAIL).first()
    if not admin:
        admin = Users(
            username="admin",
            email=DEAFULT_ADMIN_EMAIL,
            password_hash=hash_password(DEAFULT_ADMIN_PASSWORD),
            first_name="Admin",
            last_name="Admin",
            is_active=True,
            status="Active"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Tạo admin user: {DEAFULT_ADMIN_EMAIL}")

    # Gọi Identity Service gán role Admin
    await assign_admin_role_to_user(admin.id)

    # Đánh dấu đã init admin
    redis_clients.set("admin_initialized", "true")