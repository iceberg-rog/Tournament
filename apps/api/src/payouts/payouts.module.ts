import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { KycService, WithdrawalService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { buildWalletService } from '../wallet/wallet.module';
import { PrismaKycRepository } from './prisma-kyc.repository';
import { PrismaWithdrawalRepository } from './prisma-withdrawal.repository';
import { KycController } from './kyc.controller';
import { WithdrawalsController } from './withdrawals.controller';

@Module({
  controllers: [KycController, WithdrawalsController],
  providers: [
    {
      provide: KycService,
      useFactory: (prisma: PrismaService) => new KycService(new PrismaKycRepository(prisma)),
      inject: [PrismaService],
    },
    {
      provide: WithdrawalService,
      useFactory: (prisma: PrismaService) =>
        new WithdrawalService(
          new PrismaWithdrawalRepository(prisma),
          buildWalletService(prisma),
          new KycService(new PrismaKycRepository(prisma)),
          () => randomUUID(),
        ),
      inject: [PrismaService],
    },
  ],
})
export class PayoutsModule {}
