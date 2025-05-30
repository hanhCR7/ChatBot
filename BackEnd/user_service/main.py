from fastapi import FastAPI
from routers import users, logs
from db_config import Base, engine, SessionLocal
from init_admins import init_admin
from fastapi.middleware.cors import CORSMiddleware
Base.metadata.create_all(bind=engine)
app = FastAPI(title="User Service API")

# Gắn middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn router
app.include_router(users.router)
app.include_router(logs.router)
# Khởi tạo admin
@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    await init_admin(db)

@app.get("/api/user_service")
async def root():
    return {"message": "Welcome to User Service"}