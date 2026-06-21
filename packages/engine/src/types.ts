// انواع مشترک موتور تورنومنت — هم‌راستا با مدل پایه‌ی سند طراحی.

export type Genre = 'DUEL' | 'TEAM' | 'FFA';

export type Format =
  | 'SINGLE_ELIM'
  | 'DOUBLE_ELIM'
  | 'ROUND_ROBIN'
  | 'SWISS'
  | 'FFA';

export interface Participant {
  id: string;
  name: string;
  /** ۱ = قوی‌ترین (seed). */
  seed: number;
  /** مهارت پنهان ۰..۱ برای شبیه‌سازی نتیجه. */
  skill: number;
}

export type Slot = 'a' | 'b';

/** یک مسابقه‌ی دوطرفه (برای elimination / round-robin / swiss). */
export interface Match {
  id: string;
  bracket: 'W' | 'L' | 'GF' | 'RR' | 'SW';
  round: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  loser: string | null;
  isBye: boolean;
  winnerTo: { matchId: string; slot: Slot } | null;
  loserTo: { matchId: string; slot: Slot } | null;
}

/** مسابقه‌ی آماده‌ی اجرا که شبیه‌ساز/کاربر نتیجه‌اش را می‌دهد. */
export interface ReadyMatch {
  id: string;
  kind: 'DUEL' | 'LOBBY';
  participantIds: string[];
}

export interface Standing {
  participantId: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
}

/** رابط مشترک همه‌ی فرمت‌ها. */
export interface Engine {
  format: Format;
  ready(): ReadyMatch[];
  reportDuel(matchId: string, winnerId: string): void;
  reportLobby(matchId: string, rankedIds: string[]): void;
  isComplete(): boolean;
  standings(): Standing[];
  champion(): string | null;
}
