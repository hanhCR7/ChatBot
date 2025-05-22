export default function MessageItem({ msg, isTyping }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap 
        ${isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border'}
      `}>
        {isTyping ? (
          <span>
            {msg.content}
            <TypingDots />
          </span>
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
}

// 💬 Component dấu ba chấm gõ
function TypingDots() {
  return (
    <span className="ml-1 inline-block w-4 text-gray-400 animate-pulse">
      <span className="inline-block">.</span>
      <span className="inline-block">.</span>
      <span className="inline-block">.</span>
    </span>
  );
}
