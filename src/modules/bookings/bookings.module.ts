import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { AiService } from 'src/ai/ai.service';
import { ToolExecutorService } from 'src/ai/tool-executor.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, AiService, ToolExecutorService],
  exports: [BookingsService],
})
export class BookingsModule {}
