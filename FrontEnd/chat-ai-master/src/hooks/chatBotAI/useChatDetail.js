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
  const isMountedRef = useRef(true);
  // --- Ref giữ chat state để tránh useSelector trong callback ---
  const chatStateRef = useRef([]);
  const chatData = useSelector((s) => s.chat.data);
  useEffect(() => {
    chatStateRef.current = chatData;
  }, [chatData]);
  // --- Lấy token 1 lần ---
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (t) setToken(t);
  }, []);
  // --- Cleanup ---
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  // --- Reset khi đổi chatId ---
  useEffect(() => {
    setMessages([]);
    setPartialResponse("");
    setViolations([]);
  }, [chatId]);
  // --- Load dữ liệu chat ---
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
        const mapped = res.messages.map((msg) => ({
          id: msg.id || crypto.randomUUID(),
          text: msg.content || "",
          isBot: msg.role === "assistant",
          timestamp: msg.created_at
            ? new Date(msg.created_at).getTime()
            : Date.now(),
          role: msg.role,
        }));
        if (isMounted) {
          setMessages(mapped);
          dispatch(updateMessagesInChat({ chatId, messages: mapped }));
        }
      } catch (error) {
        if (isMounted) {
          console.error("Lỗi tải chat:", error);
          setMessages([]);
        }
      }
    };
    if (chatId) fetchData();
    return () => {
      isMounted = false;
    };
  }, [chatId, dispatch, getChats, getChatById]);
  // --- onMessage từ WebSocket ---
  const onMessage = useCallback(
    (data) => {
      let parsed = data;
      if (typeof data === "string") {
        try {
          parsed = JSON.parse(data);
        } catch {
          if (
            data.includes("Cảnh báo") ||
            data.includes("cấm chat") ||
            data.includes("Tài khoản của bạn đã bị khóa")
          ) {
            const violationObj = {
              type: "violation",
              role: "system",
              message: data,
              level: data.includes("5 phút")
                ? 2
                : data.includes("1 giờ")
                ? 3
                : data.includes("1 ngày")
                ? 4
                : 1,
              ban_time: data.includes("5 phút")
                ? 300
                : data.includes("1 giờ")
                ? 3600
                : data.includes("1 ngày")
                ? 86400
                : 0,
              timestamp: Date.now(),
            };
            setViolations((prev) => [...prev, violationObj]);
          }
          return;
        }
      }
      if (parsed.type === "violation") {
        setViolations((prev) => [...prev, parsed]);
        return;
      }
      const role = parsed.role || parsed.payload?.role;
      const content = parsed.content || parsed.payload?.content || "";
      const timestamp = parsed.timestamp || Date.now();
      if (!content) return;
      if (role === "assistant") {
        const fullMessage = content.trim();
        if (fullMessage) {
          dispatch(
            addMessage({
              idChat: chatId,
              userMess: null,
              botMess: fullMessage,
              timestamp,
            })
          );
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: fullMessage,
              isBot: true,
              role: "assistant",
              timestamp,
            },
          ]);
        }
        setPartialResponse("");
      } else if (role === "user") {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) => m.text === content && m.role === "user"
          );
          if (isDuplicate) return prev;
          dispatch(
            addMessage({
              idChat: chatId,
              userMess: content,
              botMess: null,
              timestamp,
            })
          );
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              text: content,
              isBot: false,
              role: "user",
              timestamp,
            },
          ];
        });
      } else if (role === "system") {
        if (
          content.includes("Cảnh báo") ||
          content.includes("cấm chat") ||
          content.includes("Tài khoản của bạn đã bị khóa")
        ) {
          const violationObj = {
            type: "violation",
            role: "system",
            message: content,
            level: content.includes("5 phút")
              ? 2
              : content.includes("1 giờ")
              ? 3
              : content.includes("1 ngày")
              ? 4
              : 1,
            ban_time: content.includes("5 phút")
              ? 300
              : content.includes("1 giờ")
              ? 3600
              : content.includes("1 ngày")
              ? 86400
              : 0,
            timestamp,
          };
          setViolations((prev) => [...prev, violationObj]);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: content,
            isBot: false,
            role: "system",
            timestamp,
          },
        ]);
      }
    },
    [dispatch, chatId]
  );
  const onPartialBuffer = useCallback((buffer) => {
    setPartialResponse(buffer);
  }, []);
  const shouldConnect = Boolean(
    token && chatId && typeof onMessage === "function"
  );
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
  const socketData = useChatSocket(
    chatId,
    token,
    onMessage,
    shouldConnect,
    onPartialBuffer,
    onUpdateTitle
  );
  const sendMessage = useCallback(
    (text) => {
      if (!socketData.connected) return false;
      const sent = socketData.sendMessage(text);
      if (sent) {
        const timestamp = Date.now();
        dispatch(
          addMessage({
            idChat: chatId,
            userMess: text,
            botMess: null,
            timestamp,
          })
        );
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
