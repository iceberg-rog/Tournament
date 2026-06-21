import { Engine, Match, Participant, ReadyMatch, Standing } from './types';

/** موتور گروهی/لیگ کامل (Round-Robin): همه با همه یک‌بار. */
export class RoundRobinEngine implements Engine {
  readonly format = 'ROUND_ROBIN' as const;
  private matches: Match[] = [];
  private byId = new Map<string, Match>();
  private participants: Participant[];
  private wins = new Map<string, number>();
  private losses = new Map<string, number>();
  private h2h = new Map<string, string>();

  constructor(participants: Participant[]) {
    if (participants.length < 2) throw new Error('ROUND_ROBIN needs >= 2 participants');
    this.participants = participants;
    for (const p of participants) {
      this.wins.set(p.id, 0);
      this.losses.set(p.id, 0);
    }
    let idx = 0;
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const m: Match = {
          id: `RR-M${idx++}`,
          bracket: 'RR',
          round: 1,
          a: participants[i].id,
          b: participants[j].id,
          winner: null,
          loser: null,
          isBye: false,
          winnerTo: null,
          loserTo: null,
        };
        this.matches.push(m);
        this.byId.set(m.id, m);
      }
    }
  }

  ready(): ReadyMatch[] {
    return this.matches
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
    this.h2h.set(`${m.a}|${m.b}`, winnerId);
  }

  reportLobby(): void {
    throw new Error('ROUND_ROBIN does not use lobbies');
  }

  isComplete(): boolean {
    return this.matches.every((m) => !!m.winner);
  }

  private h2hWinner(x: string, y: string): string | null {
    return this.h2h.get(`${x}|${y}`) ?? this.h2h.get(`${y}|${x}`) ?? null;
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
      const h = this.h2hWinner(x.participantId, y.participantId);
      if (h === x.participantId) return -1;
      if (h === y.participantId) return 1;
      return 0;
    });
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }

  champion(): string | null {
    return this.isComplete() ? this.standings()[0].participantId : null;
  }
}
