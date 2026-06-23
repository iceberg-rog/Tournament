// دادهٔ منتخبِ متنوعِ تورنومنت برای صفحه‌ی فرود (typed؛ بدونِ تکرار/mismatch).
// از همان شکلِ TournamentRow استفاده می‌کند تا کارت‌های موجود بدونِ تغییر کار کنند.
import type { TournamentRow } from './tournaments';

const P = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));

// تنها تورنومنتِ واقعیِ اجراشده — FC26 Champions Cup با ۱۲۸ بازیکن.
export const LANDING_TOURNAMENTS: TournamentRow[] = [
  { id: 'lt-fc26-128', title: 'FC26 Champions Cup - 128 Players', game: 'EA Sports FC 26', format: 'SINGLE_ELIM', genre: 'DUEL', status: 'RUNNING', participants: P(128), maxParticipants: 128, platform: 'PS5', startAt: '2026-06-22T16:00:00.000Z', prizePool: [{ rank: 1, amount: 5000000 }, { rank: 2, amount: 2000000 }, { rank: 3, amount: 1000000 }] },
];

export const FEATURED_TOURNAMENT: TournamentRow =
  LANDING_TOURNAMENTS.find((t) => t.status === 'RUNNING') ?? LANDING_TOURNAMENTS[0];
