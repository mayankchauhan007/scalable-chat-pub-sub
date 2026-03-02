import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { userClient, chatClient } from './graphql/client';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';

// AI-generated: Top-level App component. We use two separate Apollo clients
// (one for user-service, one for chat-service) since they are independent GraphQL APIs.
// The chatClient wraps the main layout so chat queries/subscriptions work by default.
// Components that need the userClient use it directly.

export interface CurrentUser {
  id: string;
  username: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  if (!currentUser) {
    return (
      <ApolloProvider client={userClient}>
        <Login onLogin={setCurrentUser} />
      </ApolloProvider>
    );
  }

  return (
    <ApolloProvider client={chatClient}>
      <ChatLayout currentUser={currentUser} />
    </ApolloProvider>
  );
}

export default App;
