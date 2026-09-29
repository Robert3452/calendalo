import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingWhereInput } from 'generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AiCreateBookingDto } from './dto/ai-create-booking.dto';
import { Booking } from 'generated/prisma/browser';
export interface IResponseAvailability {
  slotStart: string;
  slotEnd: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  summary: string;
  data?: T;
}
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

  async checkAiAvailability(
    accountId: string,
    startDate: string,
    strip: string = 'default',
  ): Promise<IResponseAvailability[]> {
    const franja = strip ? strip : 'default';
    const strips: Record<string, [string, string]> = {
      default: ['00:00', '23:59:59'],
      manana: ['08:00', '12:00'],
      tarde: ['12:00', '18:00'],
      noche: ['18:00', '22:00'],
    };
    const startDateTime = new Date(startDate);
    const [fromTime, toTime] = strips[franja];
    const result: IResponseAvailability[] = await this.prismaService.$queryRaw`
            with params as (
                SELECT ${startDateTime}::timestamp as start_date,  -- $1 :startDate
                      ${accountId}::TEXT as account_id,  -- $2 :accountId
                      ${fromTime}::time as from_time,  -- $3 :fromTime
                      ${toTime}::time as to_time     -- $4 :toTime
                ),
                  end_calc as (
                      SELECT  pm.account_id,
                              pm.start_date as start_date,
                              pm.from_time,
                              pm.to_time,
                              p."slotDurationMin" as slot_duration_min
                      from params pm
                      join policies p on p."accountId" = pm.account_id
                  ),
                  slots as (
                      SELECT e.account_id,
                            e.from_time,
                            e.to_time,
                            gs::timestamp as slot_start,
                            gs::timestamp + e.slot_duration_min * INTERVAL '1 MINUTE' AS slot_end
                      FROM end_calc e,
                      generate_series(
                          e.start_date::timestamp,
                          e.start_date::date + INTERVAL '1 day' - (e.slot_duration_min * INTERVAL '1 minute'),
                          e.slot_duration_min * INTERVAL '1 minute'
                      ) gs
                  ),
                  evaluated_slots as (
                      SELECT s.slot_start,
                            s.slot_end,
                            s.from_time,
                            s.to_time,
                            EXISTS(
                                SELECT 1 FROM availability a
                                where a."accountId" = s.account_id
                                    and a."dayOfWeek" = extract(dow from s.slot_start)
                                    and (s.slot_start::date + a."startTime"::time) <= s.slot_start
                                    and (s.slot_start::date + a."endTime"::time) >= s.slot_end
                            )
                            AND
                            not exists(
                                select 1 from blocks b
                                where b."accountId" = s.account_id
                                    and (s.slot_start::date + b."startTime"::time) < s.slot_end
                                    and (s.slot_start::date + b."endTime"::time) > s.slot_start
                            ) as available
                      from slots s
                  )
                  select slot_start::timestamp as "slotStart",
                        slot_end::timestamp as "slotEnd"
                  from evaluated_slots
                  where available = true
                    and slot_start::time >= from_time
                    and slot_start::time < to_time
                  order by slot_start;
      `;
    return result;
  }
  // Helpers
  parseToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async aiCreate(accountId: string, body: AiCreateBookingDto) {
    const availableSlots = await this.checkAiAvailability(
      accountId,
      body.startTime,
    );
    const slot = availableSlots.find((el) => {
      const slotFound = new Date(el.slotStart);
      const slotRequest = new Date(body.startTime);
      return slotFound === slotRequest;
    });
    if (!slot)
      throw new BadRequestException(
        `No se encuentra disponible de ${body.startTime}`,
      );
    const bookCreated: Booking = await this.prismaService.booking.create({
      data: {
        ...body,
        accountId,
        startTime: slot.slotStart,
        endTime: slot.slotEnd,
        status: 'confirmed',
      },
    });
    return bookCreated;
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
    await this.checkOverlapBooking(accountId, startDateTime, endDateTime);
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
