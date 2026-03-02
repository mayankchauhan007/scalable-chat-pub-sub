import { gql } from '@apollo/client';

// --- User Service ---

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      createdAt
      isActive
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      username
      createdAt
      isActive
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      createdAt
    }
  }
`;

// --- Chat Service ---

export const GET_CHATS = gql`
  query GetChats {
    chats {
      id
      name
      createdAt
      members {
        id
        userId
        joinedAt
      }
    }
  }
`;

export const GET_CHATS_BY_USER = gql`
  query GetChatsByUser($userId: String!) {
    chatsByUser(userId: $userId) {
      id
      name
      createdAt
      members {
        id
        userId
        joinedAt
      }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($chatId: String!, $limit: Int, $before: String) {
    messages(chatId: $chatId, limit: $limit, before: $before) {
      id
      chatId
      senderId
      content
      createdAt
    }
  }
`;

export const CREATE_CHAT = gql`
  mutation CreateChat($input: CreateChatInput!) {
    createChat(input: $input) {
      id
      name
      createdAt
      members {
        id
        userId
      }
    }
  }
`;

export const JOIN_CHAT = gql`
  mutation JoinChat($input: JoinChatInput!) {
    joinChat(input: $input) {
      id
      chatId
      userId
      joinedAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      chatId
      senderId
      content
      createdAt
    }
  }
`;

export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription MessageSent($chatId: String!) {
    messageSent(chatId: $chatId) {
      id
      chatId
      senderId
      content
      createdAt
    }
  }
`;
