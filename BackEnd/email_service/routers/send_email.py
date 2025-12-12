# routers/email_service.py
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from databases import get_db
from connect_service import get_user_by_email, generate_activation_token_for_user
from service.email_service import send_email
from service.emali_templates import (
    send_activation_email,
    send_password_reset_email,
    send_violation_lock_email,
    send_user_lock_email,
    send_contact_admin_email
)
from schemas import (
    EmailRequest,
    ActivationEmailRequest,
    PasswordResetEmail,
    UserLockNotification,
    ViolationLockEmailRequest,
    ResendActivationEmailRequest,
    ContactAdminRequest
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
    username = request.username
    if not username:
        user_response = await get_user_by_email(request.recipient)
        if not user_response:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại!")
        
        # Xử lý cả trường hợp response là dict trực tiếp hoặc có key "user"
        if isinstance(user_response, dict):
            if "user" in user_response:
                user_data = user_response["user"]
            else:
                user_data = user_response
        else:
            if hasattr(user_response, 'model_dump'):
                user_data = user_response.model_dump()
            elif hasattr(user_response, 'dict'):
                user_data = user_response.dict()
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại!")
        
        if not isinstance(user_data, dict):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại!")
        
        username = user_data.get("username")
        if not username:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy username!")
    try:
        await send_activation_email(db, request.recipient, username, activation_link)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email xác thực: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/send-password-reset-email/", status_code=status.HTTP_200_OK)
async def send_password_reset_email_endpoint(request: PasswordResetEmail, db: Session = Depends(get_db)):
    """Gửi email đặt lại mật khẩu."""
    try:
        # send_password_reset_email nhận: db, to, email, reset_link
        await send_password_reset_email(db, request.email, request.email, request.reset_link)
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
        await send_violation_lock_email(db, request.recipient, request.username, request.ban_duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email vi phạm: {e}")
    return {"status": "success", "message": "Email gửi thành công"}


@router.post("/resend-activation-email/", status_code=status.HTTP_200_OK)
async def resend_activation_email_endpoint(request: ResendActivationEmailRequest, db: Session = Depends(get_db)):
    """Gửi lại email kích hoạt tài khoản."""
    try:
        # Lấy thông tin user từ email
        user_response = await get_user_by_email(request.email)
        if not user_response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Không tìm thấy người dùng với email này!"
            )
        
        # Xử lý response
        if isinstance(user_response, dict):
            if "user" in user_response:
                user_data = user_response["user"]
            else:
                user_data = user_response
        else:
            if hasattr(user_response, 'model_dump'):
                user_data = user_response.model_dump()
            elif hasattr(user_response, 'dict'):
                user_data = user_response.dict()
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Định dạng dữ liệu user không hợp lệ"
                )
        
        if not isinstance(user_data, dict):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Định dạng dữ liệu user không hợp lệ"
            )
        
        user_id = user_data.get("id")
        username = user_data.get("username")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy ID người dùng!"
            )
        
        if not username:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy username!"
            )
        
        # Tạo activation token mới
        activation_token = await generate_activation_token_for_user(user_id)
        
        # Gửi email kích hoạt
        activation_link = f"{ACTIVATE_ACCOUNT_URL}?token={activation_token}"
        await send_activation_email(db, request.email, username, activation_link)
        
        return {
            "status": "success",
            "message": "Email kích hoạt đã được gửi lại thành công!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Không thể gửi lại email kích hoạt: {str(e)}"
        )


@router.post("/send-contact-admin-email/", status_code=status.HTTP_200_OK)
async def send_contact_admin_email_endpoint(request: ContactAdminRequest, db: Session = Depends(get_db)):
    """Gửi email từ user bị chặn đến admin."""
    try:
        await send_contact_admin_email(
            db,
            request.admin_email,
            request.user_email,
            request.username,
            request.subject,
            request.message
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email liên hệ admin: {e}")
    return {"status": "success", "message": "Email liên hệ admin đã được gửi thành công"}
