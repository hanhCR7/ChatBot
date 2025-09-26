import httpx
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
load_dotenv()
token_url = os.getenv("LOGIN")
IDENTITY_URL = os.getenv("IDENTITY_SERVICE_URL")
EMAIL_URL = os.getenv("EMAIL_SERVICE_URL")
SERVICE_KEY = os.getenv("SERVICE_KEY")
SYSTEM_ADMIN = os.getenv("SYSTEM_ADMIN_URL")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{token_url}")
async def validate_token_user(token: str = Depends(oauth2_scheme)):
    headers = {
        "Authorization": f"Bearer {token}",
    }
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(
                f"{IDENTITY_URL}validate-token",
                headers=headers,
            ) 
            if response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không tồn tại!!!")
            try:
                data = response.json()
            except ValueError:
                raise HTTPException(status_code=500, detail="Phản hồi JSON không hợp lệ từ dịch vụ xác thực mã thông báo!!!")
            return {
                "user_id": data["user_id"],
                "username": data["username"],
                "email": data.get("email"),
                "first_name": data.get("first_name", ""),
                "last_name": data.get("last_name", ""),
                "role": data["role"],
            }
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi yêu cầu đến dịch vụ xác thực: {repr(e)}")
async def assign_admin_role_to_user(user_id: int):
    """Gọi HTTP request để gán role Admin"""
    headers = {"X-API-Key": SERVICE_KEY}
    data = {"user_id": user_id, "role_name": "Admin"}
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{SYSTEM_ADMIN}user-roles/assign-admin-roles", json=data, headers=headers)
        if r.status_code != 200:
            print("Gán quyền Admin không thành công:", r.status_code, r.text)
        else:
            print("Gán quyền Admin thành công:", r.json())
# Gửi mã otp khi thay dôi đổi thông tin nhạy cảm
# Send Email OTP
async def send_email_otp(user_id: int, email: str):
    timeout = httpx.Timeout(15.0, connect=5.0)  # 15 seconds for the request, 5 seconds for connection
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                f'{EMAIL_URL}send-otp-email/',
                json={"user_id": user_id, "email": email}
            )
            print(f"[OTP Email] Status: {response.status_code}, Response: {response.text}")
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gửi OTP thất bại. Phản hồi từ service: {response.text}"
                )
        except httpx.RequestError as e:
            print(f"Loi connect: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
# Xác thực mã OTP
async def validate_otp(user_id: int, otp: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{EMAIL_URL}validate-otp/',
                json={"user_id": user_id, "otp": otp}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
#Gửi mail thông báo cho user bị khóa do không login quá 15 ngày
async def send_user_lock_notification(recipient: str, username: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{EMAIL_URL}send-user-lock-notification/",
                json={"recipient": recipient, "username": username}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.ReadError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")

    