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
import { AiService } from 'src/modules/ai/ai.service';
import { AccountId } from 'src/common/decorators/account-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BookingsService, IResponseAvailability } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ChatDto, ChatMessageDto } from './dto/chat.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly ai: AiService,
  ) {}

  @Public()
  @Post('chat')
  async chat(
    @Body()
    body: ChatDto,
  ) {
    return this.ai.sendMessage(body.message, body.accountId, body.history);
  }

  @Post()
  create(
    @AccountId() accountId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(accountId, createBookingDto);
  }
  @Public()
  @Get('aiAvailability')
  aiAvailability(): Promise<IResponseAvailability[]> {
    return this.bookingsService.checkAiAvailability(
      'fa20e4b8-18e5-4ad2-b173-8f831ac3b126',
      '2026-09-14',
    );
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
