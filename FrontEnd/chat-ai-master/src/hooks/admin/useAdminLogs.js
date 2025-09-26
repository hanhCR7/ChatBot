import axiosAdminLog from "@/utils/axiosAdminLogs";

const useAdminLogs = () => {
    const getAllLog = async (page=1, limit=10) => {
        const response = await axiosAdminLog.get(
          `/api/user_service/logs?page=${page}&limit=${limit}`
        );
        return response.data;
    }
    const getLogByUserId = async (userId, page=1, limit=10) => {
        const response = await axiosAdminLog.get(
          `/api/user_service/user/${userId}/logs?page=${page}&limit=${limit}`
        );
        return response.data;
    }
    return {
        getAllLog,
        getLogByUserId
    }
}
export default useAdminLogs;