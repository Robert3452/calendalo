import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @AccountId() accountId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(accountId, createBookingDto);
  }

  @Get()
  findAll(
    @AccountId() accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.bookingsService.findAll(accountId, from, to);
  }

  @Get(':id')
  findOne(@AccountId() accountId: string, @Param('id') id: string) {
    return this.bookingsService.findOne(accountId, id);
  }

  @Patch(':id/cancel')
  update(@AccountId() accountId: string, @Param('id') id: string) {
    return this.bookingsService.cancel(accountId, id);
  }
}
