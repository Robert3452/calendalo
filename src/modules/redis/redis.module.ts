import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConversationStore } from './conversationStore';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380'),
    },
    ConversationStore,
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
