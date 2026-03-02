import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatMember } from './chat-member.entity';
import { Message } from './message.entity';

@ObjectType()
@Entity('chats')
export class Chat {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [ChatMember], { nullable: true })
  @OneToMany(() => ChatMember, (member) => member.chat, { eager: true })
  members?: ChatMember[];

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, (message) => message.chat)
  messages?: Message[];
}
