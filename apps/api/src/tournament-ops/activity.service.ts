import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityInput {
  tournamentId: string;
  kind: string;
  actor?: string;
  summary: string;
  entityType?: string;
  entityId?: string;
}

/** فیدِ رویدادهای عملیاتی — جدا از AuditLog (که برای اقدام‌های حساس است). */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  log(e: ActivityInput) {
    return this.prisma.activityEvent.create({
      data: {
        tournamentId: e.tournamentId,
        kind: e.kind,
        actor: e.actor ?? 'system',
        summary: e.summary,
        entityType: e.entityType ?? '',
        entityId: e.entityId ?? '',
      },
    });
  }

  list(tournamentId: string, take = 100) {
    return this.prisma.activityEvent.findMany({ where: { tournamentId }, orderBy: { createdAt: 'desc' }, take });
  }
}
