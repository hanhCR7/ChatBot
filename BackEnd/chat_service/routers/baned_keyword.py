from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from db_config import db_dependency
from schemas import BanedKeywordCreate, BanedKeywordOut
from models import BanedKeywords
from connect_service import get_current_user

router = APIRouter(prefix="/api/chatbot_service", tags=["baned_keywords"])

@router.post("/banned_keywords", response_model=BanedKeywordOut, status_code=status.HTTP_201_CREATED)
async def create_banned_keyword(request: BanedKeywordCreate, db: db_dependency, current_user: dict = Depends(get_current_user)):
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
    
    return new_keyword  # Trả về object phù hợp với BanedKeywordOut


@router.get("/banned_keywords", response_model=List[BanedKeywordOut])
async def get_banned_keywords(db: db_dependency, current_user: dict = Depends(get_current_user)):
    keywords = db.query(BanedKeywords).all()
    return keywords  # Trả về list đối tượng phù hợp với List[BanedKeywordOut]


@router.delete("/banned_keywords/{keyword_id}", response_model=BanedKeywordOut)
async def delete_banned_keyword(keyword_id: int, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    
    keyword = db.query(BanedKeywords).filter(BanedKeywords.id == keyword_id).first()
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Từ khóa không tồn tại")
    
    db.delete(keyword)
    db.commit()
    
    return keyword  # Trả về object vừa xóa, phù hợp BanedKeywordOut

@router.get("/banned_keyword/public", response_model=List[BanedKeywordOut])
async def get_banned_keywords(db: db_dependency):
    keywords = db.query(BanedKeywords).all()
    return keywords  # Trả về list đối tượng phù hợp với List[BanedKeywordOut]