import { Plus, Search as SearchIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import { useChatApi } from "@/hooks/chatBotAI/useChatAPI";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState, useRef } from "react";
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

  // --- Load chats on mount ---
  useEffect(() => {
    getChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () =>
      rawData.filter((c) =>
        c.title?.toLowerCase().includes(filter.toLowerCase())
      ),
    [rawData, filter]
  );

  const grouped = groupChatsByDate(filtered);

  useEffect(() => {
    const currentId = location.pathname.split("/ChatBot/chat/")[1];
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
    navigate(`/ChatBot/chat/${chat.id}`);
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
    navigate("/ChatBot/images");
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
      <section key={label}>
        <p className="text-xs text-muted-foreground px-3 mt-3 mb-1 uppercase select-none">
          {label}
        </p>
        {chats.map((chat) => {
          const active = location.pathname === `/ChatBot/chat/${chat.id}`;
          if (editing === chat.id) return null;
          return (
            <ChatItem
              key={chat.id}
              ref={(el) => (chatRefs.current[chat.id] = el)}
              chat={chat}
              active={active}
              onClick={() => {
                navigate(`/ChatBot/chat/${chat.id}`);
                onClose?.();
              }}
              onRename={() => {
                setEditing(chat.id);
                setTitle(chat.title);
              }}
              onDelete={() => handleDelete(chat.id)}
            />
          );
        })}
      </section>
    );

  return (
    <AnimatePresence>
      {(open || window.innerWidth >= 1024) && (
        <motion.aside
          className="fixed lg:static inset-y-0 left-0 z-40 w-60 bg-card border-r flex flex-col"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="p-2 flex gap-2 items-center border-b">
            <Button
              size="icon"
              variant="secondary"
              onClick={handleNew}
              aria-label="Tạo đoạn chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={handleImageTab}
              aria-label="Tạo ảnh"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Tìm kiếm..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              icon={<SearchIcon className="w-4 h-4 opacity-50" />}
              aria-label="Tìm kiếm"
              autoComplete="off"
            />
          </div>

          <ScrollArea className="flex-1">
            {renderGroup("Today", grouped.today)}
            {renderGroup("Previous 7 Days", grouped.thisWeek)}
            {renderGroup("Older", grouped.older)}

            {editing && (
              <div className="px-4 py-2 border-t border-muted">
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSaveTitle(editing)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle(editing);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="text-sm"
                  placeholder="Đổi tên đoạn chat"
                />
              </div>
            )}
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
