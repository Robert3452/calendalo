import { Module } from '@nestjs/common';
import { AvailabilityController } from './availabilities.controller';
import { AvailabilityService } from './availabilities.service';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
