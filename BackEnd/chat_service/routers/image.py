import os
import uuid
import httpx
import base64
import logging
from openai import OpenAI, OpenAIError
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from connect_service import get_current_user
from crud import (
    create_image, get_images_by_user, update_image_description,
    delete_image, get_all_images, get_image_by_id
)
from schemas import ImageCreate, ImageOut, UpdateImageDescription 
from db_config import db_dependency
from models import Image
from service.violation_handler import contains_violation, process_violation_for_image
from service.cache import load_keywords_from_cache

# ==========================
# Setup
# ==========================
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chatbot_service/images", tags=["Images"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

UPLOAD_DIR = "upload/images"


# ==========================
# Schemas
# ==========================
class GenerateRequest(BaseModel):
    prompt: str


# ==========================
# Dependencies
# ==========================
def require_admin(user=Depends(get_current_user)):
    if user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cạp vào chức năng này!")
    return user


# ==========================
# API cho User
# ==========================
@router.post("/generate", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
async def generate_and_save_image(
    body: GenerateRequest,
    request: Request,
    db: db_dependency,
    current_user=Depends(get_current_user)
):
    prompt = body.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt không được để trống")

    # --- 1. Kiểm tra từ khóa bị cấm (Banned Keywords) ---
    try:
        has_violation = await contains_violation(prompt)
        if has_violation:
            logger.warning(f"User {current_user['user_id']} vi phạm từ khóa bị cấm trong prompt tạo ảnh: {prompt}")
            
            # Xử lý vi phạm: log, tăng strike, ban nếu cần
            violation_info = await process_violation_for_image(prompt, db, current_user)
            
            # Tạo thông báo chi tiết với thông tin vi phạm
            violation_message = violation_info["message"]
            if violation_info["strikes"] >= 4:
                violation_message += " Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ."
            
            raise HTTPException(
                status_code=400,
                detail=violation_message
            )
    except HTTPException:
        raise  # Re-raise HTTPException để trả về lỗi cho client
    except Exception as e:
        logger.warning("Kiểm tra từ khóa bị cấm lỗi (bỏ qua): %s", e)

    # --- 2. Kiểm duyệt trước (Moderation) ---
    try:
        mod = client.moderations.create(model="omni-moderation-latest", input=prompt)
        if mod.results[0].flagged:
            raise HTTPException(
                status_code=400,
                detail="Prompt bị chặn bởi hệ thống kiểm duyệt. Vui lòng nhập mô tả khác."
            )
    except HTTPException:
        raise  # Re-raise HTTPException để trả về lỗi cho client
    except Exception as e:
        logger.warning("Moderation check lỗi (bỏ qua): %s", e)

    try:
        # --- 3. Gọi OpenAI để tạo ảnh ---
        response = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            n=1
        )

        # --- 4. Xử lý phản hồi ---
        data = response.data[0]
        image_url = getattr(data, "url", None)
        image_b64 = getattr(data, "b64_json", None)

        if not image_url and not image_b64:
            raise HTTPException(
                status_code=500,
                detail="OpenAI không trả về dữ liệu ảnh hợp lệ (không có URL hoặc base64)."
            )

        # --- 5. Tải hoặc decode ảnh ---
        if image_url:
            async with httpx.AsyncClient(timeout=30) as http_client:
                res = await http_client.get(image_url)
                res.raise_for_status()
                image_bytes = res.content
        else:
            image_bytes = base64.b64decode(image_b64)

        # --- 6. Lưu file ---
        filename = f"{uuid.uuid4().hex}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        # --- 7. Tạo URL public ---
        base_url = str(request.base_url).rstrip("/")
        full_url = f"{base_url}/static/images/{filename}"

        # --- 8. Lưu vào DB ---
        img_data = ImageCreate(
            user_id=current_user["user_id"],
            url=full_url,
            description=prompt
        )

        try:
            saved = create_image(db, img_data)
        except Exception as e:
            os.remove(filepath)
            raise HTTPException(status_code=500, detail=f"Lỗi lưu DB: {str(e)}")

        logger.info("Tạo ảnh thành công cho user_id=%s: %s", current_user["user_id"], prompt)
        return saved

    except OpenAIError as oe:
        err_str = str(oe)
        logger.error("Lỗi OpenAI: %s", err_str)
        if "moderation_blocked" in err_str or "safety_violations" in err_str:
            raise HTTPException(
                status_code=400,
                detail="Prompt bị hệ thống an toàn OpenAI từ chối."
            )
        raise HTTPException(status_code=502, detail=f"Lỗi OpenAI: {err_str}")

    except httpx.HTTPStatusError as hx_err:
        logger.error("Lỗi tải ảnh: %s", hx_err)
        raise HTTPException(status_code=502, detail="Không thể tải ảnh từ URL OpenAI.")

    except Exception as e:
        logger.exception("Lỗi không xác định: %s", e)
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo ảnh: {str(e)}")


