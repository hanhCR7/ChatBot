import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  setNameChat,
  updateMessagesInChat,
} from "../../store/chatSlice";
import { useChatApi } from "./useChatAPI";
import { useChatSocket } from "./useChatSocket";

export const useChatDetail = (chatId) => {
  const dispatch = useDispatch();
  const { getChats, getChatById } = useChatApi();

  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partialResponse, setPartialResponse] = useState("");
  const [violations, setViolations] = useState([]);
  const pendingMessagesRef = useRef(new Set()); // Track messages being sent

  // --- lấy chat từ Redux ---
  const chatData = useSelector((s) => s.chat.data);

  // --- token từ localStorage ---
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (t) setToken(t);
  }, []);

  // --- reset khi đổi chat ---
  useEffect(() => {
    setMessages([]);
    setPartialResponse("");
    setViolations([]);
    pendingMessagesRef.current.clear(); // Clear pending messages when switching chats
  }, [chatId]);

  // --- load chat cũ từ API ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        await getChats();
        const res = await getChatById(chatId);
        if (!res?.messages || !Array.isArray(res.messages)) {
          if (isMounted) setMessages([]);
          return;
        }

        // Map messages
        const mapped = res.messages.map((msg) => {
          const content = msg.content || "";
          
          return {
            id: msg.id || crypto.randomUUID(),
            text: content,
            isBot: msg.role === "assistant",
            timestamp: msg.created_at
              ? new Date(msg.created_at).getTime()
              : Date.now(),
            role: msg.role,
          };
        });

        if (isMounted) {
          setMessages(mapped);
          dispatch(updateMessagesInChat({ chatId, messages: mapped }));
        }
      } catch (err) {
        if (isMounted) setMessages([]);
      }
    };

    if (chatId) fetchData();
    return () => (isMounted = false);
  }, [chatId, dispatch, getChats, getChatById]);

  // --- xử lý tin nhắn từ WebSocket ---
  const onMessage = useCallback(
    (data) => {
      let parsed = data;
      try {
        if (typeof data === "string") parsed = JSON.parse(data);
      } catch {
        if (typeof data === "string" && data.includes("Cảnh báo")) {
          parsed = { type: "violation", role: "system", message: data };
        } else return;
      }

      const {
        role,
        content,
        timestamp: isoTimestamp,
        streaming,
        event,
        title,
        type,
        file_url,
        file,
        message,
      } = parsed;

      // --- Vi phạm / cảnh báo / ban message ---
      if (
        type === "violation" ||
        (role === "system" && (content || message)?.includes("Cảnh báo")) ||
        (role === "system" && (content || message)?.includes("bị cấm chat"))
      ) {
        const msgText = message || content;
        
        // Xử lý message ban (khi user đang bị ban)
        if (msgText?.includes("bị cấm chat")) {
          const violationObj = {
            id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "violation",
            role: "system",
            message: msgText,
            level: 1, // Ban message không có level cụ thể, mặc định level 1
            ban_time: 0, // Đã bị ban rồi nên không có ban_time mới
            timestamp: isoTimestamp
              ? new Date(isoTimestamp).getTime()
              : Date.now(),
          };
          
          setViolations((prev) => {
            const updated = [...prev, violationObj];
            return updated;
          });
          return;
        }
        
        // Xử lý violation message thông thường
        // Backend đã gửi level và ban_time trong payload, sử dụng chúng thay vì parse từ text
        // Nếu không có (fallback cho legacy messages), parse từ text
        let violationLevel = parsed.level;
        let violationBanTime = parsed.ban_time;
        
        if (violationLevel === undefined || violationBanTime === undefined) {
          // Fallback: parse từ message text (cho backward compatibility)
          violationLevel = msgText.includes("5 phút")
            ? 2
            : msgText.includes("1 giờ")
            ? 3
            : msgText.includes("1 ngày")
            ? 4
            : 1;
          violationBanTime = msgText.includes("5 phút")
            ? 300
            : msgText.includes("1 giờ")
            ? 3600
            : msgText.includes("1 ngày")
            ? 86400
            : 0;
        }
        
        const violationObj = {
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "violation",
          role: "system",
          message: msgText,
          level: violationLevel,
          ban_time: violationBanTime,
          timestamp: isoTimestamp
            ? new Date(isoTimestamp).getTime()
            : Date.now(),
        };
        
        setViolations((prev) => {
          const updated = [...prev, violationObj];
          return updated;
        });
        return;
      }

      // --- sự kiện hệ thống (đổi tiêu đề) ---
      if (role === "system") {
        if (event === "TITLE_UPDATED" && title) {
          dispatch(setNameChat({ chatId, newTitle: title }));
        }
        return;
      }

      // --- tin nhắn từ trợ lý ---
      if (role === "assistant") {
        if (streaming) {
          setPartialResponse((prev) => prev + (content || ""));
          return;
        }

        const finalMessage = {
          id: crypto.randomUUID(),
          text: content,
          isBot: true,
          role: "assistant",
          timestamp: isoTimestamp
            ? new Date(isoTimestamp).getTime()
            : Date.now(),
        };

        setPartialResponse("");
        setMessages((prev) => [...prev, finalMessage]);
        dispatch(
          addMessage({
            idChat: chatId,
            userMess: null,
            botMess: content,
            timestamp: finalMessage.timestamp,
          })
        );
        return;
      }


      // --- tin nhắn người dùng (text) ---
      if (role === "user") {
        const messageKey = `user-${content}`;
        
        // Kiểm tra xem tin nhắn này đã được thêm vào pending chưa
        if (pendingMessagesRef.current.has(messageKey)) {
          // Đã có trong pending, chỉ cần remove khỏi pending và không thêm lại
          pendingMessagesRef.current.delete(messageKey);
          return;
        }

        const newMessage = {
          id: crypto.randomUUID(),
          text: content,
          isBot: false,
          role: "user",
          type: "text",
          timestamp: isoTimestamp
            ? new Date(isoTimestamp).getTime()
            : Date.now(),
        };

        setMessages((prev) => {
          // Kiểm tra duplicate dựa trên text và role trong vòng 5 giây
          const isDuplicate = prev.some(
            (m) =>
              m.text === content &&
              m.role === "user" &&
              Math.abs(m.timestamp - newMessage.timestamp) < 5000
          );
          if (isDuplicate) return prev;
          return [...prev, newMessage];
        });

        dispatch(
          addMessage({
            idChat: chatId,
            userMess: content,
            botMess: null,
            timestamp: newMessage.timestamp,
          })
        );
      }
    },
    [dispatch, chatId]
  );

  // --- khi bot đang stream ---
  const onPartialBuffer = useCallback((buffer) => {
    setPartialResponse(buffer);
  }, []);

  const onUpdateTitle = useCallback(
    (newTitle) => {
      dispatch(
        setNameChat({
          chatId,
          newTitle,
          updatedAt: Date.now(),
        })
      );
    },
    [dispatch, chatId]
  );


  // --- kết nối WebSocket ---
  const shouldConnect = Boolean(token && chatId);

  const socketData = useChatSocket(
    chatId,
    token,
    onMessage,
    shouldConnect,
    onPartialBuffer,
    onUpdateTitle
  );

  // --- gửi tin nhắn ---
  const sendMessage = useCallback(
    (text) => {
      if (!socketData.connected) return false;

      const sent = socketData.sendMessage(text);
      if (sent) {
        const timestamp = Date.now();
        const messageKey = `user-${text}`;
        
        // Đánh dấu tin nhắn này đang pending
        pendingMessagesRef.current.add(messageKey);
        
        // Tự động xóa khỏi pending sau 10 giây để tránh memory leak
        setTimeout(() => {
          pendingMessagesRef.current.delete(messageKey);
        }, 10000);

        dispatch(
          addMessage({
            idChat: chatId,
            userMess: text,
            botMess: null,
            timestamp,
          })
        );
        
        setMessages((prev) => {
          // Kiểm tra duplicate trước khi thêm
          const isDuplicate = prev.some(
            (m) =>
              m.text === text &&
              m.role === "user" &&
              Math.abs(m.timestamp - timestamp) < 1000
          );
          if (isDuplicate) return prev;
          
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              text,
              isBot: false,
              role: "user",
              timestamp,
            },
          ];
        });
      }

      return sent;
    },
    [socketData, dispatch, chatId]
  );

  return {
    messages,
    setMessages,
    sendMessage,
    isTyping: socketData.isTyping,
    sendTyping: socketData.sendTyping,
    connected: socketData.connected,
    partialResponse,
    violations,
  };
};

export default useChatDetail;
