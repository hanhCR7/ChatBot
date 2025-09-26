from fastapi import FastAPI
from routers import chat, baned_keyword, image
from db_config import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
Base.metadata.create_all(bind=engine)
app = FastAPI(title="ChatBot Service API")
# Gắn router
app.include_router(chat.router)
app.include_router(baned_keyword.router)
app.include_router(image.router)
app.mount("/static/images", StaticFiles(directory="upload/images"), name="images")
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