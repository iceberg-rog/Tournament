export type NotificationType =
  | 'REGISTERED'
  | 'WAITLISTED'
  | 'STARTED'
  | 'WON'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REMOVED'
  | 'MESSAGE';

/** ورودیِ ساختِ اعلان (id/read/createdAt توسط مخزن پر می‌شوند). */
export interface NotificationInput {
  userId: string;
  type: NotificationType;
  tournamentId: string;
  message: string;
}

export interface Notification extends NotificationInput {
  id: string;
  read: boolean;
  createdAt: string;
}

/** انتزاع کانال ارسال (ایمیل/پیامک) — no-op در dev، واقعی با کلیدهای تنظیمات در پروداکشن. */
export interface NotificationSender {
  send(n: NotificationInput): Promise<void>;
}

export class ConsoleNotificationSender implements NotificationSender {
  async send(n: NotificationInput): Promise<void> {
    // در پروداکشن: ارسال ایمیل/پیامک با کلیدهای تنظیماتِ مدیریت.
    console.log(`[notify] ${n.userId} ${n.type}: ${n.message}`);
  }
}

/** انتزاع اعلان‌ها — in-memory برای تست، Prisma/صف (BullMQ) برای پروداکشن. */
export interface NotificationRepository {
  notify(n: NotificationInput): Promise<void>;
  forUser(userId: string): Promise<Notification[]>;
  all(): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<void>;
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private items: Notification[] = [];
  private seq = 0;

  async notify(n: NotificationInput): Promise<void> {
    this.items.push({ ...n, id: `n${++this.seq}`, read: false, createdAt: '1970-01-01T00:00:00Z' });
  }
  async forUser(userId: string): Promise<Notification[]> {
    return this.items.filter((i) => i.userId === userId).map((i) => ({ ...i }));
  }
  async all(): Promise<Notification[]> {
    return this.items.map((i) => ({ ...i }));
  }
  async markRead(id: string, userId: string): Promise<void> {
    const n = this.items.find((i) => i.id === id && i.userId === userId);
    if (n) n.read = true;
  }
}
