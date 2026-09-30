import { Module } from '@nestjs/common';
import { ChatwootController } from './chatwoot.controller';
import { ChatwootService } from './chatwoot.service';
import { ChatwootHandlerService } from './chatwoot-handler.service';
import { ChatwootApiService } from './chatwoot-api.service';
import { AiModule } from '../ai/ai.module';
import { BookingsModule } from '../bookings/bookings.module';
import { ConversationStore } from '../redis/conversationStore';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AiModule, BookingsModule, RedisModule],
  controllers: [ChatwootController],
  providers: [
    ChatwootService,
    ChatwootHandlerService,
    ChatwootApiService,
    ConversationStore,
  ],
})
export class ChatwootModule {}
