import os
from openai import OpenAI
import uuid
import requests
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from connect_service import get_current_user
from crud import create_image, get_images_by_user, update_image_description, delete_image, get_all_images
from schemas import ImageCreate, ImageOut, UpdateImageDescription
from db_config import db_dependency

router = APIRouter(prefix="/api/chatbot_service/images", tags=["Images"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# Thư mục để lưu ảnh
UPLOAD_DIR = "upload/images"
class GenerateRequest(BaseModel):
    prompt: str 
# ==========================
# Tạo và lưu ảnh về server
# ==========================
@router.post("/generate", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
async def generate_and_save_image(
    body: dict, 
    request: Request,
    db: db_dependency,
    current_user=Depends(get_current_user)
):
    prompt = body.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt không được để trống")
    try:
        # 1. Gọi OpenAI để tạo ảnh
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            n=1
        )
        image_url = response.data[0].url
        # 2. Tải ảnh từ URL về
        download_res = requests.get(image_url)
        if download_res.status_code != 200:
            raise Exception("Không thể tải ảnh từ OpenAI")
        # 3. Ghi file vào thư mục static/images
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(download_res.content)
        # 4. Tạo URL tĩnh
        base_url = str(request.base_url).rstrip("/")
        full_url = f"{base_url}/static/images/{filename}"
        # 5. Lưu vào database
        img_data = ImageCreate(
            user_id=current_user["user_id"],
            url=full_url,
            description=prompt
        )
        new_image = create_image(db, img_data)
        return new_image
    except Exception as e:
        print("Lỗi tạo ảnh:", e)
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo ảnh: {str(e)}")
@router.get("/user", response_model=List[ImageOut])
def get_user_images(db: db_dependency, current_user=Depends(get_current_user)):
    return get_images_by_user(db, user_id=current_user["user_id"])

@router.put("/{image_id}", response_model=ImageOut, status_code=status.HTTP_200_OK)
def update_image_desc(image_id: int, body: UpdateImageDescription, db: db_dependency, current_user=Depends(get_current_user)):
    return update_image_description(db, image_id, current_user["user_id"], body.description)

@router.delete("/{image_id}", response_model=ImageOut, status_code=status.HTTP_200_OK)
def delete_user_image(image_id: int, db: db_dependency, current_user=Depends(get_current_user)):
    return delete_image(db, image_id, current_user["user_id"])
# Admin
@router.get("/all-images", response_model=List[ImageOut])
def get_all_images(db: db_dependency, current_user=Depends(get_current_user)):
    if not current_user["role"] == "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này")
    return get_all_images(db)