import httpx
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
load_dotenv()
token_url = os.getenv("LOGIN")
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
IDENTITY_URL = os.getenv("IDENTITY_SERVICE_URL")
EMAIL_URL = os.getenv("EMAIL_SERVICE_URL")
SERVICE_KEY = os.getenv("SERVICE_KEY")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{token_url}")
TIMEOUT = 10.0
async def get_current_user(token: str = Depends(oauth2_scheme)):
    headers = {
        "Authorization": f"Bearer {token}",
    }
    timeout = httpx.Timeout(TIMEOUT, connect=5.0)
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
        try:
            response = await client.get(f"{IDENTITY_URL}validate-token", headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không tồn tại!!!")
            try:
                data = response.json()
            except ValueError:
                raise HTTPException(status_code=500, detail="Phản hồi JSON không hợp lệ từ dịch vụ xác thực mã thông báo!!!")
            return {
                "user_id": data.get("user_id"),
                "username": data.get("username"),
                "role": data.get("role"),
            }
        except httpx.ReadTimeout:
            raise HTTPException(status_code=503, detail="Dịch vụ xác thực không phản hồi (timeout)")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi yêu cầu đến dịch vụ xác thực: {repr(e)}")
# Lấy thông tin user từ User Service
async def get_user(user_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f'{USER_SERVICE_URL}user/{user_id}')
            if response.status_code == 200:
                return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi nạp user: {repr(e)}")
async def validate_token_from_query(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Thiếu token trong query")

    headers = {"Authorization": f"Bearer {token}"}
    timeout = httpx.Timeout(TIMEOUT, connect=5.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(f"{IDENTITY_URL}validate-token", headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
            return response.json()

        except httpx.ReadTimeout:
            raise HTTPException(status_code=504, detail="Dịch vụ xác thực không phản hồi (timeout)")

        except httpx.RequestError as e:
            # Log lỗi tại đây nếu cần
            raise HTTPException(status_code=503, detail="Không thể kết nối tới dịch vụ xác thực")

async def send_violation_lock_email(recipient: str, username: str, duration: str):
    async with httpx.AsyncClient() as client:
        data = {
            "recipient": recipient,
            "username": username,
            "duration": duration
        }
        try:
            response = await client.post(f"{EMAIL_URL}/send-user-lock-notification", json=data)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Gửi email không thành công")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi gửi yêu cầu đến dịch vụ email: {repr(e)}")