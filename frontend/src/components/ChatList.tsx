import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CHATS, CREATE_CHAT, JOIN_CHAT } from '../graphql/queries';
import type { CurrentUser } from '../App';

interface ChatListProps {
  currentUser: CurrentUser;
  selectedChatId: string | null;
  onSelectChat: (chatId: string, chatName: string) => void;
}

function ChatList({ currentUser, selectedChatId, onSelectChat }: ChatListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newChatName, setNewChatName] = useState('');

  const { data, loading, refetch } = useQuery(GET_CHATS, { pollInterval: 5000 });
  const [createChat, { loading: creating }] = useMutation(CREATE_CHAT);
  const [joinChat] = useMutation(JOIN_CHAT);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim()) return;
    try {
      const { data } = await createChat({
        variables: { input: { name: newChatName.trim(), creatorId: currentUser.id } },
      });
      setNewChatName('');
      setShowCreate(false);
      refetch();
      onSelectChat(data.createChat.id, data.createChat.name);
    } catch (err: any) {
      alert(err.message || 'Failed to create chat');
    }
  };

  const handleJoinAndSelect = async (chatId: string, chatName: string) => {
    const chat = data?.chats?.find((c: any) => c.id === chatId);
    const isMember = chat?.members?.some((m: any) => m.userId === currentUser.id);

    if (!isMember) {
      try {
        await joinChat({
          variables: { input: { chatId, userId: currentUser.id } },
        });
        refetch();
      } catch (err: any) {
        alert(err.message || 'Failed to join chat');
        return;
      }
    }
    onSelectChat(chatId, chatName);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Create chat button / form */}
      <div className="p-3">
        {showCreate ? (
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Chat name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
          >
            + New Chat
          </button>
        )}
      </div>

      {/* Chat list */}
      {loading && <p className="text-gray-500 text-center text-sm p-4">Loading...</p>}
      <div className="space-y-1 px-3">
        {data?.chats?.map((chat: any) => {
          const isMember = chat.members?.some((m: any) => m.userId === currentUser.id);
          const isSelected = chat.id === selectedChatId;
          return (
            <button
              key={chat.id}
              onClick={() => handleJoinAndSelect(chat.id, chat.name)}
              className={`w-full text-left px-3 py-3 rounded-lg transition ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
              }`}
            >
              <div className="font-medium text-sm">{chat.name}</div>
              <div className="text-xs mt-0.5 opacity-60">
                {chat.members?.length || 0} members
                {!isMember && ' · Click to join'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChatList;
