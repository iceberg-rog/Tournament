import { Engine, Match, Participant, ReadyMatch, Standing } from './types';

/**
 * موتور سوئیسی (Swiss): هر راند، بازیکنانِ هم‌امتیاز جفت می‌شوند،
 * بدون تکرار رویارویی؛ تعداد راندِ ثابت. مناسب تعداد زیاد شرکت‌کننده.
 * تعداد راند پیش‌فرض = ceil(log2(N)). BYE برای تعداد فرد (یک‌بار به هر نفر).
 */
export class SwissEngine implements Engine {
  readonly format = 'SWISS' as const;
  private participants: Participant[];
  private R: number;
  private rounds: Match[][] = [];
  private byId = new Map<string, Match>();
  private wins = new Map<string, number>();
  private losses = new Map<string, number>();
  private seedById = new Map<string, number>();
  private played = new Set<string>();
  private byeGiven = new Set<string>();
  private cur = 0;

  constructor(participants: Participant[], rounds?: number) {
    if (participants.length < 2) throw new Error('SWISS needs >= 2 participants');
    this.participants = participants;
    this.R = rounds ?? Math.max(1, Math.ceil(Math.log2(participants.length)));
    for (const p of participants) {
      this.wins.set(p.id, 0);
      this.losses.set(p.id, 0);
      this.seedById.set(p.id, p.seed);
    }
  }

  private key(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  private roundComplete(r: number): boolean {
    const ms = this.rounds[r];
    return !!ms && ms.every((m) => m.winner !== null);
  }

  private generate(r: number): void {
    const sorted = [...this.participants].sort((x, y) => {
      const wx = this.wins.get(x.id)!;
      const wy = this.wins.get(y.id)!;
      if (wy !== wx) return wy - wx;
      return x.seed - y.seed;
    });
    const pool = sorted.map((p) => p.id);

    if (pool.length % 2 === 1) {
      let byeIdx = -1;
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!this.byeGiven.has(pool[i])) {
          byeIdx = i;
          break;
        }
      }
      if (byeIdx === -1) byeIdx = pool.length - 1;
      const byeId = pool.splice(byeIdx, 1)[0];
      this.byeGiven.add(byeId);
      this.wins.set(byeId, (this.wins.get(byeId) ?? 0) + 1); // BYE = برد
    }

    const ms: Match[] = [];
    let mi = 0;
    while (pool.length > 0) {
      const a = pool.shift()!;
      let oppIdx = pool.findIndex((o) => !this.played.has(this.key(a, o)));
      if (oppIdx === -1) oppIdx = 0; // fallback: اگر همه را بازی کرده، تکرار مجاز
      const b = pool.splice(oppIdx, 1)[0];
      this.played.add(this.key(a, b));
      const m: Match = {
        id: `SW-R${r}-M${mi++}`,
        bracket: 'SW',
        round: r,
        a,
        b,
        winner: null,
        loser: null,
        isBye: false,
        winnerTo: null,
        loserTo: null,
      };
      ms.push(m);
      this.byId.set(m.id, m);
    }
    this.rounds[r] = ms;
  }

  ready(): ReadyMatch[] {
    while (this.cur < this.R && (this.cur === 0 || this.roundComplete(this.cur))) {
      this.cur++;
      this.generate(this.cur);
    }
    const ms = this.rounds[this.cur] ?? [];
    return ms
      .filter((m) => !m.winner)
      .map((m) => ({ id: m.id, kind: 'DUEL' as const, participantIds: [m.a!, m.b!] }));
  }

  reportDuel(matchId: string, winnerId: string): void {
    const m = this.byId.get(matchId);
    if (!m) throw new Error('match not found');
    if (m.winner) throw new Error('already resolved');
    if (winnerId !== m.a && winnerId !== m.b) throw new Error('winner not in match');
    const loser = winnerId === m.a ? m.b! : m.a!;
    m.winner = winnerId;
    m.loser = loser;
    this.wins.set(winnerId, (this.wins.get(winnerId) ?? 0) + 1);
    this.losses.set(loser, (this.losses.get(loser) ?? 0) + 1);
  }

  reportLobby(): void {
    throw new Error('SWISS does not use lobbies');
  }

  bracket(): Match[] {
    return this.rounds.flat().map((m) => ({ ...m }));
  }

  isComplete(): boolean {
    return this.cur >= this.R && this.roundComplete(this.R);
  }

  standings(): Standing[] {
    const list: Standing[] = this.participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      rank: 0,
      wins: this.wins.get(p.id) ?? 0,
      losses: this.losses.get(p.id) ?? 0,
      points: (this.wins.get(p.id) ?? 0) * 3,
    }));
    list.sort((x, y) => {
      if (y.wins !== x.wins) return y.wins - x.wins;
      return (this.seedById.get(x.participantId) ?? 0) - (this.seedById.get(y.participantId) ?? 0);
    });
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }

  champion(): string | null {
    return this.isComplete() ? this.standings()[0].participantId : null;
  }
}
