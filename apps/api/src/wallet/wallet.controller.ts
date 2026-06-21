import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { PaymentService, WalletService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class AmountDto {
  @IsInt()
  @Min(1000)
  amount!: number;
}

/** کیف پول کاربر: موجودی، تاریخچه (UC28)، و شارژ از طریق درگاه پرداخت. */
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly payments: PaymentService,
  ) {}

  @Get()
  balance(@Request() req: { user: { id: string } }) {
    return this.wallet.balance(req.user.id);
  }

  @Get('history')
  history(@Request() req: { user: { id: string } }) {
    return this.wallet.history(req.user.id);
  }

  /** آغاز شارژ: یک پرداخت می‌سازد و آدرس درگاه را برمی‌گرداند. */
  @Post('deposit')
  deposit(@Request() req: { user: { id: string } }, @Body() dto: AmountDto) {
    return this.payments.createRequest(dto.amount, `wallet topup:${req.user.id}`);
  }

  /** نهایی‌سازی شارژ: پرداخت را verify و در صورت موفقیت کیف پول را شارژ می‌کند. */
  @Post('deposit/:paymentId/verify')
  async verifyDeposit(
    @Request() req: { user: { id: string } },
    @Param('paymentId') paymentId: string,
  ) {
    const payment = await this.payments.verify(paymentId);
    if (payment.status === 'PAID') {
      await this.wallet.deposit(req.user.id, payment.amount, `topup:${payment.id}`);
    }
    return { payment, balance: await this.wallet.balance(req.user.id) };
  }
}
