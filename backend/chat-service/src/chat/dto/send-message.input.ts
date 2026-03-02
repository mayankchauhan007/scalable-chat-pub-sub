import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  chatId: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  senderId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;
}
