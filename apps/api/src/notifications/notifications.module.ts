import { Module } from '@nestjs/common';
import { PrismaNotificationRepository } from './prisma-notification.repository';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [PrismaNotificationRepository],
})
export class NotificationsModule {}
