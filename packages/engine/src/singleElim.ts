import { Engine, Match, Participant, ReadyMatch, Standing } from './types';
import { nextPow2, seedOrder, propagate } from './util';

/** موتور حذفی تک (Single Elimination) با seeding استاندارد و مدیریت BYE. */
export class SingleElimEngine implements Engine {
  readonly format = 'SINGLE_ELIM' as const;
  private matches: Match[] = [];
  private byId = new Map<string, Match>();
  private finalId = '';
  private eliminatedRound = new Map<string, number>();
  private wins = new Map<string, number>();
  private losses = new Map<string, number>();
  private seedById = new Map<string, number>();
  private participants: Participant[];

  constructor(participants: Participant[]) {
    if (participants.length < 2) throw new Error('SINGLE_ELIM needs >= 2 participants');
    this.participants = participants;
    for (const p of participants) {
      this.seedById.set(p.id, p.seed);
      this.wins.set(p.id, 0);
      this.losses.set(p.id, 0);
    }
    this.build();
  }

  private build(): void {
    const N = this.participants.length;
    const size = nextPow2(N);
    const rounds = Math.log2(size);
    const bySeed = [...this.participants].sort((a, b) => a.seed - b.seed);
    const order = seedOrder(size);
    const idForSeed = (s: number): string | null => (s <= N ? bySeed[s - 1].id : null);

    const roundMatches: Match[][] = [];
    for (let r = 1; r <= rounds; r++) {
      const count = size >> r;
      const arr: Match[] = [];
      for (let i = 0; i < count; i++) {
        const m: Match = {
          id: `W-R${r}-M${i}`,
          bracket: 'W',
          round: r,
          a: null,
          b: null,
          winner: null,
          loser: null,
          isBye: false,
          winnerTo: null,
          loserTo: null,
        };
        arr.push(m);
        this.matches.push(m);
        this.byId.set(m.id, m);
      }
      roundMatches.push(arr);
    }

    for (let r = 0; r < rounds - 1; r++) {
      const cur = roundMatches[r];
      const nxt = roundMatches[r + 1];
      for (let i = 0; i < cur.length; i++) {
        cur[i].winnerTo = { matchId: nxt[i >> 1].id, slot: i % 2 === 0 ? 'a' : 'b' };
      }
    }

    const r1 = roundMatches[0];
    for (let i = 0; i < r1.length; i++) {
      r1[i].a = idForSeed(order[i * 2]);
      r1[i].b = idForSeed(order[i * 2 + 1]);
    }
    this.finalId = roundMatches[rounds - 1][0].id;
    this.resolveByes();
  }

  private resolveByes(): void {
    for (const m of this.matches) {
      if (m.round !== 1 || m.winner) continue;
      if (m.a !== null && m.b !== null) continue;
      const w = m.a ?? m.b;
      if (w === null) continue;
      m.winner = w;
      m.isBye = true;
      propagate(m, this.byId);
    }
  }

  ready(): ReadyMatch[] {
    return this.matches
      .filter((m) => m.a && m.b && !m.winner)
      .map((m) => ({ id: m.id, kind: 'DUEL' as const, participantIds: [m.a!, m.b!] }));
  }

  reportDuel(matchId: string, winnerId: string): void {
    const m = this.byId.get(matchId);
    if (!m) throw new Error(`match ${matchId} not found`);
    if (m.winner) throw new Error(`match ${matchId} already resolved`);
    if (winnerId !== m.a && winnerId !== m.b) throw new Error('winner not in match');
    const loser = winnerId === m.a ? m.b! : m.a!;
    m.winner = winnerId;
    m.loser = loser;
    this.wins.set(winnerId, (this.wins.get(winnerId) ?? 0) + 1);
    this.losses.set(loser, (this.losses.get(loser) ?? 0) + 1);
    this.eliminatedRound.set(loser, m.round);
    propagate(m, this.byId);
  }

  reportLobby(): void {
    throw new Error('SINGLE_ELIM does not use lobbies');
  }

  bracket(): Match[] {
    return this.matches.map((m) => ({ ...m }));
  }

  isComplete(): boolean {
    return !!this.byId.get(this.finalId)?.winner;
  }

  champion(): string | null {
    return this.byId.get(this.finalId)?.winner ?? null;
  }

  standings(): Standing[] {
    const champ = this.champion();
    const list: Standing[] = this.participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      rank: 0,
      wins: this.wins.get(p.id) ?? 0,
      losses: this.losses.get(p.id) ?? 0,
      points: (this.wins.get(p.id) ?? 0) * 3,
    }));
    list.sort((x, y) => {
      if (x.participantId === champ) return -1;
      if (y.participantId === champ) return 1;
      const ex = this.eliminatedRound.get(x.participantId) ?? 0;
      const ey = this.eliminatedRound.get(y.participantId) ?? 0;
      if (ex !== ey) return ey - ex;
      return (this.seedById.get(x.participantId) ?? 0) - (this.seedById.get(y.participantId) ?? 0);
    });
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }
}
