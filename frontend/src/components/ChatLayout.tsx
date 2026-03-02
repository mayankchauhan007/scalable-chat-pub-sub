import { useState } from 'react';
import type { CurrentUser } from '../App';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';

interface ChatLayoutProps {
  currentUser: CurrentUser;
}

function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatName, setSelectedChatName] = useState<string>('');

  const handleSelectChat = (chatId: string, chatName: string) => {
    setSelectedChatId(chatId);
    setSelectedChatName(chatName);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Chats</h2>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as <span className="text-indigo-400 font-medium">{currentUser.username}</span>
          </p>
        </div>
        <ChatList
          currentUser={currentUser}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <ChatRoom
            currentUser={currentUser}
            chatId={selectedChatId}
            chatName={selectedChatName}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl text-gray-400 mb-2">Select a chat to start messaging</h3>
              <p className="text-gray-500 text-sm">Or create a new chat from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatLayout;
