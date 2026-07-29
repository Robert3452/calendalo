import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UpsertPolciyDto } from './dto/create-polciy.dto';
import { PolciiesService } from './polciies.service';

import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('polciies')
@UseGuards(JwtAuthGuard)
export class PolciiesController {
  constructor(private readonly polciiesService: PolciiesService) {}

  @Post()
  upsert(
    @AccountId() accountId: string,
    @Body() createPolciyDto: UpsertPolciyDto,
  ) {
    return this.polciiesService.upsert(accountId, createPolciyDto);
  }

  @Get()
  findOne(@AccountId() accountId: string) {
    return this.polciiesService.findOne(accountId);
  }
}
