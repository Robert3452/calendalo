import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(
    @AccountId() accountId: string,
    @Body() createBlockDto: CreateBlockDto,
  ) {
    return this.blocksService.create(accountId, createBlockDto);
  }

  @Get()
  findAll(@AccountId() accountId: string) {
    return this.blocksService.findAll(accountId);
  }

  @Delete(':id')
  remove(@AccountId() accountId: string, @Param('id') id: string) {
    return this.blocksService.remove(accountId, id);
  }
}
