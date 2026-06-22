// دادهٔ منتخبِ متنوعِ تورنومنت برای صفحه‌ی فرود (typed؛ بدونِ تکرار/mismatch).
// از همان شکلِ TournamentRow استفاده می‌کند تا کارت‌های موجود بدونِ تغییر کار کنند.
import type { TournamentRow } from './tournaments';

const P = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }));

export const LANDING_TOURNAMENTS: TournamentRow[] = [
  { id: 'lt-valorant', title: 'Valorant Champions Arena', game: 'Valorant', format: 'SINGLE_ELIM', genre: 'TEAM', status: 'RUNNING', participants: P(28), maxParticipants: 32, platform: 'PC', startAt: '2026-06-22T16:00:00.000Z', prizePool: [{ rank: 1, amount: 50000000 }, { rank: 2, amount: 20000000 }] },
  { id: 'lt-cs2', title: 'CS2 Open Ladder', game: 'Counter-Strike 2', format: 'SWISS', genre: 'TEAM', status: 'RUNNING', participants: P(24), maxParticipants: 32, platform: 'PC', startAt: '2026-06-23T18:00:00.000Z', prizePool: [{ rank: 1, amount: 30000000 }, { rank: 2, amount: 12000000 }] },
  { id: 'lt-tekken', title: 'Tekken 8 Showdown', game: 'Tekken 8', format: 'DOUBLE_ELIM', genre: 'DUEL', status: 'RUNNING', participants: P(16), maxParticipants: 16, platform: 'PS5', startAt: '2026-06-22T20:00:00.000Z', prizePool: [{ rank: 1, amount: 12000000 }] },
  { id: 'lt-fortnite', title: 'Fortnite Solo Cup', game: 'Fortnite', format: 'FFA', genre: 'FFA', status: 'DRAFT', participants: P(74), maxParticipants: 100, platform: 'CROSS', startAt: '2026-06-26T16:00:00.000Z', prizePool: [{ rank: 1, amount: 25000000 }, { rank: 2, amount: 10000000 }, { rank: 3, amount: 5000000 }] },
  { id: 'lt-dota', title: 'Dota 2 Weekend Clash', game: 'Dota 2', format: 'DOUBLE_ELIM', genre: 'TEAM', status: 'DRAFT', participants: P(11), maxParticipants: 16, platform: 'PC', startAt: '2026-06-28T16:00:00.000Z', prizePool: [{ rank: 1, amount: 40000000 }, { rank: 2, amount: 15000000 }] },
  { id: 'lt-rl', title: 'Rocket League Arena', game: 'Rocket League', format: 'SINGLE_ELIM', genre: 'TEAM', status: 'DRAFT', participants: P(9), maxParticipants: 16, platform: 'CROSS', startAt: '2026-06-29T16:00:00.000Z', prizePool: [{ rank: 1, amount: 18000000 }] },
  { id: 'lt-fc', title: 'EA Sports FC 26 Cup', game: 'EA Sports FC 26', format: 'ROUND_ROBIN', genre: 'DUEL', status: 'COMPLETED', participants: P(6), maxParticipants: 6, platform: 'PS5', startAt: '2026-06-18T16:00:00.000Z', prizePool: [{ rank: 1, amount: 15000000 }] },
];

export const FEATURED_TOURNAMENT: TournamentRow =
  LANDING_TOURNAMENTS.find((t) => t.status === 'RUNNING') ?? LANDING_TOURNAMENTS[0];
