import { useCallback } from "react";
import axiosAdminUser from "@/utils/axiosAdminUser";

export const useProfileAdmin = () => {
    const getAdmin = useCallback(async () => {
      const res = await axiosAdminUser.get("api/user_service/me/admin");
      return res.data;
    }, []);
    const getUpdateAdmin = async (id, payload) => {
        const res = await axiosAdminUser.put(`api/user_service/user/${id}`, payload);
        return res.data;
    }
    return {
        getAdmin,
        getUpdateAdmin,
    }
};