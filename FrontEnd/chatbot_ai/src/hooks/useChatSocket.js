import { useState, useEffect, useRef } from "react";

export function useChatSocket(chatId, token, setConversations) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId || !token) {
      console.warn("❌ Missing token or chatId");
      return;
    }

    let socket;

    const connect = () => {
      socket = new WebSocket(
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
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === chatId ? { ...conv, title: data.title } : conv
                )
              );
            }
          }else if(data.role === "system" && data.event === "TYPING") {
            setIsTyping(true);
          }
           else {
            setIsTyping(false);
            setMessages((prev) => [...prev, data]);
          }
        } catch (err) {
          console.error("❌ Lỗi parse message:", err);
        }
      };

      socket.onclose = (event) => {
        setConnected(false);
        console.warn("❌ WebSocket disconnected", event);
        // Thử reconnect sau 3 giây
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        // Đóng socket để kích hoạt onclose => reconnect
        if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
          socket.close();
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [chatId, token, setConversations]);

  const sendMessage = (text) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(text);
    } else {
      console.warn("🔌 WebSocket is not open");
    }
  };

  return { messages, sendMessage, isTyping, connected };
}
