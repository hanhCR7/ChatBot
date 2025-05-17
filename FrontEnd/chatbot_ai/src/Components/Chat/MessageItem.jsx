// src/components/Chat/MessageItem.jsx
import { User, Bot } from 'lucide-react';

export default function MessageItem({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-xl w-fit rounded-2xl px-5 py-3 shadow-md transition-all
          ${isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
        `}
      >
        <div className="flex items-start gap-2">
          <div className="mt-1">
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
          <div className="flex-1 break-words whitespace-pre-line text-sm">
            {message.text}
            {message.attachment && (
              <div className="mt-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-xs">
                📎 {message.attachment.name} ({Math.round(message.attachment.size / 1024)} KB)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
