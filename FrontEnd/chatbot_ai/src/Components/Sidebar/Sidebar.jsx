// components/Sidebar/Sidebar.jsx
import ConversationList from './ConversationList';
import { Bot, X, Menu, Plus, Search } from 'lucide-react';

export default function Sidebar({
  sidebarOpen, toggleSidebar, createNewConversation,
  conversations, selectConversation, activeId, mobileSidebarOpen,
  toggleMobileSidebar, setSearchValue
}) {
  return (
    <>
      {/* Toggle for mobile */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button onClick={toggleMobileSidebar} className="p-2 bg-white rounded-full shadow">
          {mobileSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        ${sidebarOpen ? 'md:w-72' : 'md:w-20'}
        fixed md:relative z-20 h-full transition-all bg-white border-r shadow
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          {sidebarOpen ? <h2 className="text-xl font-bold text-blue-600">ChatBot</h2> : <Bot className="text-blue-600" />}
          <button onClick={toggleSidebar} className="hidden md:block text-gray-500">{sidebarOpen ? <X /> : <Menu />}</button>
        </div>

        <div className="p-4">
          <button onClick={createNewConversation} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded py-2">
            <Plus size={18} /> {sidebarOpen && "Cuộc trò chuyện mới"}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-4 pb-2">
            <div className="relative">
              <input type="text" placeholder="Tìm kiếm..." onChange={(e) => setSearchValue(e.target.value)}
                className="w-full py-2 pl-9 pr-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
        )}

        <ConversationList
          conversations={conversations}
          activeId={activeId}
          selectConversation={selectConversation}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </>
  );
}
