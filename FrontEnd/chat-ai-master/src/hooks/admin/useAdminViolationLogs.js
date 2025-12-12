import { useCallback } from "react";
import axiosAdminViolationLogs from "@/utils/axiosAdminViolationLogs";

const useAdminViolationLogs = () => {
    const getAllViolationLogs = useCallback(async (page=1, limit=20) => {
        const response = await axiosAdminViolationLogs.get(
          `/api/chatbot_service/violation_log?page=${page}&limit=${limit}`
        );
        return response.data;
    }, []);
    
    const deleteViolationLog = useCallback(async (violationLogId) => {
        const response = await axiosAdminViolationLogs.delete(
          `/api/chatbot_service/violation_log/${violationLogId}`
        );
        return response.data;
    }, []);
    
    return {
        getAllViolationLogs,
        deleteViolationLog
    }
}

export default useAdminViolationLogs;

