import { Match, Slot } from './types';

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * ترتیب استاندارد seeding برای براکتی به اندازه‌ی توان ۲.
 * مثلاً size=8 → [1,8,4,5,2,7,3,6] (قوی‌ها در شاخه‌های دور از هم).
 */
export function seedOrder(size: number): number[] {
  let pls = [1, 2];
  while (pls.length < size) {
    const sum = pls.length * 2 + 1;
    const next: number[] = [];
    for (const p of pls) {
      next.push(p);
      next.push(sum - p);
    }
    pls = next;
  }
  return pls;
}

/** قراردادن برنده/بازنده در اسلات مقصد طبق لینک‌ها. */
export function propagate(m: Match, byId: Map<string, Match>): void {
  if (m.winner && m.winnerTo) {
    const t = byId.get(m.winnerTo.matchId);
    if (t) t[m.winnerTo.slot] = m.winner;
  }
  if (m.loser && m.loserTo) {
    const t = byId.get(m.loserTo.matchId);
    if (t) t[m.loserTo.slot] = m.loser;
  }
}

export function setSlot(m: Match, slot: Slot, id: string): void {
  m[slot] = id;
}
