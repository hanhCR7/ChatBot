import axios from "@/utils/axiosChat";

export const useChatImage = () => {
  // 1. Generate ảnh từ prompt
  const generateImage = async (prompt) => {
    const res = await axios.post("api/chatbot_service/images/generate", {
      prompt,
    });
    console.log(res.data);
    return res.data;
  };

  // 2. Lấy ảnh theo user hiện tại (tự động từ token backend)
  const getMyImages = async () => {
    const res = await axios.get("api/chatbot_service/images/user");
    return res.data;
  };

  // 3. Update description ảnh
  const updateImage = async (imageId, newDescription) => {
    const res = await axios.put(`api/chatbot_service/images/${imageId}`, 
      {
        description: newDescription,
      },
    );
    return res.data;
  };

  // 4. Xoá ảnh
  const deleteImage = async (imageId) => {
    const res = await axios.delete(`api/chatbot_service/images/${imageId}`);
    return res.data;
  };

  // 5. Admin lấy toàn bộ ảnh
  const getAllImages = async () => {
    const res = await axios.get("api/chatbot_service/images/all-images");
    return res.data;
  };

  return { generateImage, getMyImages, updateImage, deleteImage, getAllImages };
};
