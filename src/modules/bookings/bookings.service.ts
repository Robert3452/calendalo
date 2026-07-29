import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingWhereInput } from 'generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkOverlapBooking(
    accountId: string,
    startDateTime: Date,
    endDateTime: Date,
  ) {
    const block = await this.prismaService.booking.findFirst({
      where: {
        accountId,
        startTime: { lt: endDateTime },
        endTime: { gt: startDateTime },
        status: 'confirmed',
      },
    });
    if (block)
      throw new BadRequestException(
        `There is another booking set in this slot already booked`,
      );
  }

  async checkBlocks(accountId: string, startDateTime: Date, endDateTime: Date) {
    const block = await this.prismaService.block.findFirst({
      where: {
        accountId,
        startTime: { lt: endDateTime },
        endTime: { gt: startDateTime },
      },
    });
    if (block)
      throw new BadRequestException(
        `There is a block between ${block.startTime.toUTCString()} and ${block.startTime.toUTCString()}`,
      );
  }
  async checkAvailability(
    accountId: string,

    startDateTime: Date,
    endDateTime: Date,
  ) {
    const dayOfWeek = startDateTime.getUTCDay();

    const slots = await this.prismaService.availability.findMany({
      where: { dayOfWeek, accountId },
    });

    if (slots.length === 0)
      throw new BadRequestException('No availabilities for this day');
    const startMin =
      startDateTime.getUTCHours() * 60 + startDateTime.getUTCMinutes();
    const endMin = endDateTime.getUTCHours() * 60 + endDateTime.getUTCMinutes();
    const fits = slots.some((el) => {
      const startAv = this.parseToMinutes(el.startTime);
      const endAv = this.parseToMinutes(el.endTime);
      return startAv <= startMin && endAv >= endMin;
    });
    if (!fits)
      throw new BadRequestException('Time is outside the available hours');
  }

  async validatePolicy(
    accountId: string,
    startDateTime: Date,
    endDateTime: Date,
  ) {
    const policyFound = await this.prismaService.policy.findUnique({
      where: { accountId },
    });
    if (!policyFound)
      throw new NotFoundException(
        'Policies not found, set up the policies first',
      );
    const now = new Date();
    const currentNoticeHour = new Date(startDateTime);
    // Verify if min notice hours complains to the booking
    currentNoticeHour.setHours(
      currentNoticeHour.getHours() - policyFound.minNoticeHours,
    );

    if (now > currentNoticeHour) {
      throw new ConflictException(
        `Book requires at least ${policyFound.minNoticeHours}h notice.`,
      );
    }
    // slot duration validation
    const currentSlotDurationMin =
      (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);

    if (currentSlotDurationMin !== policyFound.slotDurationMin) {
      throw new ConflictException(
        'The currrent slot duration is not matching with the slot duration policy',
      );
    }
  }

  // Helpers
  parseToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async create(accountId: string, createBookingDto: CreateBookingDto) {
    const { startTime, endTime } = createBookingDto;
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (startDateTime > endDateTime) {
      throw new BadRequestException(
        'The start time must be less than end time',
      );
    }
    await this.validatePolicy(accountId, startDateTime, endDateTime);
    await this.checkAvailability(accountId, startDateTime, endDateTime);
    await this.checkBlocks(accountId, startDateTime, endDateTime);
    await this.checkBlocks(accountId, startDateTime, endDateTime);

    const result = await this.prismaService.$transaction([
      this.prismaService.booking.create({
        data: { ...createBookingDto, accountId, status: 'confirmed' },
      }),
    ]);

    return result;
  }

  async findOne(accountId: string, id: string) {
    const found = await this.prismaService.booking.findUnique({
      where: { accountId, id },
    });
    if (!found) throw new NotFoundException('Booking not found');
    return found;
  }
  async findAll(accountId: string, from?: string, to?: string) {
    const where: BookingWhereInput = {
      accountId,
    };

    if (from && to) {
      where.startTime = { gte: new Date(from) };
      where.endTime = { lte: new Date(to) };
    }
    const bookings = await this.prismaService.booking.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
    return bookings;
  }
  async cancel(accountId: string, id: string) {
    const booking = await this.findOne(accountId, id);
    if (booking.status === 'cancelled')
      throw new BadRequestException('Booking already cancelled');
    const updated = await this.prismaService.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return updated;
  }
}
