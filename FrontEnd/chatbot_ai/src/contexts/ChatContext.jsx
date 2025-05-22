// contexts/ChatContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chatId] = useState(() => localStorage.getItem('chatId') || uuidv4());
  const [token] = useState(() => localStorage.getItem('token') || "demo-token");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    localStorage.setItem('chatId', chatId);
    localStorage.setItem('token', token);

    if (!chatId || !token) return;

    const socket = new WebSocket(`ws://localhost:9003/api/chatbot_service/ws/${chatId}?token=${token}`);
    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    socket.onclose = (e) => {
      console.error("WebSocket disconnected:", e);
    };

    return () => {
      socket.close();
    };
  }, [chatId, token]);

  const sendMessage = (msgContent) => {
    const msg = {
      role: 'user',
      content: msgContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      setIsTyping(true);
    } else {
      console.error("❌ WebSocket chưa kết nối");
    }
  };

  // Giả lập trợ lý phản hồi sau vài giây nếu cần (tuỳ backend)
  useEffect(() => {
    if (!isTyping) return;

    const timer = setTimeout(() => setIsTyping(false), 3000); // auto stop typing sau 3s
    return () => clearTimeout(timer);
  }, [isTyping]);

  const value = useMemo(() => ({
    chatId,
    token,
    messages,
    isTyping,
    sendMessage
  }), [chatId, token, messages, isTyping]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
