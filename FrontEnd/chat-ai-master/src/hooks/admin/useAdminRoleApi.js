import axiosAdminRole from "../../utils/axiosAdminRole";

const useAdminRoleApi = () => {
    // Hàm này sẽ được sử dụng để gọi API quản lý vai trò
    // Lấy tất cả vai trò
    const getAllRoles = async () => {
        const res = await axiosAdminRole.get("api/identity_service/roles");
        return res.data;
    };
    // Tạo vai trò
    const createRole = async (name, description) => {
        const res = await axiosAdminRole.post("api/identity_service/roles", {
            name,
            description,
        });
        return res.data;
    };
    // Cập nhật vai trò
    const updateRole = async (roleId, name, description) => {
        const res = await axiosAdminRole.put(
            `api/identity_service/role/update?role_id=${roleId}`,
            {
            name,
            description,
            }
        );
        return res.data;
    };
    // Xóa vai trò
    const deleteRole = async (roleId) => {
        const res = await axiosAdminRole.delete(`api/identity_service/role/${roleId}`);
        return res.data;
    };
    // Hàm này sẽ được sử dụng để gọi API quản lý quyền
    // Lấy tất cả quyền
    const getAllPermissions = async () => {
        const res = await axiosAdminRole.get("api/identity_service/permissions");
        return res.data;
    };
    // Tạo quyền mới
    const createPermission = async (name, description) => {
        const res = await axiosAdminRole.post("api/identity_service/permissions/create", {
            name,
            description,
        });
        return res.data;
    };
    // Cập nhật quyền
    const updatePermission = async (permissionId, name, description) => {
        const res = await axiosAdminRole.put(
            `api/identity_service/permission/update?permission_id=${permissionId}`,
            {
            name,
            description,
            }
        );
        return res.data;
    };
    // Xóa quyền
    const deletePermission = async (permissionId) => {
        const res = await axiosAdminRole.delete(`api/identity_service/permission/${permissionId}`);
        return res.data;
    };

    // Hàm này sẽ được sử dụng để gọi API quản lý quyền của vai trò
    // Lấy danh sách quyền của các vai trò
    const getRolePermissions = async () => {
        const res = await axiosAdminRole.get(`api/identity_service/role-permission`);
        return res.data;
    };
    // Tạo mới quyền vai trò
    const createRolePermission = async (roleName, permissionName) => {
        const res = await axiosAdminRole.post(
            `api/identity_service/role-permission/create`,
            { role_name: roleName, permission_name: permissionName }
        );
        return res.data;
    };
    // Cập nhật quyền vai trò
    const updateRolePermission = async (rolePermissionId, roleName, permissionName) => {
        const res = await axiosAdminRole.put(
            `api/identity_service/role-permission/update?role_permission_id=${rolePermissionId}`,
            { role_name: roleName, permission_name: permissionName }
        );
        return res.data;
    };
    // Xoá quyền vai trò
    const deleteRolePermission = async (rolePermissionId) => {
        const res = await axiosAdminRole.delete(
            `api/identity_service/role-permission/${rolePermissionId}`
        );
        return res.data;
    };
    // 1. Lấy vai trò người dùng
    const getUserRoles = async (userId) => {
        const res = await axiosAdminRole.get(`/api/identity_service/user-roles/${userId}`);
        return res.data;
    };

    // 2. Gán vai trò mới cho user
    const createUserRole = async (userId, roleName) => {
        const res = await axiosAdminRole.post(`/api/identity_service/user-roles/${userId}`, {
        role_name: roleName,
        });
        return res.data;
    };

    // 3. Cập nhật vai trò của user (thay thế toàn bộ)
    const updateUserRole = async (userId, newRoleName) => {
        const res = await axiosAdminRole.put(`/api/identity_service/user-roles/${userId}`, {
        role_name: newRoleName,
        });
        return res.data;
    };

    // 4. Xoá vai trò cụ thể
    const deleteUserRole = async (userId, roleName) => {
        const res = await axiosAdminRole.delete(`/api/identity_service/user-roles/${userId}/${roleName}`);
        return res.data;
    };

    return {
        getAllRoles,
        createRole,
        updateRole,
        deleteRole,
        getUserRoles,
        createUserRole,
        updateUserRole,
        deleteUserRole,
        getAllPermissions,
        createPermission,
        updatePermission,
        deletePermission,
        getRolePermissions,
        createRolePermission,
        updateRolePermission,
        deleteRolePermission
    };
}
export default useAdminRoleApi;