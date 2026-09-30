import { Injectable } from '@nestjs/common';
import { Booking } from 'generated/prisma/client';
import {
  BookingsService,
  IResponseAvailability,
  ToolResult,
} from '../bookings/bookings.service';
import { AiCreateBookingDto } from '../bookings/dto/ai-create-booking.dto';
import { hhmm, slotLabel, longDate, DEFAULT_TZ } from './Time.util';

export interface IQueryAvailability {
  accountId: string;
  startDate: string;
  strip: string;
}

export interface IToolCreateBooking {
  accountId: string;
  body: AiCreateBookingDto;
}

export type ToolArgs = IQueryAvailability | IToolCreateBooking;

@Injectable()
export class ToolExecutorService {
  constructor(private bookingService: BookingsService) {}

  async execute(name: string, args: ToolArgs): Promise<ToolResult> {
    switch (name) {
      case 'check_availability': {
        const a = args as IQueryAvailability;
        this.requireString(a.accountId, 'accountId');
        this.requireIsoDate(a.startDate);

        const slots = await this.bookingService.checkAiAvailability(
          a.accountId,
          a.startDate,
          a.strip,
        );
        return this.formatAvailability(slots);
      }

      case 'create_booking': {
        const a = args as IToolCreateBooking;
        this.requireString(a.accountId, 'accountId');
        if (!a.body) throw new Error('Falta el cuerpo de la reserva');

        const booking = await this.bookingService.aiCreate(a.accountId, a.body);
        return this.formatBooking(booking);
      }

      default:
        throw new Error(`Tool desconocida: ${name}`);
    }
  }

  // ---------------------------------------------------------------- formato

  private formatAvailability(slots: IResponseAvailability[]): ToolResult {
    if (!slots.length) {
      return {
        success: true,
        summary: 'No hay horarios disponibles para esa fecha.',
        data: [],
      };
    }

    const horas = slots.map((s) => hhmm(s.slotStart));

    return {
      success: true,
      summary: `Hay ${slots.length} horarios disponibles: ${horas.join(', ')}.`,
      data: slots.map((s) => ({
        // ISO completo para que el modelo lo devuelva sin ambigüedad
        slotStart: new Date(s.slotStart).toISOString(),
        slotEnd: new Date(s.slotEnd).toISOString(),
        // etiquetas ya en hora de Lima, listas para mostrar
        time: hhmm(s.slotStart),
        label: slotLabel(s.slotStart),
      })),
    };
  }

  private formatBooking(booking: Booking): ToolResult {
    return {
      success: true,
      summary: `Reserva confirmada para el ${longDate(booking.startTime)} a las ${hhmm(booking.startTime)}.`,
      data: {
        id: booking.id,
        startTime: new Date(booking.startTime).toISOString(),
        endTime: new Date(booking.endTime).toISOString(),
        status: booking.status,
      },
    };
  }

  // -------------------------------------------------------------- validación

  private requireString(v: unknown, field: string): asserts v is string {
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error(`Falta ${field}`);
    }
  }

  private requireIsoDate(v: unknown): asserts v is string {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v)) {
      throw new Error('startDate debe tener formato YYYY-MM-DD');
    }
  }
}

export { DEFAULT_TZ };
