import axiosAdminImg from "@/utils/axiosAdminImg";

export const useAdminImg = () => {
  // Lấy toàn bộ ảnh
  const getAllImgUsers = async () => {
    const res = await axiosAdminImg.get(
      "/api/chatbot_service/images/admin/all-images"
    );
    return res.data;
  };

  // Xóa ảnh theo id
  const deleteImage = async (id) => {
    const res = await axiosAdminImg.delete(
      `/api/chatbot_service/images/admin/${id}`
    );
    return res.data;
  };

  // Cập nhật mô tả
  const updateImageDesc = async (id, description) => {
    const res = await axiosAdminImg.put(
      `/api/chatbot_service/images/admin/${id}`,
      { description }
    );
    return res.data;
  };

  // Tìm kiếm ảnh
  const searchImages = async (q, userId) => {
    const res = await axiosAdminImg.get(
      "/api/chatbot_service/images/admin/search",
      { params: { q, user_id: userId } }
    );
    return res.data;
  };

  // Thống kê
  const getStats = async () => {
    const res = await axiosAdminImg.get(
      "/api/chatbot_service/images/admin/stats"
    );
    return res.data;
  };

  return {
    getAllImgUsers,
    deleteImage,
    updateImageDesc,
    searchImages,
    getStats,
  };
};
