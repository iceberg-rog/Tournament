import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaNotificationRepository } from './prisma-notification.repository';

/** اعلان‌های درون‌برنامه‌ای کاربر (UC15). */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly repo: PrismaNotificationRepository) {}

  @Get()
  mine(@Request() req: { user: { id: string } }) {
    return this.repo.forUser(req.user.id);
  }

  @Post(':id/read')
  read(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.repo.markRead(id, req.user.id);
  }
}
