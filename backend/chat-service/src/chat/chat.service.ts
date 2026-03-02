import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { CreateChatInput } from './dto/create-chat.input';
import { SendMessageInput } from './dto/send-message.input';
import { JoinChatInput } from './dto/join-chat.input';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ChatMember)
    private memberRepository: Repository<ChatMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createChat(input: CreateChatInput): Promise<Chat> {
    const chat = this.chatRepository.create({ name: input.name });
    console.log("Connected:", process.env.HOSTNAME);
    const saved = await this.chatRepository.save(chat);

    // Auto-join the creator
    const member = this.memberRepository.create({
      chatId: saved.id,
      userId: input.creatorId,
    });
    await this.memberRepository.save(member);

    return this.chatRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['members'],
    });
  }

  async joinChat(input: JoinChatInput): Promise<ChatMember> {
    const chat = await this.chatRepository.findOne({ where: { id: input.chatId } });
    if (!chat) {
      throw new NotFoundException(`Chat ${input.chatId} not found`);
    }

    const existing = await this.memberRepository.findOne({
      where: { chatId: input.chatId, userId: input.userId },
    });
    if (existing) {
      return existing;
    }

    const member = this.memberRepository.create({
      chatId: input.chatId,
      userId: input.userId,
    });
    return this.memberRepository.save(member);
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    // Verify sender is a member of the chat
    const membership = await this.memberRepository.findOne({
      where: { chatId: input.chatId, userId: input.senderId },
    });
    if (!membership) {
      throw new BadRequestException('User is not a member of this chat');
    }

    const message = this.messageRepository.create({
      chatId: input.chatId,
      senderId: input.senderId,
      content: input.content,
    });
    return this.messageRepository.save(message);
  }

  async getChat(id: string): Promise<Chat | null> {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['members'],
    });
  }

  async getChats(): Promise<Chat[]> {
    return this.chatRepository.find({ relations: ['members'] });
  }

  async getChatsByUser(userId: string): Promise<Chat[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
    });
    if (memberships.length === 0) return [];

    const chatIds = memberships.map((m) => m.chatId);
    return this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.members', 'members')
      .whereInIds(chatIds)
      .getMany();
  }

  // AI-generated: cursor-based pagination for message history, ordered by createdAt
  // to guarantee consistent ordering across instances
  async getMessages(chatId: string, limit = 50, before?: string): Promise<Message[]> {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (before) {
      const cursor = await this.messageRepository.findOne({ where: { id: before } });
      if (cursor) {
        qb.andWhere('message.createdAt < :createdAt', { createdAt: cursor.createdAt });
      }
    }

    const messages = await qb.getMany();
    return messages.reverse(); // Return in chronological order
  }
}
