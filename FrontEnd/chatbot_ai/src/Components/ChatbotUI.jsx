import { useState, useRef } from 'react';
import Sidebar from './Sidebar/Sidebar';
import ChatHeader from './Chat/ChatHeader';
import ChatMessages from './Chat/ChatMessages';
import ChatInput from './Chat/ChatInput';
import Suggestions from './Chat/Suggestions';
import { useChatSocket } from '../hooks/useChatSocket';
import { createNewConversation } from "../services/chatAPI";

export default function ChatbotUI() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);


  // ✅ Lấy token chính xác từ localStorage
  let token = '';
  try {
    const raw = localStorage.getItem("token");
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") token = parsed;
    else if (parsed?.access_token) token = parsed.access_token;
    else if (parsed?.token) token = parsed.token;
    else token = raw || '';
  } catch {
    token = localStorage.getItem("token") || '';
  }

  console.log("✅ Token passed to useChatSocket:", token);

  // ✅ Gọi WebSocket hook
  const { messages, sendMessage, connected } = useChatSocket(activeId, token, setConversations);

  const handleSendMessage = () => {
  if (!connected) {
    alert("⏳ WebSocket chưa sẵn sàng. Vui lòng đợi...");
    return;
  }
  if (!inputValue.trim() && !attachment) return;

  sendMessage(inputValue);
  setInputValue('');
  setAttachment(null);
};
 

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment({ name: file.name, size: file.size });
  };
  const removeAttachment = () => setAttachment(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  const handleCreateNewConversation = async () => {
    const result = await createNewConversation(token);
    if (result.success) {
      setConversations(prev => [result.conversation, ...prev]);
      setActiveId(result.conversation.id);
    } else {
      alert(result.error);
    }
  };

  const selectConversation = (id) => setActiveId(id);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
        createNewConversation={handleCreateNewConversation}
        conversations={conversations}
        selectConversation={selectConversation}
        activeId={activeId}
        setSearchValue={() => {}}
      />

      <div className={`flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300`}>
        <div className="flex-none">
          <ChatHeader title={conversations.find(c => c.id === activeId)?.title || 'ChatBot'} />
        </div>
        <div className="flex-1 min-h-0">
          {messages.length === 0 ? (
            <Suggestions onPromptClick={setInputValue} />
          ) : (
            <ChatMessages messages={messages} isTyping={false} />
          )}
        </div>
        <div className="flex-none">
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleKeyPress={handleKeyPress}
            handleSendMessage={handleSendMessage}
            handleAttachmentClick={handleAttachmentClick}
            removeAttachment={removeAttachment}
            attachment={attachment}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
