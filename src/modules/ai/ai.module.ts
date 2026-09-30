// ai.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [forwardRef(() => BookingsModule)],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
