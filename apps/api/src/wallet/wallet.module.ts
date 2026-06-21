import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentService, SettingsService, WalletService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaSettingsRepository } from '../settings/prisma-settings.repository';
import { PrismaPaymentRepository } from '../payments/prisma-payment.repository';
import { DynamicPaymentGateway } from '../payments/dynamic-gateway';
import { PrismaWalletRepository } from './prisma-wallet.repository';
import { WalletController } from './wallet.controller';

/** سازنده‌ی WalletService روی همان جدول Ledger — برای استفاده‌ی مشترک ماژول‌ها. */
export function buildWalletService(prisma: PrismaService): WalletService {
  return new WalletService(new PrismaWalletRepository(prisma), () => randomUUID());
}

@Module({
  controllers: [WalletController],
  providers: [
    {
      provide: WalletService,
      useFactory: (prisma: PrismaService) => buildWalletService(prisma),
      inject: [PrismaService],
    },
    {
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
export class WalletModule {}
