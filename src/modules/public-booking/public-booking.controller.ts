import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';

@Controller('public-booking')
export class PublicBookingController {
  constructor(private readonly publicBookingService: PublicBookingService) {}

  @Post(':slug/book')
  async book(@Body() dto: CreatePublicBookingDto, @Param('slug') slug: string) {
    return this.publicBookingService.book(slug, dto);
  }
  @Get(':slug/availability')
  async getAvailability(@Param('slug') slug: string) {
    return this.publicBookingService.findAvailabilityByAccountName(slug);
  }
  @Get(':slug/blocks')
  async getBlocks(@Param('slug') slug: string) {
    return this.publicBookingService.findBlockbyAccountName(slug);
  }
  @Get(':slug/bookings')
  async getBookings(@Param('slug') slug: string) {
    return this.publicBookingService.findBookingByAccountName(slug);
  }

  @Get(':slug/policies')
  async getPolicies(@Param('slug') slug: string) {
    return this.publicBookingService.findPoliciesByName(slug);
  }
}
