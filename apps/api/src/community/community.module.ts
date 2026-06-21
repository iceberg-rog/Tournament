import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommunityService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaSpaceRepository } from './prisma-space.repository';
import { CommunityController } from './community.controller';

@Module({
  controllers: [CommunityController],
  providers: [
    {
      provide: CommunityService,
      useFactory: (prisma: PrismaService) =>
        new CommunityService(new PrismaSpaceRepository(prisma), () => randomUUID()),
      inject: [PrismaService],
    },
  ],
})
export class CommunityModule {}
