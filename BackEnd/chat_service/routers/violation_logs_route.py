from fastapi import APIRouter, Depends, HTTPException, status
from db_config import db_dependency
from models import ViolationLog
from schemas import ViolationLogOut, ViolationLogCreate
from connect_service import get_current_user
from typing import List

router = APIRouter(prefix="/api/chatbot_service", tags=["violation_logs"])
@router.get("/violation_logs/", response_model=List[ViolationLogOut])
async def get_violation_logs(db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    logs = db.query(ViolationLog).order_by(ViolationLog.created_at.desc()).all()
    return logs