import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Chat } from './chat.entity';

@ObjectType()
@Entity('chat_members')
@Unique(['chatId', 'userId'])
export class ChatMember {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  chatId: string;

  @Field()
  @Column('uuid')
  userId: string;

  @Field()
  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;
}
