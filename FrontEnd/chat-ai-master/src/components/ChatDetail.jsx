import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import { PaperPlaneIcon, ReloadIcon } from "@radix-ui/react-icons";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import useBannedKeywordsApi from "@/hooks/chatBotAI/banedKeyWordsAPI";
import useChatDetail from "@/hooks/chatBotAI/useChatDetail";

export default function ChatDetail({ darkMode }) {
  const { chatId } = useParams();
  const {
    messages,
    sendMessage,
    isTyping,
    sendTyping,
    connected,
    partialResponse,
    violations,
  } = useChatDetail(chatId);

  const { getAllBannedKeywords } = useBannedKeywordsApi();
  const [input, setInput] = useState("");
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const typingTimer = useRef(null);

  /* ---------- Scroll ---------- */
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messageContainerRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 80);
  };
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: partialResponse ? "auto" : "smooth",
      });
    }
  }, [messages, partialResponse, isTyping, isNearBottom]);

  /* ---------- Load banned keywords ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllBannedKeywords();
        setBannedKeywords(data.map((k) => k.keyword.toLowerCase()));
      } catch (err) {
        console.error("Không thể tải từ khóa bị cấm:", err);
      }
    })();
  }, [getAllBannedKeywords]);

  const containsBanned = useCallback(
    (text) => bannedKeywords.some((k) => text.toLowerCase().includes(k)),
    [bannedKeywords]
  );

  const pushAlert = useCallback(({ type = "local", message = "" }) => {
    const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setAlerts((prev) => [...prev, { id, type, message }]);
  }, []);

  /* ---------- Server violations ---------- */
  useEffect(() => {
    if (!violations || violations.length === 0) return;
    const newAlerts = violations.map((v) => ({
      id: `server-${v.message}-${v.timestamp}`,
      type: "server",
      message: v.message,
      level: v.level,
      ban_time: v.ban_time,
    }));
    setAlerts((prev) => {
      const unique = newAlerts.filter((a) => !prev.some((p) => p.id === a.id));
      return [...prev, ...unique];
    });
  }, [violations]);

  /* ---------- Typing debounce ---------- */
  const handleSendTypingDebounced = useCallback(() => {
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping?.(), 300);
  }, [sendTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (!connected) {
      pushAlert({
        type: "local",
        message: "Chưa kết nối tới máy chủ. Tin nhắn chưa được gửi.",
      });
      return;
    }
    if (containsBanned(input.trim())) {
      pushAlert({
        type: "local",
        message: "Tin nhắn chứa từ khóa bị cấm. Hệ thống sẽ kiểm tra.",
      });
    }
    sendMessage(input.trim());
    setInput("");
  };

  useEffect(() => {
    return () => clearTimeout(typingTimer.current);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* connection */}
      {!connected && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
          <span className="inline-flex items-center gap-2">
            <ReloadIcon className="w-4 h-4 animate-spin" /> Đang kết nối lại...
          </span>
        </div>
      )}

      {/* alerts */}
      {alerts.length > 0 && (
        <div className="m-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 space-y-1 dark:bg-red-900 dark:border-red-700 dark:text-red-300">
          {alerts.map((a) => (
            <div key={a.id} className="flex justify-between items-center">
              <span className="text-sm">
                {a.type === "server" ? (
                  <>
                    <strong>Cảnh báo:</strong> {a.message}
                    {a.ban_time > 0 &&
                      ` (Cấm chat ${Math.floor(a.ban_time / 60)} phút)`}
                  </>
                ) : (
                  a.message
                )}
              </span>
              <button
                onClick={() =>
                  setAlerts((prev) => prev.filter((p) => p.id !== a.id))
                }
                className="text-xs underline ml-2"
              >
                Đóng
              </button>
            </div>
          ))}
        </div>
      )}

      {/* messages */}
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
      >
        {messages.map((msg) => (
          <MemoMessageBubble key={msg.id} {...msg} />
        ))}
        {partialResponse && (
          <MemoMessageBubble
            key="__partial_response"
            isBot
            role="assistant"
            text={partialResponse}
            streaming
          />
        )}
        {isTyping && <TypingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* input */}
      <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 transition-colors duration-300">
        <div className="flex items-end gap-2">
          <TextareaAutosize
            minRows={1}
            maxRows={6}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleSendTypingDebounced();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
            className="flex-1 resize-none rounded-xl border px-4 py-2 text-sm focus:outline-none bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 transition-colors duration-300"
            disabled={!connected}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-2 rounded-lg text-white transition bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-40"
          >
            <PaperPlaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- MessageBubble ---------- */
const MessageBubble = ({ isBot, text, timestamp, role, streaming }) => {
  if (role === "system")
    return (
      <div className="text-center text-sm italic text-red-500">{text}</div>
    );

  const botClasses =
    "bg-gray-100 text-gray-900 border border-gray-300 dark:bg-[#444654] dark:text-[#ECECF1] dark:border-[#565869]";
  const userClasses =
    "bg-[#DCF8C6] text-gray-900 dark:bg-[#2E7D32] dark:text-white";

  return (
    <div
      className={`flex ${
        isBot ? "justify-start" : "justify-end"
      } transition-all`}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`max-w-2xl rounded-xl px-5 py-4 shadow text-[15px] leading-relaxed ${
          isBot ? botClasses : userClasses
        }`}
      >
        <AnimatedText text={text} streaming={streaming} />
        {timestamp && (
          <div className="text-xs mt-2 text-right text-gray-500 dark:text-gray-400">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </motion.div>
    </div>
  );
};
const MemoMessageBubble = memo(MessageBubble);

/* ---------- AnimatedText ---------- */
function AnimatedText({ text = "", streaming = false }) {
  const [displayed, setDisplayed] = useState(text);
  const idxRef = useRef(text.length);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!streaming) {
      setDisplayed(text);
      idxRef.current = text.length;
      return;
    }
    if (text.length <= idxRef.current) {
      if (text.length < idxRef.current) {
        setDisplayed(text);
        idxRef.current = text.length;
      }
      return;
    }

    const append = () => {
      setDisplayed((prev) => prev + text.charAt(idxRef.current));
      idxRef.current++;
      if (idxRef.current >= text.length) clearInterval(intervalRef.current);
    };
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(append, 12);
    return () => clearInterval(intervalRef.current);
  }, [text, streaming]);

  return (
    <MarkdownRenderer
      content={displayed}
      className="text-gray-900 dark:text-[#ECECF1]"
    />
  );
}

/* ---------- TypingBubble ---------- */
function TypingBubble() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
      <div className="flex space-x-1 mr-2">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <span>Đang trả lời...</span>
    </div>
  );
}
