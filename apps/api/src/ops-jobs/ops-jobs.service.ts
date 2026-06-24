import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DeliveryService } from '../notifications-delivery/delivery.service';
import { ActivityService } from '../tournament-ops/activity.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * زمان‌بندِ پس‌زمینه‌ی عملیات. چرخه‌ی تحویلِ اعلان واقعی است؛ بررسیِ مهلت/no-show
 * و واجد شرایط بودنِ پرداخت، قلّابِ آماده‌ای است که روی دادهٔ persistedِ slice کار
 * می‌کند و در نبودِ داده بی‌خطر no-op است. با OPS_JOBS_ENABLED=false غیرفعال می‌شود.
 */
@Injectable()
export class OpsJobsService {
  private readonly log = new Logger('OpsJobs');
  private get enabled() {
    return process.env.OPS_JOBS_ENABLED !== 'false';
  }

  constructor(
    private readonly delivery: DeliveryService,
    private readonly activity: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  // هر دقیقه: تحویلِ اعلان‌های زمان‌رسیده + retryِ ناموفق‌ها.
  @Interval('ops-notifications', 60_000)
  async notificationCycle() {
    if (!this.enabled) return;
    try {
      const r = await this.delivery.processDue();
      if (r.delivered || r.retried) this.log.log(`delivered=${r.delivered} retried=${r.retried}`);
    } catch (e) {
      this.log.warn(`notificationCycle failed: ${(e as Error).message}`);
    }
  }

  // هر دقیقه: قلّابِ بررسیِ مهلت‌ها/no-show روی دادهٔ persisted.
  @Interval('ops-deadlines', 60_000)
  async deadlineSweep() {
    if (!this.enabled) return;
    try {
      await this.runDeadlineSweep();
    } catch (e) {
      this.log.warn(`deadlineSweep failed: ${(e as Error).message}`);
    }
  }

  /**
   * قابل‌صدا در تست. روی persistِ matchهای هر تورنومنت (slice 'matches' در صورتِ
   * وجود) مهلت‌های گذشته را پیدا می‌کند و برای آن‌ها فعالیت + اعلانِ هشدار می‌سازد.
   * بدونِ داده، بی‌خطر صفر برمی‌گرداند.
   */
  async runDeadlineSweep(now = Date.now()) {
    const states = await this.prisma.opsState.findMany({ where: { slice: 'matches' } });
    let flagged = 0;
    for (const s of states) {
      const matches = Array.isArray(s.data) ? (s.data as any[]) : [];
      for (const m of matches) {
        if (!m?.deadline || m?.resultSubmitted || m?.handledNoShow) continue;
        if (Date.parse(m.deadline) < now) {
          flagged++;
          await this.activity.log({ tournamentId: s.tournamentId, kind: 'reminder', summary: `مهلتِ مسابقه ${m.id ?? ''} گذشت — نیازِ بررسیِ مدیر`, entityType: 'match', entityId: String(m.id ?? '') });
          await this.delivery.create({ tournamentId: s.tournamentId, channel: 'in_app', type: 'deadline', title: 'مهلتِ ثبتِ نتیجه گذشت', body: `مسابقه ${m.id ?? ''} وارد بازبینیِ مدیر شد.` });
        }
      }
    }
    return { flagged };
  }
}
