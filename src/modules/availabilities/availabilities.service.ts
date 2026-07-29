import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertAvailabilityDto } from './dto/upsert-availabiliy.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(accountId: string) {
    const availabilities = await this.prisma.availability.findMany({
      where: { accountId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return availabilities;
  }

  async upsertAvailability(accountId: string, dto: UpsertAvailabilityDto) {
    await this.prisma.$transaction([
      this.prisma.availability.deleteMany({ where: { accountId } }),
      this.prisma.availability.createMany({
        data: dto.slots.map((el) => ({ ...el, accountId })),
      }),
    ]);
    return this.findAll(accountId);
  }
}
