import { InputType, Field } from '@nestjs/graphql';
import { Length, Matches } from 'class-validator';

@InputType()
export class CreateUserInput {

  @Field()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username: string;
}