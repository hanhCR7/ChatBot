import axiosUploadFile from "@/utils/axiosUploadFile";

export const UploadFile = () => {
    const getFileUpload = async () => {
        const res = await axiosUploadFile.get("/api/chatbot_service/upload_file/me");
        return res.data;
    }
    const postFileUpload = async (formData) => {
        const res = await axiosUploadFile.post(
          "/api/chatbot_service/upload_file/generate",
          formData
        );
        console.log("Data: ", res.data)
        return res
    }
    const deleteFileUpload = async (file_id) => {
        const res = await axiosUploadFile.delete(
          `/api/chatbot_service/upload_file/me/${file_id}`
        );
        return res.data;
    }
    return{
        getFileUpload,
        postFileUpload,
        deleteFileUpload
    }
}
export default UploadFile