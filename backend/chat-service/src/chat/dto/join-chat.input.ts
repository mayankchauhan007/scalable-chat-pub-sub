import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class JoinChatInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  chatId: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
