// src/services/ChatService.js

export const createNewConversation = async (token) => {
  try {
    const res = await fetch("http://localhost:9003/api/chatbot_service/chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: "Cuộc trò chuyện mới" })
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return {
        success: true,
        conversation: {
          id: data.id,
          title: data.title || "Cuộc trò chuyện mới",
          time: "Bây giờ"
        }
      };
    } else {
      return {
        success: false,
        error: data.detail || "Không thể tạo cuộc trò chuyện mới"
      };
    }
  } catch (err) {
    console.error("❌ Lỗi tạo cuộc trò chuyện:", err);
    return {
      success: false,
      error: "Không thể kết nối đến máy chủ."
    };
  }
};