@router.get("/user", response_model=List[ImageOut])
def get_user_images(db: db_dependency, current_user=Depends(get_current_user)):
    return get_images_by_user(db, user_id=current_user["user_id"])


@router.put("/{image_id}", response_model=ImageOut)
def update_image_desc(
    image_id: int,
    body: UpdateImageDescription,
    db: db_dependency,
    current_user=Depends(get_current_user)
):
    return update_image_description(db, image_id, current_user["user_id"], body.description)


@router.delete("/{image_id}", response_model=ImageOut)
def delete_user_image(
    image_id: int,
    db: db_dependency,
    current_user=Depends(get_current_user)
):
    image = get_image_by_id(db, image_id)
    if not image or image.user_id != current_user["user_id"]:
        raise HTTPException(status_code=404, detail="Ảnh không tồn tại hoặc bạn không có quyền")

    # Xóa file vật lý
    try:
        filepath = os.path.join(UPLOAD_DIR, os.path.basename(image.url))
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        logger.error(f"Không thể xóa file ảnh: {e}")

    return delete_image(db, image_id, current_user["user_id"])


# ==========================
# API cho Admin
# ==========================
@router.get("/admin/all-images", response_model=List[ImageOut])
def admin_get_all_images(db: db_dependency, current_user=Depends(require_admin)):
    return get_all_images(db)


@router.delete("/admin/{image_id}", response_model=ImageOut)
def admin_delete_image(image_id: int, db: db_dependency, current_user=Depends(require_admin)):
    image = get_image_by_id(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Ảnh không tồn tại")

    # Xóa file vật lý
    try:
        filepath = os.path.join(UPLOAD_DIR, os.path.basename(image.url))
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        logger.error(f"Không thể xóa file ảnh: {e}")

    return delete_image(db, image_id, None)


@router.put("/admin/{image_id}", response_model=ImageOut)
def admin_update_desc(
    image_id: int,
    body: UpdateImageDescription,
    db: db_dependency,
    current_user=Depends(require_admin),
):
    return update_image_description(db, image_id, None, body.description)


@router.get("/admin/search", response_model=List[ImageOut])
def admin_search_images(
    db: db_dependency,
    q: str = "",
    user_id: Optional[int] = None,
    current_user=Depends(require_admin)
):
    query = db.query(Image)
    if q:
        query = query.filter(Image.description.ilike(f"%{q}%"))
    if user_id:
        query = query.filter(Image.user_id == user_id)
    return query.all()


@router.get("/admin/stats")
def admin_get_image_stats(db: db_dependency, current_user=Depends(require_admin)):
    total_images = db.query(func.count(Image.id)).scalar()
    by_user = db.query(Image.user_id, func.count(Image.id)).group_by(Image.user_id).all()

    return {
        "total_images": total_images,
        "by_user": [{"user_id": uid, "count": count} for uid, count in by_user],
    }
