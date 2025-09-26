import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatDetail } from "@/hooks/chatBotAI/useChatDetail";
import useBannedKeywordsApi from "@/hooks/chatBotAI/banedKeyWordsAPI";
import TextareaAutosize from "react-textarea-autosize";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function ChatDetail() {
  const { chatId } = useParams();
  const { messages, isTyping, connected, sendMessage, sendTyping, violations } =
    useChatDetail(chatId);

  const { getAllBannedKeywords } = useBannedKeywordsApi();
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [input, setInput] = useState("");
  const [alerts, setAlerts] = useState([]);

  const messageListRef = useRef(null);
  const bottomRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Load banned keywords
  useEffect(() => {
    async function fetchBanned() {
      try {
        const keywords = await getAllBannedKeywords();
        setBannedKeywords(keywords.map((k) => k.keyword.toLowerCase()));
      } catch (err) {
        console.error("Không thể tải danh sách từ khóa bị cấm:", err);
      }
    }
    fetchBanned();
  }, [getAllBannedKeywords]);

  // Handle violations alerts
  useEffect(() => {
    if (violations.length > 0) {
      const serverAlerts = violations.map((v) => ({
        id: `server-${v.level}-${v.message}`,
        type: "server",
        level: v.level,
        message: v.message,
        ban_time: v.ban_time,
      }));
      setAlerts((prev) => {
        const localAlerts = prev.filter((a) => a.type === "local");
        const newServerAlerts = serverAlerts.filter(
          (sa) => !prev.some((a) => a.id === sa.id)
        );
        return [...localAlerts, ...newServerAlerts];
      });
    } else {
      setAlerts((prev) => prev.filter((a) => a.type === "local"));
    }
  }, [violations]);

  // Track scroll to detect if user is near bottom
  const handleScroll = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  // Auto scroll when new message or typing
  useEffect(() => {
    if (isNearBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isNearBottom]);

  const handleSend = () => {
    if (!input.trim() || !connected) return;
    if (!connected) {
      alert("Chưa kết nối tới máy chủ. Vui lòng thử lại.");
      return;
    }
    const loweredInput = input.toLowerCase();
    const hasBanned = bannedKeywords.some((keyword) =>
      loweredInput.includes(keyword)
    );
    if (hasBanned) {
      const alertLocal = {
        id: `local-${Date.now()}`,
        type: "local",
        message: "Tin nhắn chứa từ khóa cấm, đã gửi cho server để xử lý.",
      };
      setAlerts((prev) => {
        const exists = prev.some(
          (a) => a.type === "local" && a.message === alertLocal.message
        );
        return exists ? prev : [...prev, alertLocal];
      });
    }

    sendMessage(input);
    setInput("");
  };

  const closeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4"
          role="alert"
        >
          {alerts.map(({ id, type, level, message, ban_time }) => (
            <div key={id} className="mb-1 flex justify-between items-center">
              <span>
                {type === "server" && (
                  <>
                    <strong>Vi phạm cấp độ {level}:</strong> {message}
                    {ban_time > 0 &&
                      ` (Cấm chat: ${Math.floor(ban_time / 60)} phút)`}
                  </>
                )}
                {type === "local" && <>{message}</>}
              </span>
              <button className="ml-4 underline" onClick={() => closeAlert(id)}>
                Đóng
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message list */}
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-background"
      >
        {messages.map(({ id, text, isBot, timestamp, role }) => (
          <div
            key={id}
            className={`flex ${isBot ? "justify-start" : "justify-end"}`}
          >
            {role === "system" ? (
              <div className="text-center text-sm italic text-red-500">
                {text}
              </div>
            ) : (
              <div
                className={`max-w-2xl rounded-xl px-5 py-4 shadow text-[15px] leading-relaxed transition-colors ${
                  isBot
                    ? "bg-muted text-foreground dark:bg-[#444654] dark:text-gray-100"
                    : "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
                }`}
              >
                <MarkdownRenderer content={text} />
                {timestamp && (
                  <div className="text-xs mt-2 text-right text-gray-400 dark:text-gray-300">
                    {new Date(timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TypingBubble />
            <span>Đang trả lời...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-2">
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping?.();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập tin nhắn..."
            disabled={!connected}
            className="flex-1 resize-none rounded-xl border bg-background px-4 py-2 text-sm text-foreground focus:outline-none dark:border-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            aria-label="Gửi"
          >
            <PaperPlaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex space-x-1 pl-4">
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
