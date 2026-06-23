// دادهٔ typedِ تجربه‌ی سینماییِ صفحه‌ی اصلی — کارت‌های تورنومنت، آرنای زنده و فعالیت.
// همه‌ی کارت‌ها از همین داده map می‌شوند (بدونِ JSXِ hardcoded).

export type LandingStatus = 'live' | 'registration_open' | 'starting_soon' | 'finished';

export interface LandingTournament {
  id: string;
  title: string;
  game: string;
  status: LandingStatus;
  prize?: string;
  participants: number;
  capacity: number;
  platform: string;
  format: string;
  startsAt?: string;
  cover?: string;
  branded?: boolean; // به‌جای عکس، هدرِ برندِ بازی رندر می‌شود (مثلِ FC26)
  href: string;
  accent: string; // رنگِ گلوِ اختصاصیِ کارت
}

export const STATUS_META: Record<LandingStatus, { label: string; tone: 'live' | 'open' | 'soon' | 'done'; cta: string }> = {
  live: { label: 'زنده', tone: 'live', cta: 'مشاهده‌ی زنده' },
  registration_open: { label: 'ثبت‌نام باز', tone: 'open', cta: 'ورود برای ثبت‌نام' },
  starting_soon: { label: 'نزدیکِ شروع', tone: 'soon', cta: 'مشاهده‌ی جزئیات' },
  finished: { label: 'پایان‌یافته', tone: 'done', cta: 'مشاهده‌ی نتایج' },
};

export const SHOWCASE_TOURNAMENTS: LandingTournament[] = [
  { id: 'lt-fc26', title: 'FC26 Champions Cup — 128 بازیکن', game: 'EA Sports FC 26', status: 'live', prize: '۸٬۰۰۰٬۰۰۰ تومان', participants: 128, capacity: 128, platform: 'PS5', format: 'تک‌حذفی', branded: true, href: '/tournaments/lt-fc26', accent: '#22c55e' },
  { id: 'lt-valorant', title: 'Valorant Champions Arena', game: 'Valorant', status: 'live', prize: '۵۰٬۰۰۰٬۰۰۰ تومان', participants: 28, capacity: 32, platform: 'PC', format: 'تک‌حذفی', cover: '/games/valorant-p.jpg', href: '/tournaments/lt-valorant', accent: '#fb5b6b' },
  { id: 'lt-cs2', title: 'CS2 Open Ladder', game: 'Counter-Strike 2', status: 'registration_open', prize: '۳۰٬۰۰۰٬۰۰۰ تومان', participants: 24, capacity: 32, platform: 'PC', format: 'سوئیسی', cover: '/games/cs2-p.jpg', href: '/tournaments/lt-cs2', accent: '#fbbf24' },
  { id: 'lt-dota', title: 'Dota 2 Weekend Clash', game: 'Dota 2', status: 'registration_open', prize: '۴۰٬۰۰۰٬۰۰۰ تومان', participants: 11, capacity: 16, platform: 'PC', format: 'دوحذفی', cover: '/games/dota-2-p.jpg', href: '/tournaments/lt-dota', accent: '#a78bfa' },
  { id: 'lt-rl', title: 'Rocket League Arena', game: 'Rocket League', status: 'starting_soon', prize: '۱۸٬۰۰۰٬۰۰۰ تومان', participants: 9, capacity: 16, platform: 'Cross-play', format: 'تک‌حذفی', cover: '/games/rocket-league-p.jpg', href: '/tournaments/lt-rl', accent: '#60a5fa' },
  { id: 'lt-fortnite', title: 'Fortnite Solo Cup', game: 'Fortnite', status: 'finished', prize: '۲۵٬۰۰۰٬۰۰۰ تومان', participants: 96, capacity: 100, platform: 'Cross-play', format: 'بتل‌رویال', cover: '/games/fortnite.jpg', href: '/tournaments/lt-fortnite', accent: '#34d399' },
];

export const FEATURED_TOURNAMENT: LandingTournament = SHOWCASE_TOURNAMENTS[0];

export function showcaseById(id: string): LandingTournament | undefined {
  return SHOWCASE_TOURNAMENTS.find((t) => t.id === id);
}

// ───────── آرنای زنده (Arena Preview) ─────────
export interface ArenaMatch {
  id: string;
  round: string;
  a: { name: string; initials: string; color: string };
  b: { name: string; initials: string; color: string };
  scoreA: number;
  scoreB: number;
  status: 'live' | 'pending' | 'done';
}

export const ARENA = {
  tournament: FEATURED_TOURNAMENT,
  round: 'مرحله‌ی ۳۲تایی · دورِ ۳ از ۷',
  participants: { current: 128, capacity: 128 },
  escrow: '۸٬۰۰۰٬۰۰۰ تومان',
  disputeMatch: '#۵۷',
  countdownMinutes: 14,
  match: {
    id: 'm42',
    round: 'نیمه‌نهاییِ گروه',
    a: { name: 'Phantom X', initials: 'PX', color: '#2dd4bf' },
    b: { name: 'Valor GG', initials: 'VG', color: '#fbbf24' },
    scoreA: 3,
    scoreB: 1,
    status: 'live' as const,
  } satisfies ArenaMatch,
  bracket: [
    { id: 'b1', a: 'Phantom X', b: 'Valor GG', sa: 3, sb: 1, win: 'a' },
    { id: 'b2', a: 'Nebula', b: 'Cobalt', sa: 1, sb: 2, win: 'b' },
    { id: 'b3', a: 'Storm', b: 'Echo', sa: 2, sb: 0, win: 'a' },
    { id: 'b4', a: 'Apex', b: 'Drift', sa: 0, sb: 0, win: null },
  ] as { id: string; a: string; b: string; sa: number; sb: number; win: 'a' | 'b' | null }[],
};

// ───────── فعالیتِ زنده ─────────
export type ActivityKind = 'result' | 'advance' | 'dispute' | 'escrow' | 'checkin';
export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  at: string;
}

export const LANDING_ACTIVITY: ActivityItem[] = [
  { id: 'a1', kind: 'result', text: 'نتیجه‌ی مسابقه‌ی #۴۲ ثبت شد', at: '۲ دقیقه پیش' },
  { id: 'a2', kind: 'advance', text: 'Phantom X به مرحله‌ی بعد صعود کرد', at: '۳ دقیقه پیش' },
  { id: 'a3', kind: 'dispute', text: 'اختلافِ مسابقه‌ی #۵۷ در حالِ بررسی است', at: '۶ دقیقه پیش' },
  { id: 'a4', kind: 'escrow', text: 'جایزه در escrow قفل شد', at: '۱۲ دقیقه پیش' },
  { id: 'a5', kind: 'checkin', text: '۱۲۸ بازیکن چک‌این کردند', at: '۲۰ دقیقه پیش' },
];

export const ACTIVITY_DOT: Record<ActivityKind, string> = {
  result: 'bg-accent',
  advance: 'bg-good',
  dispute: 'bg-bad',
  escrow: 'bg-gold',
  checkin: 'bg-slate-400',
};
