from fastapi import FastAPI
from routers import send_email, otp
from databases import Base, engine
from fastapi.middleware.cors import CORSMiddleware
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Email Service API")
# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # hoặc ["*"] nếu bạn dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Gắn router
app.include_router(send_email.router)
app.include_router(otp.router)
@app.get("/api/email_service/")
async def root():
    return {"message": "Welcome to Email Service!"}