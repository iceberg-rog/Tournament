import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ModerationService, SupportService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaReportRepository } from './prisma-report.repository';
import { PrismaTicketRepository } from './prisma-ticket.repository';
import { ModerationController } from './moderation.controller';
import { SupportController } from './support.controller';

@Module({
  controllers: [ModerationController, SupportController],
  providers: [
    {
      provide: ModerationService,
      useFactory: (prisma: PrismaService) =>
        new ModerationService(new PrismaReportRepository(prisma), () => randomUUID()),
      inject: [PrismaService],
    },
    {
      provide: SupportService,
      useFactory: (prisma: PrismaService) =>
        new SupportService(new PrismaTicketRepository(prisma), () => randomUUID()),
      inject: [PrismaService],
    },
  ],
})
export class ModerationModule {}
