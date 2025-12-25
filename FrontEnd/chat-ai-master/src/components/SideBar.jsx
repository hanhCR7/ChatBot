import {
  Plus,
  Search as SearchIcon,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useChatApi } from "@/hooks/chatBotAI/useChatAPI";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setNameChat } from "@/store/chatSlice";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ChatItem from "./ChatItem";
import { isToday, isThisWeek } from "date-fns";

/* ---------------- helpers ---------------- */

function groupChatsByDate(chats) {
  const today = [];
  const thisWeek = [];
  const older = [];

  chats.forEach((chat) => {
    const d = new Date(chat.createdAt);
    if (isToday(d)) today.push(chat);
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(chat);
    else older.push(chat);
  });

  return { today, thisWeek, older };
}

/* ---------------- component ---------------- */

export default function SidebarChat({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { createChat, deleteChat, updateChatTitle, getChats } = useChatApi();

  // 🔹 Redux data
  const chats = useSelector((s) => s.chat.data) ?? [];

  // 🔹 Local UI state
  const [filter, setFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");

  const chatRefs = useRef({});
  const searchTimeout = useRef(null);

  /* -------- load chats (1 lần) -------- */

  useEffect(() => {
    getChats();
  }, []); // eslint-disable-line

  /* -------- search debounce -------- */

  const onSearch = useCallback((v) => {
    setSearchValue(v);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setFilter(v), 200);
  }, []);

  /* -------- active chat scroll -------- */

  useEffect(() => {
    const id = location.pathname.split("/chat/")[1];
    if (id && chatRefs.current[id]) {
      chatRefs.current[id].scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [location.pathname, chats]);

  /* -------- filtered + grouped -------- */

  const filtered = useMemo(
    () =>
      chats.filter((c) =>
        c.title?.toLowerCase().includes(filter.toLowerCase())
      ),
    [chats, filter]
  );

  const grouped = groupChatsByDate(filtered);

  /* -------- actions -------- */

  const handleNewChat = async () => {
    const chat = await createChat("New Chat");
    navigate(`/chat/${chat.id}`);
    onClose?.();
  };

  const startRename = (chat) => {
    setEditingId(chat.id);
    setDraftTitle(chat.title || "");
  };

  
  const saveRename = async (chat) => {
    const newTitle = draftTitle.trim();

    setEditingId(null); // thoát edit NGAY

    if (!newTitle || newTitle === chat.title) return;

    dispatch(
      setNameChat({
        chatId: chat.id,
        newTitle,
      })
    );

    try {
      await updateChatTitle(chat.id, newTitle);
    } catch (e) {
      console.error("Rename failed", e);
    }
  };


  const handleDelete = async (id) => {
    await deleteChat(id);
    await getChats(); // delete thì vẫn fetch lại cho an toàn
  };

  /* -------- render group -------- */

  const renderGroup = (label, list) =>
    list.length > 0 && (
      <section className="mb-4">
        <p className="px-4 mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase">
          {label}
        </p>

        {list.map((chat) => {
          const active = location.pathname === `/chat/${chat.id}`;

          if (editingId === chat.id) {
            return (
              <div
                key={chat.id}
                ref={(el) => (chatRefs.current[chat.id] = el)}
                className="px-4 py-2"
              >
                <Input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => saveRename(chat)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.target.blur(); // 👈 blur để save
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="rounded-xl border-blue-500"
                />
              </div>
            );
          }

          return (
            <div
              key={chat.id}
              ref={(el) => (chatRefs.current[chat.id] = el)}
            >
              <ChatItem
                chat={chat}
                active={active}
                onClick={() => {
                  navigate(`/chat/${chat.id}`);
                  onClose?.();
                }}
                onRename={() => startRename(chat)}
                onDelete={() => handleDelete(chat.id)}
              />
            </div>
          );
        })}
      </section>
    );

  /* ================= render ================= */

  return (
    <AnimatePresence>
      {(open || window.innerWidth >= 1024) && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed lg:static inset-y-0 left-0 z-[100]"
        >
          <aside className="w-72 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold">JarVis AI</h2>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={handleNewChat}>
                  <Plus className="w-4 h-4" />
                  Chat mới
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => navigate("/images")}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* search */}
            <div className="p-4 border-b">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Tìm kiếm chat..."
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-500 mt-10">
                  Chưa có cuộc trò chuyện nào
                </p>
              ) : (
                <>
                  {renderGroup("Hôm nay", grouped.today)}
                  {renderGroup("7 ngày qua", grouped.thisWeek)}
                  {renderGroup("Cũ hơn", grouped.older)}
                </>
              )}
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
