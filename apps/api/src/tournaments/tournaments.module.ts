import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RatingService, TournamentService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { buildWalletService } from '../wallet/wallet.module';
import { PrismaNotificationRepository } from '../notifications/prisma-notification.repository';
import { PrismaTournamentRepository } from './prisma-tournament.repository';
import { PrismaRatingRepository } from './prisma-rating.repository';
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
          new PrismaNotificationRepository(prisma), // اعلان‌ها پایدار می‌شوند (UC15)
        ),
      inject: [PrismaService],
    },
    {
      provide: RatingService,
      useFactory: (prisma: PrismaService) =>
        new RatingService(new PrismaRatingRepository(prisma), () => randomUUID()),
      inject: [PrismaService],
    },
  ],
})
export class TournamentsModule {}
