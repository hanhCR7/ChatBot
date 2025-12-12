import { useCallback } from "react";
import axiosAdminUser from "@/utils/axiosAdminUser";

const useAdminUserApi = () => {
    const getAllUser = useCallback(async () => {
        const res = await axiosAdminUser.get("api/user_service/all-users");
        return Array.isArray(res.data.users) ? res.data.users : [];
    }, []);
    const createUser = async (first_name, last_name, username, email, password) => {
        const res = await axiosAdminUser.post("api/user_service/create-user", { first_name, last_name, username, email, password });
        return res.data;
    }
    const updateUser = async (userId, first_name, last_name, username, email, status) => {
        const payload = { first_name, last_name, username, email, status };
        const res = await axiosAdminUser.put(`api/user_service/user/${userId}`, payload);
        return res.data;
    }
    const deleteUser = async (userId) => {
        const res = await axiosAdminUser.delete(`api/user_service/user/${userId}`);
        return res.data;
    }
    const exportUserData = async () => {
        const res = await axiosAdminUser.get("api/user_service/export-list-users", {
            responseType: 'blob' // Để nhận dữ liệu file
        });
        // Tạo URL cho file blob
        const url = window.URL.createObjectURL(new Blob([res.data]));
        // Tạo link tải xuống
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'user_data.xlsx'); // Tên file tải xuống
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    const checkActiveUser = async (userId) => {
        const res = await axiosAdminUser.get(`api/user_service/check-invalid-user/${userId}`);
        return res.data;
    }
    const getListActiveUser = async () => {
        const res = await axiosAdminUser.get("api/user_service/users/list-active");
        return res.data.users;
    }
    const editActiveUser = async (userId) => {
        const res = await axiosAdminUser.put(`api/user_service/user/edit-active/${userId}`);
        return res.data;
    }
    const getCurrentUserInfo = async () => {
      const res = await axiosAdminUser.get("api/user_service/me");
      return res.data;
    };

    return {
      getAllUser,
      createUser,
      updateUser,
      deleteUser,
      exportUserData,
      checkActiveUser,
      getListActiveUser,
      editActiveUser,
      getCurrentUserInfo,
    };
}

export default useAdminUserApi;