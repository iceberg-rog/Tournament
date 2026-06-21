import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LadderService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaLadderRepository } from './prisma-ladder.repository';
import { LaddersController } from './ladders.controller';

@Module({
  controllers: [LaddersController],
  providers: [
    {
      provide: LadderService,
      useFactory: (prisma: PrismaService) =>
        new LadderService(new PrismaLadderRepository(prisma), () => randomUUID()),
      inject: [PrismaService],
    },
  ],
})
export class LaddersModule {}
