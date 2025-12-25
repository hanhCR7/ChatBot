import { forwardRef, useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const ChatItem = forwardRef(function ChatItem(
  { chat, active, onClick, onRename, onDelete },
  ref
) {
  const titleRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  /* ===== detect truncate ===== */
  useEffect(() => {
    if (!titleRef.current) return;
    const el = titleRef.current;
    setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [chat.title]);

  return (
    <div ref={ref} className="relative px-2">
      {/* ===== MAIN BUTTON ===== */}
      <button
        onClick={onClick}
        className={`
          group w-full rounded-lg px-3 py-2 text-left transition
          flex items-center gap-2
          ${
            active
              ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }
        `}
      >
        {/* ===== TITLE ===== */}
        <div
          className="flex-1 min-w-0"
          onMouseEnter={() => isTruncated && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span
            ref={titleRef}
            className="block truncate text-sm font-medium"
          >
            {chat.title}
          </span>
        </div>

        {/* ===== ACTIONS ===== */}
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild>
            <div
              onClick={(e) => e.stopPropagation()}
              className={`
                opacity-0 group-hover:opacity-100 transition
                ${active ? "opacity-100" : ""}
              `}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </DropdownMenu.Trigger>

          {/* ===== PORTAL FIX ===== */}
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="right"
              align="start"
              sideOffset={6}
              className="
                z-[99999] min-w-[160px]
                rounded-md border bg-white dark:bg-gray-900
                shadow-lg p-1 text-sm
              "
            >
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  onRename();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded
                  cursor-pointer outline-none
                  hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Pencil className="w-4 h-4" />
                Đổi tên
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  if (confirm("Xoá cuộc trò chuyện này?")) onDelete();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded
                  cursor-pointer outline-none
                  text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </button>

      {/* ===== TOOLTIP (CHỈ KHI TRUNCATE) ===== */}
      {typeof window !== "undefined" &&
        showTooltip &&
        isTruncated &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="
                fixed z-[99999]
                max-w-xs px-3 py-1.5
                rounded-md bg-gray-800 text-white
                text-sm shadow-lg pointer-events-none
              "
              style={{
                top:
                  titleRef.current?.getBoundingClientRect().bottom + 6,
                left:
                  titleRef.current?.getBoundingClientRect().left,
              }}
            >
              {chat.title}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
});

export default ChatItem;
