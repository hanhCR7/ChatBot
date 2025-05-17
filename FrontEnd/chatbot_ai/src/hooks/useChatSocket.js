import { useState, useEffect, useRef } from "react";

export function useChatSocket(chatId, token, setConversations) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!chatId || !token) {
      console.warn("❌ Missing token or chatId");
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:9003/api/chatbot_service/ws/${chatId}?token=${encodeURIComponent(token)}`
    );
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.role === "system" && data.event === "TITLE_UPDATED") {
          console.log("📝 Title updated:", data.title);
          if (typeof setConversations === "function") {
            setConversations(prev =>
              prev.map(conv =>
                conv.id === chatId ? { ...conv, title: data.title } : conv
              )
            );
          }
        } else {
          setMessages(prev => [...prev, data]);
        }
      } catch (err) {
        console.error("❌ Lỗi parse message:", err);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.warn("❌ WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [chatId, token]);

  const sendMessage = (text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(text);
    } else {
      console.warn("🔌 WebSocket is not open");
    }
  };

  return { messages, sendMessage, isTyping, connected };
}
