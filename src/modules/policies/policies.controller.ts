import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UpsertPolciyDto } from './dto/create-policy.dto';
import { PoliciesService } from './policies.service';

import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly polciiesService: PoliciesService) {}

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
