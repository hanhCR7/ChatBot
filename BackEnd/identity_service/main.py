from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from admin import role_admin
from databases import SessionLocal, engine
from routers import role, permission, role_permission, user_role, auth

from rate_limiter import admin_role, role_get_user
import models

# Kiểm tra kết nối cơ sở dữ liệu
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Identity Service API")
# Cấu hình CORS
origins = [
    "http://localhost:9000",
    "http://localhost:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"]
)
# Gắn router
app.include_router(role.router)
app.include_router(permission.router)
app.include_router(role_permission.router)
app.include_router(user_role.router)
app.include_router(auth.router)
app.include_router(role_admin.internal_router)

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    await admin_role(db)
    await role_get_user(db)

@app.get("/")
async def root():
    return {"message": "Welcome to Identity Service"}