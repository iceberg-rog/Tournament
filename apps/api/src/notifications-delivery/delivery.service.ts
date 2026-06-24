import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DELIVERY_DISPATCHER, DeliveryDispatcher, type DeliveryChannel } from './delivery.adapter';

export interface CreateNotification {
  tournamentId: string;
  userId?: string | null;
  channel?: DeliveryChannel;
  type?: string;
  title?: string;
  body?: string;
  sendAt?: string; // ISO؛ آینده = scheduled
}

const MAX_RETRIES = 3;

/** ساخت/ارسال/پیگیریِ اعلان با لاگِ تحویل، read/unread و failed/retry. */
@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DELIVERY_DISPATCHER) private readonly dispatcher: DeliveryDispatcher,
  ) {}

  private from(r: any) {
    return {
      id: r.id,
      tournamentId: r.tournamentId,
      userId: r.userId ?? null,
      channel: r.channel,
      type: r.type,
      title: r.title,
      body: r.body,
      status: r.status,
      sendAt: r.sendAt?.toISOString?.() ?? null,
      sentAt: r.sentAt?.toISOString?.() ?? null,
      readAt: r.readAt?.toISOString?.() ?? null,
      retries: r.retries,
      error: r.error ?? undefined,
    };
  }

  /** ساخت + (اگر زمانش رسیده) تلاشِ تحویلِ فوری. */
  async create(input: CreateNotification) {
    const channel = (input.channel ?? 'in_app') as DeliveryChannel;
    const sendAt = input.sendAt ? new Date(input.sendAt) : new Date();
    const row = await this.prisma.notificationDelivery.create({
      data: {
        tournamentId: input.tournamentId,
        userId: input.userId ?? null,
        channel,
        type: input.type ?? 'info',
        title: input.title ?? '',
        body: input.body ?? '',
        status: 'scheduled',
        sendAt,
      },
    });
    if (sendAt.getTime() <= Date.now()) return this.deliver(row.id);
    return this.from(row);
  }

  /** تلاشِ تحویلِ یک اعلان از طریقِ adapterِ کانال. وضعیت‌های نهایی دوباره ارسال نمی‌شوند. */
  async deliver(id: string) {
    const row = await this.prisma.notificationDelivery.findUnique({ where: { id } });
    if (!row) return null;
    // فقط scheduled یا failed قابلِ تحویل‌اند؛ sent/read نهایی‌اند (جلوگیری از ارسالِ تکراری).
    if (row.status !== 'scheduled' && row.status !== 'failed') return this.from(row);
    const res = await this.dispatcher.dispatch(row.channel as DeliveryChannel, { userId: row.userId, title: row.title, body: row.body, type: row.type });
    const updated = await this.prisma.notificationDelivery.update({
      where: { id },
      data: res.ok ? { status: 'sent', sentAt: new Date(), error: null } : { status: 'failed', retries: { increment: 1 }, error: res.error ?? 'delivery failed' },
    });
    return this.from(updated);
  }

  list(filter: { tournamentId?: string; userId?: string } = {}) {
    const where: Record<string, string> = {};
    if (filter.tournamentId) where.tournamentId = filter.tournamentId;
    if (filter.userId) where.userId = filter.userId;
    return this.prisma.notificationDelivery.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }).then((rows) => rows.map((r) => this.from(r)));
  }

  async markRead(id: string) {
    const row = await this.prisma.notificationDelivery.findUnique({ where: { id } });
    if (!row) return null; // 404-safe (به‌جای P2025/500)
    // readAt را همیشه ثبت می‌کنیم؛ status فقط از 'sent' به 'read' می‌رود تا اعلان‌های
    // scheduled/failed به‌اشتباه از چرخه‌ی تحویل خارج نشوند.
    const data = row.status === 'sent' ? { status: 'read', readAt: new Date() } : { readAt: new Date() };
    const updated = await this.prisma.notificationDelivery.update({ where: { id }, data });
    return this.from(updated);
  }

  async retry(id: string) {
    const row = await this.prisma.notificationDelivery.findUnique({ where: { id } });
    if (!row) return null;
    // فقط failedهای زیرِ سقف؛ sent/read/scheduled دوباره ارسال نمی‌شوند.
    if (row.status !== 'failed' || row.retries >= MAX_RETRIES) return this.from(row);
    return this.deliver(id);
  }

  /** برای scheduler: اعلان‌های زمان‌رسیده و retryهای ناموفق. */
  async processDue(now = Date.now()) {
    const due = await this.prisma.notificationDelivery.findMany({ where: { status: 'scheduled', sendAt: { lte: new Date(now) } }, take: 100 });
    for (const r of due) await this.deliver(r.id);
    const failed = await this.prisma.notificationDelivery.findMany({ where: { status: 'failed', retries: { lt: MAX_RETRIES } }, take: 50 });
    for (const r of failed) await this.deliver(r.id);
    return { delivered: due.length, retried: failed.length };
  }
}
