# routers/email_service.py
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from databases import get_db
from connect_service import get_user_by_email
from service.email_service import send_email
from service.emali_templates import (
    send_activation_email,
    send_password_reset_email,
    send_violation_lock_email,
    send_user_lock_email
)
from schemas import (
    EmailRequest,
    ActivationEmailRequest,
    PasswordResetEmail,
    UserLockNotification,
    ViolationLockEmailRequest
)

load_dotenv()

router = APIRouter(prefix="/api/email_service", tags=["emails"])

ACTIVATE_ACCOUNT_URL = os.getenv("ACTIVATE_ACCOUNT_URL")
SUPPORT_LINK = os.getenv("EMAIL_URL")


@router.post("/send-email/", status_code=status.HTTP_200_OK)
async def send_email_api(email_request: EmailRequest, db: Session = Depends(get_db)):
    """Gửi email tuỳ chỉnh."""
    try:
        await send_email(
            db,
            email_request.recipient,
            email_request.subject,
            email_request.body
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/send-activation-email/", status_code=status.HTTP_200_OK)
async def send_activation_email_endpoint(request: ActivationEmailRequest, db: Session = Depends(get_db)):
    """Gửi email xác thực tài khoản."""
    activation_link = f"{ACTIVATE_ACCOUNT_URL}?token={request.activation_token}"
    print("Request body:", request.dict())
    username = request.username
    if not username:
        user_response = await get_user_by_email(request.recipient)
        if not user_response or "username" not in user_response:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại!")
        username = user_response["username"]
    try:
        await send_activation_email(db, request.recipient, username, activation_link)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email xác thực: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/send-password-reset-email/", status_code=status.HTTP_200_OK)
async def send_password_reset_email_endpoint(request: PasswordResetEmail, db: Session = Depends(get_db)):
    """Gửi email đặt lại mật khẩu."""
    try:
        await send_password_reset_email(db, request.email, request.reset_link)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email đặt lại mật khẩu: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/send-user-lock-notification/", status_code=status.HTTP_200_OK)
async def send_user_lock_notification_endpoint(request: UserLockNotification, db: Session = Depends(get_db)):
    """Gửi email thông báo user bị khóa do không đăng nhập quá lâu."""
    try:
        await send_user_lock_email(db, request.recipient, request.username, SUPPORT_LINK)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email khóa user: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/send-violation-lock-email/", status_code=status.HTTP_200_OK)
async def send_violation_lock_email_endpoint(request: ViolationLockEmailRequest, db: Session = Depends(get_db)):
    """Gửi email thông báo user bị khóa do vi phạm nội dung."""
    try:
        await send_violation_lock_email(db, request.recipient, request.username, request.duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email vi phạm: {e}")
    return {"status": "success", "message": "Email gửi thành công"}
