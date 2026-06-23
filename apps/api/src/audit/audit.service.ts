import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditInput {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

/** ثبت و خواندنِ گزارشِ ممیزیِ اقدام‌های حساس. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(e: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: e.actorId,
        actorRole: e.actorRole,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        reason: e.reason ?? null,
        before: e.before === undefined ? null : JSON.stringify(e.before),
        after: e.after === undefined ? null : JSON.stringify(e.after),
      },
    });
  }

  list(filter: { entityType?: string; entityId?: string; actorId?: string } = {}) {
    const where: Record<string, string> = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.actorId) where.actorId = filter.actorId;
    return this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  }
}
