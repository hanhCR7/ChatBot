import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: [], // [{ id, title, messages: [] }]
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.data = action.payload;
    },

    addChat: (state, action) => {
      state.data.unshift(action.payload);
    },

    addMessage: (state, action) => {
      const { idChat, role, content, timestamp, id, type, file } =
        action.payload;

      const chat = state.data.find((c) => c.id === idChat);
      if (!chat) return;

      if (!chat.messages) chat.messages = [];

      // Duplicate check ONLY by ID
      if (id && chat.messages.some((msg) => msg.id === id)) {
        return; // final messages or file messages
      }

      // Create message
      const newMsg = {
        id: id || crypto.randomUUID(),
        role,
        type: type || "text",
        content,
        file,
        timestamp: timestamp || new Date().toISOString(),
      };

      chat.messages.push(newMsg);
    },

    setNameChat: (state, action) => {
      const { chatId, newTitle } = action.payload;
      const chat = state.data.find((c) => c.id === chatId);
      if (chat) chat.title = newTitle;
    },

    removeChat: (state, action) => {
      state.data = state.data.filter((chat) => chat.id !== action.payload);
    },

    updateMessagesInChat: (state, action) => {
      const { chatId, messages } = action.payload;

      const chat = state.data.find((c) => c.id === chatId);
      if (!chat) return;

      chat.messages = messages.map((msg) => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.userMess || msg.botMess || msg.content || "",
        type: msg.type || "text",
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
    },

    // CHỈ clear 1 chat
    clearMessages: (state, action) => {
      const chatId = action.payload;
      const chat = state.data.find((c) => c.id === chatId);
      if (!chat) return;
      chat.messages = [];
    },
  },
});

export const {
  setChats,
  addChat,
  addMessage,
  addUploadFile,
  setNameChat,
  removeChat,
  updateMessagesInChat,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
