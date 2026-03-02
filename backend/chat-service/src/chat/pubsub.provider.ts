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

    console.log(`[PubSub] Connecting to Redis at ${redisHost}:${redisPort}`);

    const publisher = new Redis({ host: redisHost, port: redisPort });
    const subscriber = new Redis({ host: redisHost, port: redisPort });

    publisher.on('connect', () => console.log('[PubSub] Publisher connected to Redis'));
    publisher.on('error', (err) => console.error('[PubSub] Publisher error:', err));
    
    subscriber.on('connect', () => console.log('[PubSub] Subscriber connected to Redis'));
    subscriber.on('error', (err) => console.error('[PubSub] Subscriber error:', err));
    subscriber.on('message', (channel, message) => {
      console.log('[PubSub] Received on channel:', channel, 'Message length:', message.length);
    });

    return new RedisPubSub({
      publisher,
      subscriber,
    });
  },
};
