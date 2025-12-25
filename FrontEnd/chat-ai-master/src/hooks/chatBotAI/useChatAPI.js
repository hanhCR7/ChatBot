import axios from "@/utils/axiosChat";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { setChats, addChat, removeChat, setNameChat } from "@/store/chatSlice";

// ============================
// Helpers normalize dữ liệu
// ============================
const normalizeChat = (chat) => ({
  ...chat,
  createdAt: chat.createdAt ?? chat.created_at ?? null,
});

const normalizeMessage = (msg) => ({
  ...msg,
  createdAt: msg.createdAt ?? msg.created_at ?? null,
});

// ============================
// Hook API
// ============================
export const useChatApi = () => {
  const dispatch = useDispatch();

  // Lấy danh sách tất cả đoạn chat
  const getChats = useCallback(async () => {
    const res = await axios.get("api/chatbot_service/chat");
    const chats = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data.data)
      ? res.data.data
      : [];

    const normalized = chats.map(normalizeChat);
    dispatch(setChats(normalized));
    return normalized;
  }, [dispatch]);

  // Lấy đoạn chat theo ID
  const getChatById = useCallback(async (chatId) => {
    const res = await axios.get(`api/chatbot_service/chat/${chatId}`);
    return normalizeChat(res.data);
  }, []);

  // Tạo đoạn chat mới
  const createChat = useCallback(
    async (title = "New Chat") => {
      const res = await axios.post("api/chatbot_service/chat", { title });
      const normalized = normalizeChat(res.data);
      dispatch(addChat(normalized));
      return normalized;
    },
    [dispatch]
  );

  // Xoá đoạn chat
  const deleteChat = useCallback(
    async (chatId) => {
      await axios.delete(`api/chatbot_service/chat/${chatId}`);
      dispatch(removeChat(chatId));
    },
    [dispatch]
  );

  // Đổi tiêu đề đoạn chat
  const updateChatTitle = useCallback(
    async (chatId, title) => {
      await axios.put(`api/chatbot_service/chat/${chatId}`, { title });
      dispatch(setNameChat({ chatId, newTitle: title }));
    },
    [dispatch]
  );

  // Xoá 1 tin nhắn
  const deleteMessage = useCallback(async (messageId) => {
    await axios.delete(`api/chatbot_service/message/${messageId}`);
    // Redux update xử lý ở hook khác (nếu cần)
  }, []);

  return {
    getChats,
    getChatById,
    createChat,
    deleteChat,
    updateChatTitle,
    deleteMessage,
  };
};

export default useChatApi;
