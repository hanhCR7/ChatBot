from fastapi import FastAPI
from routers import chat, baned_keyword
from db_config import Base, engine
from fastapi.middleware.cors import CORSMiddleware
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Email Service API")
# Gắn router
app.include_router(chat.router)
app.include_router(baned_keyword.router)
# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # hoặc ["*"] nếu bạn dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/api/chatbot_service/")
async def root():
    return {"message": "Welcome to ChatBot Service!"}