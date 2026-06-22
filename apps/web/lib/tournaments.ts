// تایپ‌ها و کمک‌تابع‌های مشترکِ لیستِ تورنومنت.

export interface TournamentRow {
  id: string;
  title: string;
  game?: string;
  format: string;
  genre: string;
  status: string;
  participants: { id: string }[];
  maxParticipants?: number;
  platform?: string;
  coverImage?: string;
  organizerName?: string;
  startAt?: string;
  prizePool?: { rank: number; amount: number }[];
}

export const FORMAT_FA: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی',
  DOUBLE_ELIM: 'دوحذفی',
  ROUND_ROBIN: 'لیگ (دوره‌ای)',
  SWISS: 'سوئیسی',
  FFA: 'Battle Royale',
  GROUP_STAGE: 'گروهی + پلی‌آف',
};

export const STATUS_FA: Record<string, string> = {
  DRAFT: 'ثبت‌نام باز',
  RUNNING: 'در حال انجام',
  COMPLETED: 'پایان‌یافته',
  CANCELLED: 'لغوشده',
};

export type StatusFilter = 'all' | 'open' | 'live' | 'done';
export const STATUS_FILTERS: { k: StatusFilter; label: string; match: (s: string) => boolean }[] = [
  { k: 'all', label: 'همه', match: () => true },
  { k: 'open', label: 'در حال ثبت‌نام', match: (s) => s === 'DRAFT' },
  { k: 'live', label: 'در حال انجام', match: (s) => s === 'RUNNING' },
  { k: 'done', label: 'پایان‌یافته', match: (s) => s === 'COMPLETED' || s === 'CANCELLED' },
];

export type PlatformGroup = 'all' | 'pc' | 'console' | 'mobile';
export const PLATFORM_FILTERS: { k: PlatformGroup; label: string }[] = [
  { k: 'all', label: 'همه‌ی پلتفرم‌ها' },
  { k: 'pc', label: 'PC' },
  { k: 'console', label: 'کنسول' },
  { k: 'mobile', label: 'موبایل' },
];

/** پلتفرمِ خام را به گروهِ فیلتر نگاشت می‌کند. */
export function platformGroup(p?: string): PlatformGroup | 'cross' {
  if (!p || p === 'PC') return 'pc';
  if (p === 'MOBILE') return 'mobile';
  if (p === 'CROSS') return 'cross';
  return 'console'; // PS5/PS4/XBOX/SWITCH
}

export const PLATFORM_FA: Record<string, string> = {
  PC: 'PC',
  PS5: 'PS5',
  PS4: 'PS4',
  XBOX: 'Xbox',
  SWITCH: 'Switch',
  MOBILE: 'موبایل',
  CROSS: 'Cross-play',
};

export const fmt = (n: number) => n.toLocaleString('fa-IR');

/** بزرگ‌ترین جایزه (در صورت وجود). */
export function topPrize(t: TournamentRow): number | null {
  if (!t.prizePool?.length) return null;
  return Math.max(...t.prizePool.map((p) => p.amount));
}

/** فهرستِ فرمت‌های موجود در داده (برای فیلترِ «نوع»). */
export function availableFormats(list: TournamentRow[]): string[] {
  return [...new Set(list.map((t) => t.format))];
}
