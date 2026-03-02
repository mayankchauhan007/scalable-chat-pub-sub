import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { DateTimeScalar } from './common/scalars/date.scalar';

@Module({
  imports: [
    // AI-generated: GraphQL config with WebSocket subscriptions enabled via graphql-ws
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      subscriptions: {
        'graphql-ws': {
          onConnect: (context: any) => {
            console.log('[GraphQL-WS] Client connected', context.connectionParams);
            return {};
          },
          onDisconnect: () => {
            console.log('[GraphQL-WS] Client disconnected');
          },
        },
      },
      context: ({ req, connection }) => {
        if (connection) {
          return connection.context;
        }
        return { req };
      },
    }),
    // AI-generated: environment-variable-driven DB config for Docker portability
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'chat_user',
      password: process.env.DB_PASSWORD || 'chat_password',
      database: process.env.DB_NAME || 'chat',
      autoLoadEntities: true,
      synchronize: true, // dev only
    }),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, DateTimeScalar],
})
export class AppModule {}
