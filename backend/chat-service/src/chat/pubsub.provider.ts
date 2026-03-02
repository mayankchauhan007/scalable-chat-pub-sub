// AI-generated: Redis-backed PubSub provider for cross-instance real-time message delivery.
// When multiple chat-service instances run behind a load balancer, in-memory PubSub
// would only deliver messages to subscribers on the same instance. Redis PubSub
// ensures all instances share the same event bus, so a message published on instance A
// is received by subscribers on instance B.
import { Provider } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

export const PUB_SUB = 'PUB_SUB';

export const PubSubProvider: Provider = {
  provide: PUB_SUB,
  useFactory: () => {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    return new RedisPubSub({
      publisher: new Redis({ host: redisHost, port: redisPort }),
      subscriber: new Redis({ host: redisHost, port: redisPort }),
    });
  },
};
