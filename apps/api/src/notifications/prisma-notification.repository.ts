import { Injectable } from '@nestjs/common';
import type { Notification, NotificationInput, NotificationRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async notify(n: NotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: { userId: n.userId, type: n.type, tournamentId: n.tournamentId, message: n.message },
    });
  }
  async forUser(userId: string): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.from(r));
  }
  async all(): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  }
  private from(r: any): Notification {
    return {
      id: r.id,
      userId: r.userId,
      type: r.type,
      tournamentId: r.tournamentId,
      message: r.message,
      read: r.read,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
