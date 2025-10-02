from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from databases import get_db
from schemas import OTPRequest, VerifyOTPRequest
from service.otp_service import generate_otp, validate_otp
from service.emali_templates import send_otp_login_email, send_otp_change_pass_email, send_otp_update_user_email
from connect_service import get_user

router = APIRouter(prefix="/api/email_service", tags=["emails"])

@router.post("/send-otp-email/", status_code=status.HTTP_200_OK)
async def send_otp_email_endpoint(request: OTPRequest, db: Session = Depends(get_db)):
    """
    Gửi email OTP cho user
    """
    try:
        user_response = await get_user(request.user_id)
        user_data = user_response["user"]
        if not user_data["id"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại!")
        username = user_data["username"]
        otp = await generate_otp(db, request.user_id)
        if request.otp_type == "login":
            await send_otp_login_email(db, request.email, username, otp)
        elif request.otp_type == "change_password":
            await send_otp_change_pass_email(db, request.email, username, otp)
        elif request.otp_type == "update_user":
            await send_otp_update_user_email(db, request.email, username, otp)
        return {"status": "success", "message": "Email OTP được gửi thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không gửi được email OTP: {str(e)}")


@router.post("/validate-otp/", status_code=status.HTTP_200_OK)
async def validate_otp_api(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Kiểm tra OTP hợp lệ hay không
    """
    try:
        is_valid = await validate_otp(request.user_id, request.otp, db)
        if is_valid:
            return {"status": "success", "message": "OTP hợp lệ"}
        return {"status": "error", "message": "OTP không hợp lệ"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating OTP: {e}")
