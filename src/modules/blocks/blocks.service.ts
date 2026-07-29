import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { BlockWhereInput } from 'generated/prisma/models';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(accountId: string, createBlockDto: CreateBlockDto) {
    const { endTime, startTime } = createBlockDto;

    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    if (startTimeDate >= endTimeDate)
      throw new BadRequestException('Start time must be before endtime');

    const newBlock = await this.prisma.$transaction(async (tx) => {
      const where = this.buildOverlapWhere(accountId, startTime, endTime);
      const overlaps = await tx.block.findFirst({ where });
      if (overlaps)
        throw new BadRequestException(
          'Block already exists or is overlaping a previous Block',
        );
      const newBlock = await tx.block.create({
        data: { ...createBlockDto, accountId },
      });
      return newBlock;
    });
    return newBlock;
  }
  private buildOverlapWhere(
    accountId: string,
    startTime: string,
    endTime: string,
  ): BlockWhereInput {
    return {
      accountId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };
  }

  async findAll(accountId: string) {
    const blocks = await this.prisma.block.findMany({
      where: {
        accountId,
      },
      orderBy: { startTime: 'asc' },
    });
    return blocks;
  }

  async remove(accountId: string, id: string) {
    const removed = await this.prisma.$transaction([
      this.prisma.block.delete({ where: { id, accountId } }),
    ]);
    return removed;
  }
}
