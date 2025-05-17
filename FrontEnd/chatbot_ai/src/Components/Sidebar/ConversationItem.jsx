// components/Sidebar/ConversationItem.jsx
import { MessageSquare, Clock } from 'lucide-react';

export default function ConversationItem({ conv, active, selectConversation, sidebarOpen }) {
  return (
    <button
      onClick={() => selectConversation(conv.id)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg
        ${active ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}
        ${!sidebarOpen && 'justify-center'}
      `}
    >
      <MessageSquare size={sidebarOpen ? 16 : 20} />
      {sidebarOpen && (
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-sm font-medium truncate w-full">{conv.title}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {conv.time}</span>
        </div>
      )}
    </button>
  );
}
