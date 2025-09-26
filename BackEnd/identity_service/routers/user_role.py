from datetime import datetime
from unicodedata import name
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from models import UserRole, Role
from auth_per import get_current_user
from databases import db_dependency
from schemas import UserRoleRequest, AssignRoleRequest
from connect_service import get_user, log_user_action
from verify_api_key import verify_api_key
from service.redis_client import redis_clients, get_user_role_from_cache, set_user_role_in_cache

router = APIRouter(prefix="/api/identity_service", tags=["user-role"])
system_router = APIRouter(
    prefix="/api/identity_service",
    tags=["system-user-role"]
)
# === Utility Function ===
def update_user_cache(user_id: int, db: Session):
    roles = (
        db.query(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id)
        .all()
    )
    role_names = [r[0] for r in roles]
    set_user_role_in_cache(user_id, role_names)

# === API: Lấy vai trò người dùng ===
@router.get("/user-roles/{user_id}", status_code=status.HTTP_200_OK)
async def read_user_roles(user_id: int, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập vào tài nguyên này")

    user_roles = get_user_role_from_cache(user_id)
    if user_roles:
        return {"detail": "Truy xuất từ cache", "user_roles": user_roles}

    try:
        user_response = await get_user(user_id)
        user = user_response.get("user")
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    except Exception:
        raise HTTPException(status_code=502, detail="Không thể truy xuất người dùng từ User Service")

    roles = (
        db.query(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id)
        .all()
    )
    role_names = [r[0] for r in roles]
    set_user_role_in_cache(user_id, role_names)
    await log_user_action(current_user["user_id"], f"[{current_user['username']}] truy xuất vai trò của user {user_id}")

    return {"detail": "Truy xuất thành công", "user_roles": role_names}

# === API: Gán vai trò mới cho người dùng ===
@router.post("/user-roles/{user_id}", status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(user_id: int, user_role_request: UserRoleRequest, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện thao tác này")

    role = db.query(Role).filter_by(name=user_role_request.role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Vai trò '{user_role_request.role_name}' không tồn tại")

    try:
        user = await get_user(user_id).get("user")
        if not user:
            raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    except Exception:
        raise HTTPException(status_code=502, detail="Không thể truy xuất người dùng từ User Service")

    existing = db.query(UserRole).filter_by(user_id=user_id, role_id=role.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Người dùng đã có vai trò này")

    new_user_role = UserRole(user_id=user_id, role_id=role.id)
    db.add(new_user_role)
    db.commit()

    redis_clients.delete(f"user_roles_{user_id}")
    update_user_cache(user_id, db)
    await log_user_action(current_user["user_id"], f"[{current_user['username']}] gán vai trò '{role.name}' cho user {user_id}")

    return {"detail": "Vai trò đã được gán", "user_role": {"user_id": user_id, "role_name": role.name}}

# === API: Cập nhật vai trò người dùng (thay vai trò hiện tại sang vai trò khác) ===
@router.put("/user-roles/{user_id}", status_code=status.HTTP_200_OK)
async def update_user_role(user_id: int, user_role_request: UserRoleRequest, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật vai trò")

    new_role = db.query(Role).filter_by(name=user_role_request.role_name).first()
    if not new_role:
        raise HTTPException(status_code=404, detail="Vai trò mới không tồn tại")

    user_role = db.query(UserRole).filter_by(user_id=user_id).first()
    if not user_role:
        raise HTTPException(status_code=404, detail="Người dùng chưa được gán vai trò")

    user_role.role_id = new_role.id
    db.commit()

    redis_clients.delete(f"user_roles_{user_id}")
    update_user_cache(user_id, db)
    await log_user_action(current_user["user_id"], f"[{current_user['username']}] cập nhật vai trò người dùng {user_id} thành '{new_role.name}'")

    return {"detail": "Cập nhật vai trò thành công", "user_role": {"user_id": user_id, "role_name": new_role.name}}

# === API: Xóa vai trò người dùng ===
@router.delete("/user-roles/{user_id}/{role_name}", status_code=status.HTTP_200_OK)
async def delete_user_role(user_id: int, role_name: str, db: db_dependency, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa vai trò")

    role = db.query(Role).filter_by(name=role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Vai trò không tồn tại")

    user_role = db.query(UserRole).filter_by(user_id=user_id, role_id=role.id).first()
    if not user_role:
        raise HTTPException(status_code=404, detail="Người dùng không có vai trò này")

    db.delete(user_role)
    db.commit()

    redis_clients.delete(f"user_roles_{user_id}")
    update_user_cache(user_id, db)
    await log_user_action(current_user["user_id"], f"[{current_user['username']}] xóa vai trò '{role_name}' khỏi user {user_id}")

    return {"detail": "Xóa vai trò thành công", "user_id": user_id, "role_name": role_name}

@system_router.post("/user-roles/assign-admin-roles", status_code=status.HTTP_200_OK)
async def assign_admin_role(user_id: int, role_name: str, db: db_dependency):
    """Dành cho hệ thống gọi nội bộ khi tạo user"""
    role = db.query(Role).filter_by(name=role_name).first()
    if not role:
        role = Role(
            name=role_name,
            description="Vai trò quản trị viên hệ thống",
            created_at=datetime.utcnow()
        )
        db.add(role)
        db.commit()
        db.refresh(role)

    user_role = db.query(UserRole).filter_by(user_id=user_id, role_id=role.id).first()
    if user_role:
        return {"detail": "Người dùng đã có vai trò này"}

    user_role = UserRole(user_id=user_id, role_id=role.id)
    db.add(user_role)
    db.commit()
    db.refresh(user_role)

    # Cập nhật cache
    redis_clients.delete(f"user_roles_{user_id}")
    set_user_role_in_cache(user_id, [role.name])

    return {"detail": "Gán Role thành công!", "user_role": {"user_id": user_id, "role_name": role.name}}