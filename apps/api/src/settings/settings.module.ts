import { Module } from '@nestjs/common';
import { SettingsService } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaSettingsRepository } from './prisma-settings.repository';
import { SettingsController } from './settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [
    {
      provide: SettingsService,
      useFactory: (prisma: PrismaService) => new SettingsService(new PrismaSettingsRepository(prisma)),
      inject: [PrismaService],
    },
  ],
})
export class SettingsModule {}
