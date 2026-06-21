export type NotificationType =
  | 'REGISTERED'
  | 'WAITLISTED'
  | 'STARTED'
  | 'WON'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Notification {
  userId: string;
  type: NotificationType;
  tournamentId: string;
  message: string;
}

/** انتزاع اعلان‌ها — in-memory برای تست، Prisma/صف (BullMQ) برای پروداکشن. */
export interface NotificationRepository {
  notify(n: Notification): Promise<void>;
  forUser(userId: string): Promise<Notification[]>;
  all(): Promise<Notification[]>;
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private items: Notification[] = [];

  async notify(n: Notification): Promise<void> {
    this.items.push(n);
  }

  async forUser(userId: string): Promise<Notification[]> {
    return this.items.filter((i) => i.userId === userId);
  }

  async all(): Promise<Notification[]> {
    return [...this.items];
  }
}
