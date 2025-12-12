from fastapi import APIRouter, Depends, HTTPException, status
from db_config import db_dependency
from models import ViolationLog
from schemas import ViolationLogCreate, ViolationLogOut
from connect_service import get_current_user

router = APIRouter(prefix="/api/chatbot_service", tags=["violation_log"])
@router.get("/violation_log", status_code=status.HTTP_200_OK)
async def get_violation_log(db: db_dependency, page: int=1, limit: int=10, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    violation_log = db.query(ViolationLog).order_by(ViolationLog.id.desc()).offset((page - 1)*limit).limit(limit).all()
    total_violation_log = db.query(ViolationLog).count()
    violation_log_list = [ViolationLogOut.from_orm(v).model_dump() for v in violation_log]
    return {
        "detail": "Danh sách vi phạm",
        "violation_log": violation_log_list,
        "total": total_violation_log,
        "page": page,
        "limit": limit
    }
@router.delete("/violation_log/{violation_log_id}", status_code=status.HTTP_200_OK)
async def delete_violation_log(violation_log_id: int, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền truy cập vào tài nguyên này!!!")
    violation_log = db.query(ViolationLog).filter(ViolationLog.id == violation_log_id).first()
    if not violation_log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vi phạm không tồn tại!!!")
    db.delete(violation_log)
    db.commit()
    return {
        "detail": "Vi phạm đã được xóa thành công"
    }