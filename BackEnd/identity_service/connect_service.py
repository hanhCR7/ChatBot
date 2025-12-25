from datetime import datetime
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from dotenv import load_dotenv
import os
import httpx
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/identity_service/login")
load_dotenv()
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
EMAIL_SERVICE_URL = os.getenv('EMAIL_SERVICE_URL')
CHAT_SERVICE_URL = os.getenv('CHAT_SERVICE_URL', 'http://localhost:8003/api/chatbot_service/')
SERVICE_KEY = os.getenv('SERVICE_KEY')
def hash_password( password: str) -> str:
    return bcrypt_context.hash(password)
def verify_password( plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)
# Lấy thông tin user từ User Service
async def get_user(user_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f'{USER_SERVICE_URL}user/{user_id}')
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
# Xác thực user
async def get_user_with_password(username: str, password: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{USER_SERVICE_URL}authenticate',
                json={'username': username, 'password': password}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
# Cập nhật password
async def update_password(user_id: int, new_password_hash: str):
    payload = {
        "new_password": new_password_hash,
        "confirm_password": new_password_hash
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f'{USER_SERVICE_URL}users/update-password/{user_id}', 
                json=payload
            )
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
# Đăng ký user(lấy từ create_user của User Service)
async def sign_up_user(first_name: str, last_name: str, username: str, email: str, password_hash: str):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{USER_SERVICE_URL}user/create-user',
                headers=headers,
                json={
                    "first_name": first_name,
                    "last_name": last_name,
                    "username": username,
                    "email": email,
                    "password_hash": password_hash
                }
            )
            if response.status_code == 201:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
# Cập nhật last_login
async def update_last_login(user_id: int):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f'{USER_SERVICE_URL}user/update_last_login/{user_id}',
                headers=headers,
                json={"last_login": datetime.utcnow().isoformat()}
            )
            if response.status_code == 200:
                return response.json()
            raise Exception(f"Request error: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
# Tạo log
async def log_user_action(user_id: int, action: str):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{USER_SERVICE_URL}create-log',
                headers=headers,
                params={"user_id": user_id, "action": action}
            )
            if response.status_code == 201:
                return response.json()
            raise Exception(f"Request error: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi tạo log: {repr(e)}")
#Kích hoạt account
async def generate_activation_token(user_id: int):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{USER_SERVICE_URL}generate-activation-token',
                json={"user_id": user_id},
                headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                if "activation_token" not in data:
                    raise HTTPException(status_code=500, detail="Phản hồi không chứa activation_token")
                return data
            else:
                # Log lỗi hoặc raise cụ thể hơn
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"User Service trả về lỗi: {response.text}"
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi tạo activation token: {repr(e)}")

# COnnect to email service
async def active_account(username: str, email: str, activation_token: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}send-activation-email/',
                json={"username": username, "recipient": email, "activation_token": activation_token}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            print(f"Loi connect: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
#Gửi mail khi user.is_active == False
async def send_user_lock_notification(recipient: str, username: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}send-user-lock-notification/',
                json={"recipient": recipient, "username": username}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.ReadError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
# Send Email OTP
async def send_email_otp(user_id: int, email: str, otp_type: str):
    timeout = httpx.Timeout(15.0, connect=5.0)  # 15 seconds for the request, 5 seconds for connection
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}send-otp-email/',
                json={"user_id": user_id, "email": email, "otp_type": otp_type}
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gửi OTP thất bại. Phản hồi từ service: {response.text}"
                )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")

# Validate OTP
async def validate_otp(user_id: int, otp: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}validate-otp/',
                json={"user_id": user_id, "otp": otp}
            )
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
#Email đặt lại mật khẩu
async def send_reset_password_email(email: str, reset_link: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}send-password-reset-email/',
                json={"email": email, "reset_link": reset_link}
            )
            if response.status_code == 200:
                return response.json()
            else:
                # Log lỗi từ email service
                error_detail = response.text if hasattr(response, 'text') else str(response.status_code)
                raise HTTPException(
                    status_code=500, 
                    detail=f"Email service trả về lỗi: {error_detail}"
                )
        except httpx.TimeoutException as e:
            raise HTTPException(status_code=500, detail=f"Timeout khi gửi email: {repr(e)}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi không xác định khi gửi email: {repr(e)}")
async def get_user_by_email(email: str):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f'{USER_SERVICE_URL}users/get-user-by-email/{email}', headers=headers)
        except httpx.RequestError as e:
            # Lỗi network / timeout
            raise HTTPException(status_code=500, detail=f"Lỗi kết nối đến user service: {repr(e)}")
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            # User không tồn tại → trả về 404
            return None
        else:
            # Lỗi khác từ user service
            raise HTTPException(status_code=500, detail=f"Lỗi từ user service: {response.text}")
# Cập nhật mật khẩu từ user service
async def reset_update_password(user_id: int, new_password: str, confirm_password: str):
    headers = {"X-API-Key": SERVICE_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                f'{USER_SERVICE_URL}update-password/',
                json={
                    "user_id": user_id,
                    "new_password": new_password,
                    "confirm_password": confirm_password
                },
                headers=headers
            )
            if response.status_code == 200:
                return response.json()
            raise Exception(f"Request error: {response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi mail thông báo: {repr(e)}")

# Gửi email liên hệ admin cho user bị chặn
async def send_contact_admin_email(user_email: str, username: str, subject: str, message: str, admin_email: str):
    """Gửi email từ user bị chặn đến admin thông qua email service"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f'{EMAIL_SERVICE_URL}send-contact-admin-email/',
                json={
                    "user_email": user_email,
                    "username": username,
                    "subject": subject,
                    "message": message,
                    "admin_email": admin_email
                }
            )
            if response.status_code == 200:
                return response.json()
            else:
                error_detail = response.text if hasattr(response, 'text') else str(response.status_code)
                raise HTTPException(
                    status_code=500, 
                    detail=f"Email service trả về lỗi: {error_detail}"
                )
        except httpx.TimeoutException as e:
            raise HTTPException(status_code=500, detail=f"Timeout khi gửi email: {repr(e)}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi email liên hệ admin: {repr(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi không xác định khi gửi email: {repr(e)}")

async def get_user_strike_count(user_id: int):
    """Lấy số lần vi phạm của user từ chat_service"""
    # Kiểm tra xem CHAT_SERVICE_URL có được cấu hình không
    if not CHAT_SERVICE_URL or CHAT_SERVICE_URL == 'http://localhost:8003/api/chatbot_service/':
        # Nếu không có URL hoặc là default, có thể service chưa chạy, trả về 0
        return 0
    
    async with httpx.AsyncClient(timeout=3.0) as client:
        try:
            response = await client.get(f'{CHAT_SERVICE_URL}check-violations/{user_id}')
            if response.status_code == 200:
                data = response.json()
                return data.get("strike_count", 0)
            # Nếu không lấy được (404, 500, etc.), trả về 0 (cho phép login)
            return 0
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
            # Lỗi kết nối - service có thể chưa chạy, không chặn login
            print(f"⚠️ Không thể kết nối đến chat_service để kiểm tra vi phạm cho user {user_id}: {e}")
            return 0
        except Exception as e:
            # Lỗi khác, log và trả về 0 để không chặn login
            print(f"⚠️ Lỗi khi kiểm tra vi phạm từ chat_service cho user {user_id}: {e}")
            return 0