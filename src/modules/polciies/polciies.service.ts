import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertPolciyDto } from './dto/create-polciy.dto';

@Injectable()
export class PolciiesService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(accountId: string, upsertPolciyDto: UpsertPolciyDto) {
    const result = await this.prismaService.policy.upsert({
      where: { accountId },
      update: upsertPolciyDto,
      create: { ...upsertPolciyDto, accountId },
    });
    return result;
  }

  async findOne(accountId: string) {
    const found = await this.prismaService.policy.findUnique({
      where: { accountId },
    });
    return found;
  }
}
