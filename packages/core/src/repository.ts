import { Format, Genre, Participant } from '@tournament/engine';

export type TournamentStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

/** رویدادِ لاگِ replay برای بازسازی قطعی وضعیت. */
export type ReportEvent =
  | {
      kind: 'DUEL';
      matchId: string;
      winnerId: string;
      source?: 'REPORT' | 'NO_SHOW';
      sides?: [string, string];
      score?: string;
    }
  | { kind: 'LOBBY'; matchId: string; rankedIds: string[] }
  | { kind: 'CHECKIN'; matchId: string; participantId: string }
  | { kind: 'RESOLVE'; matchId: string; winnerId: string };

/** رکورد پایدارِ یک تورنومنت. */
export interface TournamentRecord {
  id: string;
  title: string;
  /** بازی (مثلاً «FC26»، «Warzone»)؛ مبنای کاتالوگ بازی‌ها. */
  game?: string;
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
  /** هزینه‌ی ورودی (ریال)؛ هنگام ثبت‌نام از کیف پول کاربر در escrow مسدود می‌شود. */
  entryFee?: number;
  /** شناسه‌ی کاربرانی که هزینه‌ی ورودی‌شان اکنون در escrow مسدود است. */
  heldFees?: string[];
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
