import { forwardRef, useState } from "react";
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
    <div
      ref={ref} // ✅ now SidebarChat can access this
      className={`relative flex items-center px-4 py-2 rounded-md cursor-pointer select-none transition-colors ${
        active ? "bg-muted" : "hover:bg-muted/50"
      } group w-full`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="p-1 flex gap-2 items-center">{chat.title}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 p-0 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Menu"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          className="w-40 bg-popover border rounded-md shadow-lg text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onRename();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
          >
            <Pencil className="w-4 h-4" /> Đổi tên
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              if (window.confirm("Xoá đoạn chat này?")) onDelete();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-muted text-red-500 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

export default ChatItem;
