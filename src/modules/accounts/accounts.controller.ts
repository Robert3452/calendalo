import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AccountId } from 'src/common/decorators/account-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}
  @Get('me')
  findMe(@AccountId() accountId: string) {
    return this.accountsService.findOne(accountId);
  }

  @Patch('update')
  update(@AccountId() accountId: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(accountId, dto);
  }
  @Public()
  @Get('all')
  getAllAccounts() {
    return this.accountsService.getAll();
  }
}
