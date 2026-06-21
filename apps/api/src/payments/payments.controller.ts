import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly svc: PaymentService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.svc.createRequest(dto.amount, dto.description ?? '');
  }

  @Post(':id/verify')
  verify(@Param('id') id: string) {
    return this.svc.verify(id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}
