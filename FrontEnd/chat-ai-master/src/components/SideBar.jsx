import { Plus, Search as SearchIcon, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { useChatApi } from "@/hooks/chatBotAI/useChatAPI";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ChatItem from "./ChatItem";
import { isToday, isThisWeek } from "date-fns";

// --- Helper group chats by date ---
function groupChatsByDate(chats) {
  const today = [];
  const thisWeek = [];
  const older = [];

  chats.forEach((chat) => {
    const createdAt = new Date(chat.createdAt);
    if (isToday(createdAt)) today.push(chat);
    else if (isThisWeek(createdAt, { weekStartsOn: 1 }) && !isToday(createdAt))
      thisWeek.push(chat);
    else older.push(chat);
  });

  return { today, thisWeek, older };
}

export default function SidebarChat({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { createChat, deleteChat, updateChatTitle, getChats } = useChatApi();
  const rawData = useSelector((s) => s.chat.data) ?? [];

  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const chatRefs = useRef({});
  const searchTimeoutRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Debounced search handler
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setFilter(value);
    }, 200);
  }, []);

  // --- Load chats on mount ---
  useEffect(() => {
    getChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Cleanup search timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const filtered = useMemo(
    () =>
      rawData.filter((c) =>
        c.title?.toLowerCase().includes(filter.toLowerCase())
      ),
    [rawData, filter]
  );

  const grouped = groupChatsByDate(filtered);

  useEffect(() => {
    const currentId = location.pathname.split("/chat/")[1];
    if (currentId && chatRefs.current[currentId]) {
      chatRefs.current[currentId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [rawData, location.pathname]);

  const handleNew = async () => {
    const chat = await createChat("New Chat");
    await getChats();
    navigate(`/chat/${chat.id}`);
    onClose?.();
    setTimeout(
      () =>
        chatRefs.current[chat.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        }),
      100
    );
  };

  const handleImageTab = () => {
    navigate("/images");
    onClose?.();
  };

  const handleSaveTitle = async (id) => {
    if (!title.trim()) return setEditing(null);
    await updateChatTitle(id, title.trim());
    await getChats();
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await deleteChat(id);
    await getChats();
  };

  const renderGroup = (label, chats) =>
    chats.length > 0 && (
      <motion.section
        key={label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mt-4 mb-2 uppercase tracking-wider select-none">
          {label}
        </p>
        {chats.map((chat, index) => {
          const active = location.pathname === `/ChatBot/chat/${chat.id}`;
          if (editing === chat.id) return null;
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ChatItem
                ref={(el) => (chatRefs.current[chat.id] = el)}
                chat={chat}
                active={active}
                onClick={() => {
                  navigate(`/chat/${chat.id}`);
                  onClose?.();
                }}
                onRename={() => {
                  setEditing(chat.id);
                  setTitle(chat.title);
                }}
                onDelete={() => handleDelete(chat.id)}
              />
            </motion.div>
          );
        })}
      </motion.section>
    );

  return (
    <AnimatePresence>
      {(open || window.innerWidth >= 1024) && (
        <>
          {/* Overlay for mobile */}
          {open && window.innerWidth < 1024 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            />
          )}

          <motion.aside
            className="fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl lg:shadow-none"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  JarVis AI
                </h2>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNew}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  aria-label="Tạo đoạn chat"
                >
                  <Plus className="w-4 h-4" />
                  <span>Chat mới</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImageTab}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  aria-label="Tạo ảnh"
                >
                  <ImageIcon className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Tìm kiếm chat..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 ease-out will-change-transform"
                  aria-label="Tìm kiếm"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 will-change-scroll">
              <div className="p-2">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 px-4"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <SearchIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {filter ? "Không tìm thấy chat nào" : "Chưa có cuộc trò chuyện nào"}
                    </p>
                    {!filter && (
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                        Tạo chat mới để bắt đầu
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <>
                    {renderGroup("Hôm nay", grouped.today)}
                    {renderGroup("7 ngày qua", grouped.thisWeek)}
                    {renderGroup("Cũ hơn", grouped.older)}
                  </>
                )}

                {/* Editing Input */}
                <AnimatePresence>
                  {editing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                    >
                      <Input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(editing)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle(editing);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="text-sm rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Đổi tên đoạn chat"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
