import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_MESSAGES, SEND_MESSAGE, MESSAGE_SENT_SUBSCRIPTION } from '../graphql/queries';
import { userClient } from '../graphql/client';
import { GET_USERS } from '../graphql/queries';
import type { CurrentUser } from '../App';

interface ChatRoomProps {
  currentUser: CurrentUser;
  chatId: string;
  chatName: string;
}

interface MessageType {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

function ChatRoom({ currentUser, chatId, chatName }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Fetch users for display names
  useEffect(() => {
    userClient.query({ query: GET_USERS }).then(({ data }) => {
      const map: Record<string, string> = {};
      data.users.forEach((u: any) => {
        map[u.id] = u.username;
      });
      setUserMap(map);
    });
  }, []);

  // Fetch message history
  const { loading } = useQuery(GET_MESSAGES, {
    variables: { chatId, limit: 100 },
    onCompleted: (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      seenIdsRef.current = new Set(msgs.map((m: MessageType) => m.id));
    },
    fetchPolicy: 'network-only',
  });

  // Reset on chat change
  useEffect(() => {
    setMessages([]);
    seenIdsRef.current = new Set();
  }, [chatId]);

  const { error: subError } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { chatId },
    onData: ({ data }) => {
      console.log('[Subscription] Received data:', data.data);
      const newMsg = data.data?.messageSent;
      if (newMsg && !seenIdsRef.current.has(newMsg.id)) {
        seenIdsRef.current.add(newMsg.id);
        setMessages((prev) => [...prev, newMsg]);
      }
    },
    onError: (error) => {
      console.error('[Subscription] Error:', error);
    },
    onComplete: () => {
      console.log('[Subscription] Completed');
    },
  });

  useEffect(() => {
    if (subError) {
      console.error('[Subscription] Hook error:', subError);
    }
  }, [subError]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      const { data } = await sendMessage({
        variables: {
          input: { chatId, senderId: currentUser.id, content: text },
        },
      });
      // Add to local state if subscription hasn't already delivered it
      const msg = data.sendMessage;
      if (!seenIdsRef.current.has(msg.id)) {
        seenIdsRef.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">{chatName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading && <p className="text-gray-500 text-center">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-gray-500 text-center text-sm mt-8">No messages yet. Say something!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id;
          const senderName = userMap[msg.senderId] || msg.senderId.slice(0, 8);
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-700 text-gray-100 rounded-bl-md'
                }`}
              >
                {!isOwn && (
                  <div className="text-xs font-medium text-indigo-300 mb-1">{senderName}</div>
                )}
                <div className="text-sm break-words">{msg.content}</div>
                <div className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-6 py-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatRoom;
