import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize from "react-textarea-autosize";
import { Sparkles } from "lucide-react";
import { PaperPlaneIcon, ReloadIcon } from "@radix-ui/react-icons";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import useBannedKeywordsApi from "@/hooks/chatBotAI/bannedKeyWordsAPI";
import useChatDetail from "@/hooks/chatBotAI/useChatDetail";


export default function ChatDetail({ darkMode }) {
  const { chatId } = useParams();
  const {
    messages,
    setMessages,
    sendMessage,
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
  const processedViolationsRef = useRef(new Set());
  const alertTimeoutsRef = useRef(new Map()); // Lưu timeout IDs cho từng alert

  /* ---------- Scroll ---------- */
  const handleScroll = useCallback(() => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messageContainerRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 80);
  }, []);
  
  // Optimized scroll with requestAnimationFrame
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: partialResponse ? "auto" : "smooth",
          block: "end",
        });
      });
    }
  }, [messages, partialResponse, isNearBottom]);

  /* ---------- Load banned keywords ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllBannedKeywords();
        const keywords = data.map((k) => k.keyword.toLowerCase());
        setBannedKeywords(keywords);
        console.log("✅ Đã tải", keywords.length, "từ khóa bị cấm:", keywords);
      } catch (err) {
        console.error("❌ Không thể tải từ khóa bị cấm:", err);
      }
    })();
  }, [getAllBannedKeywords]);

  const containsBanned = useCallback(
    (text) => {
      if (!bannedKeywords.length) return false;
      const textLower = text.toLowerCase();
      // Sử dụng word boundary để tránh false positive (giống backend)
      // Ví dụ: "class" không chứa "ass" nếu dùng word boundary
      return bannedKeywords.some((keyword) => {
        // Tạo regex pattern với word boundary
        const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return pattern.test(textLower);
      });
    },
    [bannedKeywords]
  );

  const pushAlert = useCallback(({ type = "local", message = "" }) => {
    const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    console.log("🚨 Alert được tạo:", { id, type, message });
    
    setAlerts((prev) => {
      const newAlerts = [...prev, { id, type, message }];
      console.log("📋 Alerts hiện tại:", newAlerts);
      return newAlerts;
    });
    
    // Tự động xóa alert sau 5 giây
    const timeoutId = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      alertTimeoutsRef.current.delete(id);
    }, 5000);
    
    // Lưu timeout ID để có thể cleanup nếu cần
    alertTimeoutsRef.current.set(id, timeoutId);
  }, []);

  /* ---------- Server violations ---------- */
  useEffect(() => {
    if (!violations || violations.length === 0) return;
    
    console.log("🔔 Nhận được violations từ server:", violations);
    
    // Lọc ra những violations chưa được xử lý
    const unprocessedViolations = violations.filter((v) => {
      const violationId = v.id || v.timestamp || `${v.message}-${v.timestamp}`;
      return !processedViolationsRef.current.has(violationId);
    });
    
    if (unprocessedViolations.length === 0) {
      console.log("⏭️ Tất cả violations đã được xử lý");
      return;
    }
    
    console.log("🆕 Violations mới cần xử lý:", unprocessedViolations);
    
    // Tạo alerts từ violations mới với ID unique
    const newAlerts = unprocessedViolations.map((v) => {
      const violationId = v.id || v.timestamp || `${v.message}-${v.timestamp}`;
      // Đánh dấu đã xử lý
      processedViolationsRef.current.add(violationId);
      
      return {
        id: `server-${violationId}-${Math.random().toString(36).substr(2, 9)}`,
        type: "server",
        message: v.message,
        level: v.level,
        ban_time: v.ban_time,
      };
    });
    
    console.log("📨 Tạo alerts từ violations:", newAlerts);
    
    // Thêm alerts mới vào danh sách (tránh duplicate)
    setAlerts((prev) => {
      const unique = newAlerts.filter((a) => !prev.some((p) => p.id === a.id));
      const updated = [...prev, ...unique];
      console.log("✅ Cập nhật alerts:", updated);
      
      // Tự động xóa alerts sau 5 giây
      unique.forEach((alert) => {
        const timeoutId = setTimeout(() => {
          setAlerts((current) => current.filter((a) => a.id !== alert.id));
          alertTimeoutsRef.current.delete(alert.id);
        }, 5000);
        alertTimeoutsRef.current.set(alert.id, timeoutId);
      });
      
      return updated;
    });
  }, [violations]);

  /* ---------- Typing debounce ---------- */
  const handleSendTypingDebounced = useCallback(() => {
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping?.(), 300);
  }, [sendTyping]);

  /* ---------- Send message ---------- */
  const handleSend = useCallback(async () => {
    if (!connected) {
      pushAlert({ type: "local", message: "Chưa kết nối tới máy chủ." });
      return;
    }

    // Xử lý gửi tin nhắn text thông thường
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Không cảnh báo ở client-side nữa, để server xử lý và gửi violation message về
    // Client-side check chỉ để debug/log
    if (containsBanned(trimmedInput)) {
      console.log("⚠️ [Client-side] Phát hiện từ khóa bị cấm trong:", trimmedInput);
      console.log("📤 [Client-side] Vẫn gửi lên server để server xử lý vi phạm");
      // Không push alert ở đây, đợi server gửi violation message về
    }

    sendMessage(trimmedInput);
    setInput("");
  }, [connected, input, containsBanned, sendMessage, pushAlert]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
      // Cleanup tất cả alert timeouts khi component unmount
      alertTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      alertTimeoutsRef.current.clear();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-all duration-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Connection Status */}
      <AnimatePresence>
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 text-center text-xs text-amber-600 dark:text-amber-400 py-2 px-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <ReloadIcon className="w-4 h-4 animate-spin" /> 
              Đang kết nối lại...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="relative z-50 m-4 space-y-2 fixed top-20 left-0 right-0 max-w-2xl mx-auto pointer-events-none">
          <AnimatePresence mode="popLayout">
            {alerts.map((a) => {
              console.log("🎨 [Render] Rendering alert:", a.id, a.message);
              return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 shadow-lg backdrop-blur-sm"
              >
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm font-medium flex-1">{a.message}</span>
                <button
                  onClick={() => {
                    // Clear timeout nếu có
                    const timeoutId = alertTimeoutsRef.current.get(a.id);
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                      alertTimeoutsRef.current.delete(a.id);
                    }
                    setAlerts((prev) => prev.filter((p) => p.id !== a.id));
                  }}
                  className="text-xs font-semibold hover:text-red-900 dark:hover:text-red-200 transition-colors px-2 py-1 rounded-md hover:bg-red-200/50 dark:hover:bg-red-800/50"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-8 space-y-6 scroll-smooth will-change-scroll"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !partialResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto"
          >
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm">
              <Sparkles className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Chào mừng đến với JarVis AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              Trợ lý lập trình thông minh của bạn
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm max-w-md">
              Hãy bắt đầu cuộc trò chuyện bằng cách đặt câu hỏi về lập trình, code review, hoặc upload file để phân tích.
            </p>
          </motion.div>
        )}

        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3,
              delay: index === messages.length - 1 ? 0 : 0.05,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="will-change-transform"
          >
            <MemoMessageBubble {...msg} index={index} />
          </motion.div>
        ))}
        
        {partialResponse && (
          <MemoMessageBubble
            key="__partial_response"
            isBot
            role="assistant"
            text={partialResponse}
            streaming
            index={messages.length}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 border-t border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">

          <div className="flex-1 relative">
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
              placeholder={connected ? "Nhập tin nhắn của bạn..." : "Đang kết nối..."}
              className="w-full resize-none rounded-2xl border-2 px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ease-out shadow-sm hover:shadow-md focus:shadow-lg will-change-transform"
              disabled={!connected}
            />
            <div className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-600 pointer-events-none">
              {input.length > 0 && `${input.length} ký tự`}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className="p-3.5 rounded-xl text-white transition-all duration-300 ease-out bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-md will-change-transform"
            title="Gửi tin nhắn"
          >
            <PaperPlaneIcon className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Nhấn <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-xs font-mono">Enter</kbd> để gửi, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-xs font-mono ml-1">Shift + Enter</kbd> để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- MessageBubble ---------- */
const MessageBubble = ({ isBot, text, timestamp, role, streaming, index }) => {
  if (role === "system")
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center text-sm italic text-red-500 dark:text-red-400 font-medium"
      >
        {text}
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.03,
        type: "spring",
        stiffness: 400,
        damping: 30,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={`flex ${isBot ? "justify-start" : "justify-end"} transition-all will-change-transform`}
    >
      <div className={`max-w-3xl ${isBot ? "md:max-w-2xl" : "md:max-w-xl"}`}>
        {isBot && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              JarVis AI
            </span>
          </div>
        )}
        
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`rounded-2xl px-5 py-4 shadow-lg text-[15px] leading-relaxed transition-all duration-300 ease-out will-change-transform ${
            isBot
              ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
              : "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-blue-500/20"
          }`}
        >
          <div className={`${isBot ? "" : "[&_code]:bg-blue-600/20 [&_code]:text-blue-100 [&_pre]:bg-blue-600/10"}`}>
            <MarkdownRenderer
              content={text}
              className={isBot ? "text-gray-900 dark:text-gray-100" : "text-white"}
            />
          </div>
          
          {streaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Đang trả lời...
              </span>
            </motion.div>
          )}
          
          {timestamp && (
            <div className={`text-xs mt-3 ${isBot ? "text-left" : "text-right"} text-gray-500 dark:text-gray-400 font-medium`}>
              {new Date(timestamp).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const MemoMessageBubble = memo(MessageBubble);
