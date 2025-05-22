import { useChat } from '../contexts/ChatContext';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatScreen() {
  const { messages, sendMessage, isTyping } = useChat();

  return (
    <div className="flex flex-col h-full">
      <ChatMessages messages={messages} isTyping={isTyping} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
