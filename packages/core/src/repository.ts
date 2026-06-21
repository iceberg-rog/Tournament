import { Format, Genre, Participant } from '@tournament/engine';

export type TournamentStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED';

/** رویدادِ لاگِ replay برای بازسازی قطعی وضعیت. */
export type ReportEvent =
  | { kind: 'DUEL'; matchId: string; winnerId: string; source?: 'REPORT' | 'NO_SHOW' }
  | { kind: 'LOBBY'; matchId: string; rankedIds: string[] }
  | { kind: 'CHECKIN'; matchId: string; participantId: string };

/** رکورد پایدارِ یک تورنومنت. */
export interface TournamentRecord {
  id: string;
  title: string;
  format: Format;
  genre: Genre;
  participants: Participant[];
  ffaRounds?: number;
  swissRounds?: number;
  /** حداکثر ظرفیت شرکت‌کننده‌های تأییدشده؛ مازاد به waitlist می‌رود. */
  maxParticipants?: number;
  /** صف انتظار (وقتی ظرفیت پر است). با انصراف یک تأییدشده، اولین نفر promote می‌شود. */
  waitlist?: Participant[];
  /** اگر true، پیش از ثبت نتیجه‌ی یک DUEL هر دو طرف باید check-in کنند (وگرنه no-show). */
  requireCheckIn?: boolean;
  /** جوایز per-rank؛ هنگام پایان تورنومنت به کیف پول برنده‌ها واریز می‌شود. */
  prizePool?: { rank: number; amount: number }[];
  /** آیا جوایز پرداخت شده‌اند (یک‌بار، هنگام COMPLETED). */
  paidOut?: boolean;
  status: TournamentStatus;
  events: ReportEvent[];
  createdAt: string;
}

/** انتزاع پایداری — پیاده‌سازی in-memory برای تست، Prisma برای پروداکشن. */
export interface TournamentRepository {
  create(rec: TournamentRecord): Promise<void>;
  get(id: string): Promise<TournamentRecord | null>;
  update(rec: TournamentRecord): Promise<void>;
  list(): Promise<TournamentRecord[]>;
}
