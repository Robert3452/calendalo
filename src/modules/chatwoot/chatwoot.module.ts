import { Module } from '@nestjs/common';
import { ChatwootController } from './chatwoot.controller';
import { ChatwootService } from './chatwoot.service';
import { ChatwootHandlerService } from './chatwoot-handler.service';
import { ChatwootApiService } from './chatwoot-api.service';

@Module({
  controllers: [ChatwootController],
  providers: [ChatwootService, ChatwootHandlerService, ChatwootApiService],
})
export class ChatwootModule {}
