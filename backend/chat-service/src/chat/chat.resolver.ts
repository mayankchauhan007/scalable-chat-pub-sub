import { Resolver, Query, Mutation, Subscription, Args, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { CreateChatInput } from './dto/create-chat.input';
import { SendMessageInput } from './dto/send-message.input';
import { JoinChatInput } from './dto/join-chat.input';
import { PUB_SUB } from './pubsub.provider';

const MESSAGE_SENT = 'messageSent';

@Resolver()
export class ChatResolver {
  constructor(
    private chatService: ChatService,
    @Inject(PUB_SUB) private pubSub: RedisPubSub,
  ) {}

  // --- Queries ---

  @Query(() => [Chat])
  chats() {
    return this.chatService.getChats();
  }

  @Query(() => Chat, { nullable: true })
  chat(@Args('id') id: string) {
    return this.chatService.getChat(id);
  }

  @Query(() => [Chat])
  chatsByUser(@Args('userId') userId: string) {
    return this.chatService.getChatsByUser(userId);
  }

  @Query(() => [Message])
  messages(
    @Args('chatId') chatId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('before', { nullable: true }) before?: string,
  ) {
    return this.chatService.getMessages(chatId, limit, before);
  }

  // --- Mutations ---

  @Mutation(() => Chat)
  createChat(@Args('input') input: CreateChatInput) {
    return this.chatService.createChat(input);
  }

  @Mutation(() => ChatMember)
  joinChat(@Args('input') input: JoinChatInput) {
    return this.chatService.joinChat(input);
  }

  // AI-generated: sendMessage publishes to Redis PubSub so all service instances
  // can deliver the new message to their WebSocket subscribers
  @Mutation(() => Message)
  async sendMessage(@Args('input') input: SendMessageInput) {
    const message = await this.chatService.sendMessage(input);
    console.log('[PubSub] Publishing message:', { chatId: message.chatId, messageId: message.id });
    await this.pubSub.publish(MESSAGE_SENT, { messageSent: message });
    console.log('[PubSub] Message published successfully');
    return message;
  }

  // --- Subscriptions ---

  // AI-generated: subscription filtered by chatId so clients only receive
  // messages for the chat they are viewing
  @Subscription(() => Message, {
    filter: (payload, variables) => {
      const matches = payload.messageSent.chatId === variables.chatId;
      console.log('[Subscription] Filter check:', { 
        payloadChatId: payload.messageSent.chatId, 
        variablesChatId: variables.chatId, 
        matches 
      });
      return matches;
    },
  })
  messageSent(@Args('chatId') chatId: string) {
    console.log('[Subscription] Client subscribed to chatId:', chatId);
    return this.pubSub.asyncIterator(MESSAGE_SENT);
  }
}
