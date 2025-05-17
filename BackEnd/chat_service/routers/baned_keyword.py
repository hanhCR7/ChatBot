from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from db_config import db_dependency
from schemas import BanedKeywordCreate, BanedKeywordOut
from models import BanedKeywords
from connect_service import get_current_user

router = APIRouter(prefix="/api/chatbot_service", tags=["baned_keywords"])

@router.post("/baned_keywords/", response_model=List[BanedKeywordOut])
async def create_baned_keyword(request: BanedKeywordCreate, db: db_dependency, current_user: dict =Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    keyword = request.keyword.strip().lower()
    existing_keyword = db.query(BanedKeywords).filter(BanedKeywords.keyword == keyword).first()
    if existing_keyword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Từ khóa đã tồn tại")
    new_keyword = BanedKeywords(keyword=keyword)
    db.add(new_keyword)
    db.commit()
    db.refresh(new_keyword)
    return {
        "Đã thêm từ khóa": new_keyword.keyword,
    }
@router.get("/baned_keywords/", response_model=List[BanedKeywordOut])
async def get_baned_keywords(db: db_dependency, current_user: dict =Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    keywords = db.query(BanedKeywords).all()
    return {
        "Từ khóa cấm": [keyword.keyword for keyword in keywords],
    }
@router.delete("/baned_keywords/{keyword_id}/", response_model=BanedKeywordOut)
async def delete_baned_keyword(keyword_id: int, db: db_dependency, current_user: dict =Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    keyword = db.query(BanedKeywords).filter(BanedKeywords.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Từ khóa không tồn tại")
    db.delete(keyword)
    db.commit()
    return {
        "Đã xóa từ khóa": keyword.keyword,
    }
