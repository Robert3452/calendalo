import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AvailabilityService } from '../availabilities/availabilities.service';
import { BlocksService } from '../blocks/blocks.service';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly blockService: BlocksService,
    private readonly bookingService: BookingsService,
  ) {}

  private parseSlug(slug: string) {
    const name = slug.toLowerCase().split('-').join(' ');
    return name;
  }
  async book(slug: string, dto: CreatePublicBookingDto) {
    const accountName = this.parseSlug(slug);
    const accountFound = await this.prisma.account.findFirst({
      where: { name: accountName },
    });
    if (!accountFound) throw new NotFoundException('Business name not found');

    const result = await this.bookingService.create(accountFound.id, dto);
    return result;
  }

  async findAvailabilityByAccountName(slug: string) {
    const accountName = this.parseSlug(slug);
    const accountFound = await this.prisma.account.findFirst({
      where: { name: accountName },
    });
    if (!accountFound) throw new NotFoundException('Business name not found');
    const found = await this.availabilityService.findAll(accountFound.id);
    if (!found) throw new NotFoundException('Business availability not found');
    return found;
  }
  async findBookingByAccountName(slug: string) {
    const accountName = this.parseSlug(slug);
    const accountFound = await this.prisma.account.findFirst({
      where: { name: accountName },
    });
    if (!accountFound) throw new NotFoundException('Business name not found');
    const found = await this.prisma.booking.findMany({
      where: { accountId: accountFound.id, status: 'confirmed' },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });
    return found;
  }
  async findBlockbyAccountName(slug: string) {
    const accountName = this.parseSlug(slug);
    const accountFound = await this.prisma.account.findFirst({
      where: { name: accountName },
    });
    if (!accountFound) throw new NotFoundException('Business name not found');
    let found = await this.blockService.findAll(accountFound.id);
    found = found.map((el) => {
      el.reason = null;
      return el;
    });
    if (!found) throw new NotFoundException('Business block not found');
    return found;
  }
  async findPoliciesByName(slug: string) {
    const accountName = this.parseSlug(slug);
    const accountFound = await this.prisma.account.findFirst({
      where: { name: accountName },
    });
    if (!accountFound) throw new NotFoundException('Business name not found');
    const found = await this.prisma.policy.findFirst({
      where: { accountId: accountFound.id },
      select: {
        id: true,
        cancelLimitHours: true,
        minNoticeHours: true,
        slotDurationMin: true,
      },
    });

    return found;
  }
}
