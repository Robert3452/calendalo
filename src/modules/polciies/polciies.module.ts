import { Module } from '@nestjs/common';
import { PolciiesService } from './polciies.service';
import { PolciiesController } from './polciies.controller';

@Module({
  controllers: [PolciiesController],
  providers: [PolciiesService],
})
export class PolciiesModule {}
