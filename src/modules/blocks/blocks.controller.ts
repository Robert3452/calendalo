import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AccountId } from 'src/common/decorators/account-id.decorator';

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
  remove(@Param('id') id: string) {
    return this.blocksService.remove();
  }
}
