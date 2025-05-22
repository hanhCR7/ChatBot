// Components/Chat/TypingMessage.jsx
import { useEffect, useState } from 'react';

export default function TypingMessage({ content }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, index + 1));
      index++;
      if (index >= content.length) clearInterval(interval);
    }, 20); // tốc độ đánh máy

    return () => clearInterval(interval);
  }, [content]);

  return <span>{displayedText}</span>;
}
