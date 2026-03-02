import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// AI-generated: Unit tests for ChatService using mocked TypeORM repositories.
// Tests verify business logic (membership checks, message ordering) without a real DB.

const mockChatRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockMemberRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const mockMessageRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ChatService', () => {
  let service: ChatService;
  let chatRepo: ReturnType<typeof mockChatRepo>;
  let memberRepo: ReturnType<typeof mockMemberRepo>;
  let messageRepo: ReturnType<typeof mockMessageRepo>;

  beforeEach(async () => {
    chatRepo = mockChatRepo();
    memberRepo = mockMemberRepo();
    messageRepo = mockMessageRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Chat), useValue: chatRepo },
        { provide: getRepositoryToken(ChatMember), useValue: memberRepo },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChat', () => {
    it('should create a chat and auto-join the creator', async () => {
      const chatId = 'chat-uuid';
      const creatorId = 'user-uuid';

      chatRepo.create.mockReturnValue({ name: 'Test Chat' });
      chatRepo.save.mockResolvedValue({ id: chatId, name: 'Test Chat' });
      memberRepo.create.mockReturnValue({ chatId, userId: creatorId });
      memberRepo.save.mockResolvedValue({ id: 'member-uuid', chatId, userId: creatorId });
      chatRepo.findOneOrFail.mockResolvedValue({
        id: chatId,
        name: 'Test Chat',
        members: [{ id: 'member-uuid', chatId, userId: creatorId }],
      });

      const result = await service.createChat({ name: 'Test Chat', creatorId });

      expect(chatRepo.create).toHaveBeenCalledWith({ name: 'Test Chat' });
      expect(chatRepo.save).toHaveBeenCalled();
      expect(memberRepo.create).toHaveBeenCalledWith({ chatId, userId: creatorId });
      expect(memberRepo.save).toHaveBeenCalled();
      expect(result.members).toHaveLength(1);
      expect(result?.members?.[0]?.userId).toBe(creatorId);
    });
  });

  describe('joinChat', () => {
    it('should throw NotFoundException if chat does not exist', async () => {
      chatRepo.findOne.mockResolvedValue(null);

      await expect(
        service.joinChat({ chatId: 'nonexistent', userId: 'user-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing membership if already joined', async () => {
      const existing = { id: 'member-uuid', chatId: 'chat-uuid', userId: 'user-uuid' };
      chatRepo.findOne.mockResolvedValue({ id: 'chat-uuid' });
      memberRepo.findOne.mockResolvedValue(existing);

      const result = await service.joinChat({ chatId: 'chat-uuid', userId: 'user-uuid' });
      expect(result).toEqual(existing);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it('should create new membership if not already a member', async () => {
      chatRepo.findOne.mockResolvedValue({ id: 'chat-uuid' });
      memberRepo.findOne.mockResolvedValue(null);
      const newMember = { id: 'new-member', chatId: 'chat-uuid', userId: 'user-uuid' };
      memberRepo.create.mockReturnValue(newMember);
      memberRepo.save.mockResolvedValue(newMember);

      const result = await service.joinChat({ chatId: 'chat-uuid', userId: 'user-uuid' });
      expect(result).toEqual(newMember);
      expect(memberRepo.save).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should throw BadRequestException if user is not a member', async () => {
      memberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendMessage({ chatId: 'chat-uuid', senderId: 'user-uuid', content: 'hello' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and return message if user is a member', async () => {
      memberRepo.findOne.mockResolvedValue({ id: 'member-uuid' });
      const msg = { id: 'msg-uuid', chatId: 'chat-uuid', senderId: 'user-uuid', content: 'hello' };
      messageRepo.create.mockReturnValue(msg);
      messageRepo.save.mockResolvedValue(msg);

      const result = await service.sendMessage({ chatId: 'chat-uuid', senderId: 'user-uuid', content: 'hello' });
      expect(result).toEqual(msg);
    });
  });

  describe('getMessages', () => {
    it('should return messages in chronological order', async () => {
      const msgs = [
        { id: '2', createdAt: new Date('2024-01-02') },
        { id: '1', createdAt: new Date('2024-01-01') },
      ];
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(msgs),
      };
      messageRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMessages('chat-uuid', 50);
      // Messages are reversed from DESC to ASC (chronological)
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });
});
