// AI-generated: Apollo Client setup with split link for HTTP queries/mutations
// and WebSocket subscriptions. The split function routes subscription operations
// over WebSocket and everything else over HTTP.
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8080/user-service';
const CHAT_SERVICE_URL =
  import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:8080/chat-service';
const CHAT_WS_URL =
  import.meta.env.VITE_CHAT_WS_URL || 'ws://localhost:8080/chat-service';

export const userClient = new ApolloClient({
  link: new HttpLink({ uri: `${USER_SERVICE_URL}/graphql` }),
  cache: new InMemoryCache(),
});

const chatHttpLink = new HttpLink({ uri: `${CHAT_SERVICE_URL}/graphql` });

const chatWsLink = new GraphQLWsLink(
  createClient({
    url: `${CHAT_WS_URL}/graphql`,
    connectionParams: {},
    shouldRetry: () => true,
  }),
);

// AI-generated: split link directs subscriptions to WebSocket, queries/mutations to HTTP
const chatSplitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  chatWsLink,
  chatHttpLink,
);

export const chatClient = new ApolloClient({
  link: chatSplitLink,
  cache: new InMemoryCache(),
});
