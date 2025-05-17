// components/Sidebar/ConversationList.jsx
import ConversationItem from './ConversationItem';

export default function ConversationList({ conversations, activeId, selectConversation, sidebarOpen }) {
  return (
    <div className="flex-1 overflow-y-auto px-2">
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conv={conv}
          active={conv.id === activeId}
          selectConversation={selectConversation}
          sidebarOpen={sidebarOpen}
        />
      ))}
    </div>
  );
}
