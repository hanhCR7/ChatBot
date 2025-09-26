from datetime import datetime
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from dotenv import load_dotenv
import os
import httpx
USER_SERVICE_URL = os.getenv('USER_SERVICE_URL')
SERVICE_KEY = os.getenv('SERVICE_KEY')
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/identity_service/login")
load_dotenv()
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
            raise Exception(f"Request error: {str(e)}")
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