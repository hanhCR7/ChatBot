from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from databases import db_dependency
from models import Role, UserRole
from schemas import AssignRoleRequest
from service.redis_client import set_user_role_in_cache, redis_clients 
from verify_api_key import verify_api_key
internal_router = APIRouter(
    prefix="/api/system-role-admin",
    tags=["role-admin"]
)
@internal_router.post("/user-roles/assign-admin-roles", status_code=status.HTTP_200_OK)
async def assign_admin_role(request: AssignRoleRequest, db: db_dependency, api_key_security: str = Depends(verify_api_key)):
    """Dành cho hệ thống gọi nội bộ khi tạo user"""
    role = db.query(Role).filter_by(name=request.role_name).first()
    if not role:
        role = Role(
            name=request.role_name,
            description="Vai trò quản trị viên hệ thống",
            created_at=datetime.utcnow()
        )
        db.add(role)
        db.commit()
        db.refresh(role)

    user_role = db.query(UserRole).filter_by(user_id=request.user_id, role_id=role.id).first()
    if user_role:
        return {"detail": "Người dùng đã có vai trò này"}

    user_role = UserRole(user_id=request.user_id, role_id=role.id)
    db.add(user_role)
    db.commit()
    db.refresh(user_role)

    # Cập nhật cache
    redis_clients.delete(f"user_roles_{request.user_id}")
    set_user_role_in_cache(request.user_id, [role.name])

    return {"detail": "Gán Role thành công!", "user_role": {"user_id": request.user_id, "role_name": role.name}}