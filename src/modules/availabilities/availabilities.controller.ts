import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availabilities.service';
import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpsertAvailabilityDto } from './dto/upsert-availabiliy.dto';

@Controller('availabilities')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll(@AccountId() accountId: string) {
    const result = await this.availabilityService.findAll(accountId);
    return result;
  }

  @Post('upsert')
  async upsertAvailability(
    @AccountId() accountId: string,
    @Body() dto: UpsertAvailabilityDto,
  ) {
    return this.availabilityService.upsertAvailability(accountId, dto);
  }
}
