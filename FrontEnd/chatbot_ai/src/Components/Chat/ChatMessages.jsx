import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

export default function ChatMessages({ messages, isTyping }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-200 text-gray-800 rounded-lg rounded-bl-none px-4 py-2 flex items-center">
            <span className="mr-2 animate-spin">💬</span>
            <p className="text-sm">Đăng nhập...</p>
          </div>
        </div>
      )}
    </div>
  );
}
