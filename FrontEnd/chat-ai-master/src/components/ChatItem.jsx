import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatItem = forwardRef(function ChatItem(
  { chat, active, onClick, onRename, onDelete },
  ref
) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex items-center px-4 py-3 rounded-xl cursor-pointer select-none transition-all duration-300 ease-out group will-change-transform ${
        active
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 min-w-0">
        <span
          className={`block truncate text-sm font-medium ${
            active ? "text-white" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {chat.title}
        </span>
        {chat.createdAt && (
          <span
            className={`text-xs mt-0.5 block ${
              active
                ? "text-blue-100"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {new Date(chat.createdAt).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: hovered || active ? 1 : 0, scale: hovered || active ? 1 : 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="will-change-transform"
          >
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 p-0 ${
                active
                  ? "text-white hover:bg-white/20"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              } transition-all`}
              aria-label="Menu"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl text-sm p-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onRename();
            }}
            className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium">Đổi tên</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              if (window.confirm("Xoá đoạn chat này?")) onDelete();
            }}
            className="flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Xoá</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
});

export default ChatItem;
