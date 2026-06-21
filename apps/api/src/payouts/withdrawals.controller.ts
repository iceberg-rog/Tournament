import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { WithdrawalService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** برداشت جایزه (UC29). کاربر درخواست می‌دهد؛ مدیر پرداخت/رد می‌کند. */
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly svc: WithdrawalService) {}

  @Post()
  request(
    @Request() req: { user: { id: string } },
    @Body() dto: { amount: number; iban: string },
  ) {
    return this.svc.request(req.user.id, dto.amount, dto.iban ?? '');
  }

  @Get()
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  pending() {
    return this.svc.listPending();
  }

  @Post(':id/pay')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  pay(@Param('id') id: string) {
    return this.svc.markPaid(id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  reject(@Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.svc.reject(id, dto.reason ?? 'رد شد');
  }
}
