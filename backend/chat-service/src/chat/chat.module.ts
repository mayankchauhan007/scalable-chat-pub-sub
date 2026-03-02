import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { PubSubProvider } from './pubsub.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMember, Message])],
  providers: [ChatService, ChatResolver, PubSubProvider],
})
export class ChatModule {}
