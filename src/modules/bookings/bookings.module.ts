import { forwardRef, Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ToolExecutorService } from '../ai/tool-executor.service';
// bookings.module.ts
@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [BookingsController],
  providers: [BookingsService, ToolExecutorService],
  exports: [BookingsService, ToolExecutorService],
})
export class BookingsModule {}
