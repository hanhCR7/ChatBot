import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: [], // Mỗi phần tử là 1 chat { id, title, messages: [] }
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.data = action.payload;
    },

    addChat: (state, action) => {
      state.data.unshift(action.payload); // Thêm vào đầu danh sách
    },

    addMessage: (state, action) => {
      const { idChat, role, content, timestamp, id } = action.payload;
      const chat = state.data.find((c) => c.id === idChat);
      if (!chat) return;

      if (!chat.messages) chat.messages = [];

      // Check trùng: cùng role + content + timestamp (gần đúng)
      const isDuplicate = chat.messages.some(
        (msg) =>
          msg.role === role &&
          msg.content === content &&
          Math.abs(msg.timestamp - timestamp) < 1000
      );

      if (!isDuplicate) {
        chat.messages.push({
          id: id || crypto.randomUUID(),
          role,
          content,
          timestamp,
        });
      }
    },

    setNameChat: (state, action) => {
      const { chatId, newTitle } = action.payload;
      const chat = state.data.find((c) => c.id === chatId);
      if (chat) {
        chat.title = newTitle;
      }
    },

    removeChat: (state, action) => {
      state.data = state.data.filter((chat) => chat.id !== action.payload);
    },

    updateMessagesInChat: (state, action) => {
      const { chatId, messages } = action.payload;
      const chat = state.data.find((c) => c.id === chatId);
      if (chat) {
        chat.messages = messages.map((msg) => ({
          id: msg.id || crypto.randomUUID(),
          role: msg.role,
          content: msg.userMess || msg.botMess || msg.content || "",
          timestamp: msg.timestamp || Date.now(),
        }));
      }
    },
  },
});

export const {
  setChats,
  addChat,
  addMessage,
  setNameChat,
  removeChat,
  updateMessagesInChat,
} = chatSlice.actions;

export default chatSlice.reducer;
