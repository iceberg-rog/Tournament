import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TournamentService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { buildWalletService } from '../wallet/wallet.module';
import { PrismaTournamentRepository } from './prisma-tournament.repository';
import { TournamentsController } from './tournaments.controller';

@Module({
  controllers: [TournamentsController],
  providers: [
    {
      provide: TournamentService,
      useFactory: (prisma: PrismaService) =>
        new TournamentService(
          new PrismaTournamentRepository(prisma),
          () => randomUUID(),
          () => new Date().toISOString(),
          buildWalletService(prisma), // escrow هزینه‌ی ورودی روی همان دفترِ کیف پول
        ),
      inject: [PrismaService],
    },
  ],
})
export class TournamentsModule {}
