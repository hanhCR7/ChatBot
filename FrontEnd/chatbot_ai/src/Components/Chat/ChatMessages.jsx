import { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';

function mergeAssistantMessages(messages) {
  const merged = [];
  let temp = null;
  for (const msg of messages) {
    if (msg.role === 'assistant') {
      if (!temp) {
        temp = { ...msg };
      } else {
        temp.content += ' ' + msg.content;
      }
    } else {
      if (temp) {
        merged.push(temp);
        temp = null;
      }
      merged.push(msg);
    }
  }
  if (temp) merged.push(temp);
  return merged;
}

export default function ChatMessages({ messages, isTyping }) {
  const containerRef = useRef(null);
  const mergedMessages = mergeAssistantMessages(messages);

  const [displayedText, setDisplayedText] = useState('');
  const typingIntervalRef = useRef(null);

  const lastMsg = mergedMessages[mergedMessages.length - 1];
  const isAssistantLast = lastMsg?.role === 'assistant';

  // Hiệu ứng typing từng chữ
  useEffect(() => {
    if (isAssistantLast && lastMsg?.content) {
      let index = 0;
      const content = lastMsg.content;

      setDisplayedText(''); // reset trước khi typing

      typingIntervalRef.current = setInterval(() => {
        index++;
        setDisplayedText(content.slice(0, index));
        if (index >= content.length) {
          clearInterval(typingIntervalRef.current);
        }
      }, 20); // tốc độ gõ, có thể điều chỉnh

      return () => clearInterval(typingIntervalRef.current);
    }
  }, [lastMsg?.content]);

  // Auto scroll
  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
  }, [mergedMessages, displayedText]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
      {mergedMessages.map((msg, index) => {
        const isLast = index === mergedMessages.length - 1;
        const showTyping = isAssistantLast && isLast;

        return (
          <MessageItem
            key={msg.timestamp + index}
            msg={{
              ...msg,
              content: showTyping ? displayedText : msg.content
            }}
            isTyping={showTyping}
          />
        );
      })}
    </div>
  );
}
