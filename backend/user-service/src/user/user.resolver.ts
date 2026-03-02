import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';

@Resolver(() => User)
export class UserResolver {

  constructor(private userService: UserService) {}

  @Mutation(() => User)
  createUser(
    @Args('input') input: CreateUserInput,
  ) {
    return this.userService.create(input);
  }

  @Query(() => User, { nullable: true })
  user(@Args('id') id: string) {
    return this.userService.findById(id);
  }

  @Query(() => [User])
  users() {
    return this.userService.findAll();
  }
}