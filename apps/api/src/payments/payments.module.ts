import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentService, SettingsService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaSettingsRepository } from '../settings/prisma-settings.repository';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { DynamicPaymentGateway } from './dynamic-gateway';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    {
      // درگاه بر اساس تنظیماتِ زنده انتخاب می‌شود: Sandbox یا زرین‌پالِ واقعی.
      provide: PaymentService,
      useFactory: (prisma: PrismaService) => {
        const settings = new SettingsService(new PrismaSettingsRepository(prisma));
        return new PaymentService(
          new PrismaPaymentRepository(prisma),
          new DynamicPaymentGateway(settings),
          () => randomUUID(),
        );
      },
      inject: [PrismaService],
    },
  ],
})
export class PaymentsModule {}
