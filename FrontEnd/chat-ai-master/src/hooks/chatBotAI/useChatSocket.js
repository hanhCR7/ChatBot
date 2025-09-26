import { useEffect, useRef, useState, useCallback } from "react";

export function useChatSocket(
  chatId,
  token,
  onMessage,
  shouldConnect = true,
  onPartialBuffer,
  onUpdateTitle
) {
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const typingTimer = useRef(null);
  const bufferTimer = useRef(null);
  const lastTypingSent = useRef(0);
  const bufferRef = useRef("");

  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [banned, setBanned] = useState(false);
  const [banUntil, setBanUntil] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // --- pending title để tránh warning ---
  const [pendingTitle, setPendingTitle] = useState(null);

  // --- cleanup ---
  const cleanUp = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close(1000, "component unmounted or chat changed");
    }
    socketRef.current = null;
    clearTimeout(reconnectTimer.current);
    clearTimeout(typingTimer.current);
    clearTimeout(bufferTimer.current);
    bufferRef.current = "";
    setConnected(false);
    setIsTyping(false);
    setBanned(false);
    setBanUntil(null);
  };

  // --- parse violation string fallback ---
  const parseViolationString = (text) => {
    const ban_time = text.includes("5 phút")
      ? 300
      : text.includes("1 giờ")
      ? 3600
      : text.includes("1 ngày")
      ? 86400
      : 0;

    return {
      type: "violation",
      message: text,
      level: 1,
      ban_time,
    };
  };

  // --- main WS logic ---
  useEffect(() => {
    if (!shouldConnect || !chatId || !token) {
      cleanUp();
      return;
    }

    cleanUp(); // clear any old socket

    const wsUrl = `${
      import.meta.env.VITE_WS_BASE_URL
    }/api/chatbot_service/ws/${chatId}?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setBanned(false);
      setBanUntil(null);
    };

    socket.onmessage = (event) => {
      const raw = event.data;

      try {
        const data = JSON.parse(raw);

        // --- violation ---
        if (data.type === "violation") {
          onMessage?.(data);
          if (data.ban_time > 0) {
            setBanned(true);
            setBanUntil(Date.now() + data.ban_time * 1000);
          }
          setIsTyping(false);
          return;
        }

        // --- typing ---
        if (data.type === "typing") {
          setIsTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
          return;
        }

        // --- TITLE_UPDATED ---
        if (data.event === "TITLE_UPDATED") {
          setPendingTitle(data.title); // chỉ set local state
          return;
        }

        // --- assistant stream done ---
        if (data.event === "DONE") {
          clearTimeout(bufferTimer.current);
          if (bufferRef.current.trim()) {
            onMessage?.({
              role: "assistant",
              content: bufferRef.current.trim(),
              timestamp: new Date().toISOString(),
            });
            bufferRef.current = "";
            onPartialBuffer?.("");
          }
          setIsTyping(false);
          return;
        }

        // --- normal message ---
        const role = data.role || data.payload?.role;
        const content = data.content || data.payload?.content || "";
        const timestamp = data.timestamp || data.payload?.timestamp;

        if (role === "assistant") {
          // append to buffer
          bufferRef.current += content;
          onPartialBuffer?.(bufferRef.current);

          // flush after 2s idle
          clearTimeout(bufferTimer.current);
          bufferTimer.current = setTimeout(() => {
            if (bufferRef.current.trim()) {
              onMessage?.({
                role: "assistant",
                content: bufferRef.current.trim(),
                timestamp,
              });
              bufferRef.current = "";
              onPartialBuffer?.("");
            }
          }, 2000);
        } else {
          onMessage?.({ role, content, timestamp });
        }
      } catch {
        // fallback nếu server gửi plain string warning
        if (
          typeof raw === "string" &&
          (raw.includes("Cảnh báo") ||
            raw.includes("cấm chat") ||
            raw.includes("Tài khoản của bạn đã bị khóa") ||
            raw.includes("Email thông báo"))
        ) {
          const violationData = parseViolationString(raw);
          onMessage?.(violationData);

          if (violationData.ban_time > 0) {
            setBanned(true);
            setBanUntil(Date.now() + violationData.ban_time * 1000);
          }
          setIsTyping(false);
        }
      }
    };

    socket.onclose = (e) => {
      setConnected(false);
      setIsTyping(false);
      if (e.code !== 1008) {
        reconnectTimer.current = setTimeout(
          () => setRetryCount((c) => c + 1),
          3000
        );
      }
    };

    return () => cleanUp();
  }, [chatId, token, shouldConnect, retryCount, onMessage, onPartialBuffer]);

  // --- gọi onUpdateTitle sau khi render xong để tránh warning ---
  useEffect(() => {
    if (pendingTitle && onUpdateTitle) {
      onUpdateTitle(pendingTitle);
      setPendingTitle(null);
    }
  }, [pendingTitle, onUpdateTitle]);

  // --- send message ---
  const sendMessage = useCallback(
    (text) => {
      if (banned) return false;
      if (connected && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ action: "sendMessage", content: text })
        );
        return true;
      }
      return false;
    },
    [connected, banned]
  );

  // --- send typing ---
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (
      connected &&
      socketRef.current?.readyState === WebSocket.OPEN &&
      now - lastTypingSent.current > 1000
    ) {
      socketRef.current.send(JSON.stringify({ action: "typing" }));
      lastTypingSent.current = now;
    }
  }, [connected]);

  return { sendMessage, sendTyping, isTyping, connected, banned, banUntil };
}
