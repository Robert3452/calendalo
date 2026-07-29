import { Module } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service';
import { PublicBookingController } from './public-booking.controller';
import { AvailabilityModule } from '../availabilities/availabilities.module';
import { BlocksModule } from '../blocks/blocks.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [AvailabilityModule, BlocksModule, BookingsModule, PoliciesModule],
  controllers: [PublicBookingController],
  providers: [PublicBookingService],
})
export class PublicBookingModule {}
