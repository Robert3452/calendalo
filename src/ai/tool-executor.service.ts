import { Injectable } from '@nestjs/common';
import { Booking } from 'generated/prisma/client';
import {
  BookingsService,
  IResponseAvailability,
  ToolResult,
} from 'src/modules/bookings/bookings.service';
import { AiCreateBookingDto } from 'src/modules/bookings/dto/ai-create-booking.dto';

export interface IQueryAvailability {
  accountId: string;
  startDate: string;
  strip: string;
}

export interface IToolCreateBooking {
  accountId: string;
  body: AiCreateBookingDto;
}

@Injectable()
export class ToolExecutorService {
  constructor(private bookingService: BookingsService) {}
  private formatAvailability(slots: IResponseAvailability[]): ToolResult {
    if (!slots.length) {
      return {
        success: true,
        summary: 'No hay horarios disponibles para esa fecha.',
        data: [],
      };
    }
    const horas = slots.map(
      (s) => this.hhmm(s.slotStart) + ' - ' + this.hhmm(s.slotEnd),
    );
    return {
      success: true,
      summary: `Hay ${slots.length} horarios disponibles: ${horas.join(', ')}.`,
      data: slots.map((s) => ({
        slotStart: s.slotStart,
        slotEnd: s.slotEnd,
        time: this.hhmm(s.slotStart),
      })),
    };
  }

  private formatBooking(booking: Booking): ToolResult {
    return {
      success: true,
      summary: `Reserva confirmada para el ${this.hhmm(booking.startTime)} del ${this.getDate(booking.startTime)}.`,
      data: {
        id: booking.id,
        startTime: booking.startTime,
        fin: booking.endTime,
        estado: booking.status,
      },
    };
  }

  private hhmm(d: Date | string) {
    return new Date(d).toISOString().slice(11, 16); // "14:30"
  }
  private getDate(d: Date | string) {
    return new Date(d).toISOString().slice(0, 10); // "2026-03-14"
  }
  async execute(
    name: string,
    args: IQueryAvailability | IToolCreateBooking,
  ): Promise<ToolResult> {
    switch (name) {
      case 'check_availability': {
        const availabilityArgs = args as IQueryAvailability;
        const slots = await this.bookingService.checkAiAvailability(
          availabilityArgs.accountId,
          availabilityArgs.startDate,
          availabilityArgs.strip,
        );
        return this.formatAvailability(slots);
      }
      case 'create_booking': {
        const bookingArgs = args as IToolCreateBooking;
        const bookingCreated = await this.bookingService.aiCreate(
          bookingArgs.accountId,
          bookingArgs.body,
        );
        return this.formatBooking(bookingCreated);
      }
      default:
        throw new Error(`Tool desconocida: ${name}`);
    }
  }
}
