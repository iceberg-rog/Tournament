import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SeasonService, TournamentService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTournamentRepository } from '../tournaments/prisma-tournament.repository';
import { PrismaSeasonRepository } from './prisma-season.repository';
import { SeasonsController } from './seasons.controller';

@Module({
  controllers: [SeasonsController],
  providers: [
    {
      provide: SeasonService,
      useFactory: (prisma: PrismaService) =>
        new SeasonService(
          new PrismaSeasonRepository(prisma),
          new TournamentService(new PrismaTournamentRepository(prisma), () => randomUUID()),
          () => randomUUID(),
        ),
      inject: [PrismaService],
    },
  ],
})
export class SeasonsModule {}
