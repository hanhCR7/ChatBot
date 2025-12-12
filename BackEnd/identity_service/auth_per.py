from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from models import BackListTokens
from databases import get_db
from connect_service import get_user
import os
from dotenv import load_dotenv
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/identity_service/login")
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = 'HS256'
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    # 1. Kiểm tra token có bị thu hồi không
    backlisted = db.query(BackListTokens).filter(BackListTokens.token == token).first()
    if backlisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã bị thu hồi. Vui lòng đăng nhập lại."
        )
    # 2. Giải mã token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không chứa user_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ"
        )
    # 3. Gọi sang User Service để lấy thông tin user
    try:
        user_response = await get_user(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Lỗi khi gọi User Service: {str(e)}"
        )
    
    # Xử lý cả trường hợp response là dict trực tiếp hoặc có key "user"
    if not user_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    
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
    
    return {
        "user_id": user_data.get("id") or user_data.get("user_id"),
        "username": user_data.get("username"),
        "role": role,
        "token": token
    }
