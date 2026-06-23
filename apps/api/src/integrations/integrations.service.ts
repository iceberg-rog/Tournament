import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface Actor {
  id: string;
  role: string;
}

/** ذخیره/بازخوانیِ تنظیماتِ اتصال‌ها به تفکیکِ محیط + ثبتِ ممیزی. */
@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(environment: string) {
    const row = await this.prisma.integrationConfig.findUnique({ where: { environment } });
    return row ? row.data : null;
  }

  async save(environment: string, data: any, actor: Actor) {
    const row = await this.prisma.integrationConfig.upsert({
      where: { environment },
      create: { environment, data },
      update: { data },
    });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'ذخیره‌ی تنظیماتِ اتصال',
      entityType: 'integration',
      entityId: environment,
    });
    return row.data;
  }

  logAction(environment: string, actor: Actor, action: string, integrationId?: string, field?: string) {
    return this.audit.log({
      actorId: actor.id,
      actorRole: actor.role,
      action,
      entityType: 'integration',
      entityId: integrationId ?? environment,
      reason: field,
    });
  }

  listAudit() {
    return this.audit.list({ entityType: 'integration' });
  }
}
