import axiosAllChatUsers from "@/utils/axiosAllChatUsers";

const useAllChatUsers = () => {
  // Lấy tất cả các chat của tất cả user 
  const getAllChatUsers = async (page=1, limit=10) => {
    const res = await axiosAllChatUsers.get(
      `api/chatbot_service/all-chat-users?page=${page}&limit=${limit}`
    );
    return res.data;
  };
  const getAllMessageForChat = async(user_id) => {
    const res = await axiosAllChatUsers.get(
      `api/chatbot_service/chat-users/${user_id}`
    );
    return res.data
  }
  return{
    getAllChatUsers,
    getAllMessageForChat
  }
}
export default useAllChatUsers;
