import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentService, SandboxGateway } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    {
      // درگاهِ Sandbox؛ برای پروداکشن یک ZarinpalGateway (با کلیدهای تنظیماتِ مدیریت) جایگزین می‌شود.
      provide: PaymentService,
      useFactory: (prisma: PrismaService) =>
        new PaymentService(
          new PrismaPaymentRepository(prisma),
          new SandboxGateway(() => randomUUID()),
          () => randomUUID(),
        ),
      inject: [PrismaService],
    },
  ],
})
export class PaymentsModule {}
