import { Engine, Match, Participant, ReadyMatch, Standing } from './types';

/**
 * موتور FFA / Battle Royale: چند راند لابی، امتیازدهی بر اساس رتبه (placement).
 * مناسب PUBG/Warzone/Free Fire — برنده = بیشترین امتیاز تجمعی.
 */
export class FfaEngine implements Engine {
  readonly format = 'FFA' as const;
  private participants: Participant[];
  private rounds: number;
  private current = 0;
  private points = new Map<string, number>();
  private roundWins = new Map<string, number>();

  constructor(participants: Participant[], rounds = 3) {
    if (participants.length < 2) throw new Error('FFA needs >= 2 participants');
    if (rounds < 1) throw new Error('FFA needs >= 1 round');
    this.participants = participants;
    this.rounds = rounds;
    for (const p of participants) {
      this.points.set(p.id, 0);
      this.roundWins.set(p.id, 0);
    }
  }

  ready(): ReadyMatch[] {
    if (this.current >= this.rounds) return [];
    return [
      {
        id: `FFA-R${this.current}`,
        kind: 'LOBBY' as const,
        participantIds: this.participants.map((p) => p.id),
      },
    ];
  }

  reportDuel(): void {
    throw new Error('FFA uses lobbies, not duels');
  }

  bracket(): Match[] {
    return []; // FFA لابی‌محور است؛ ساختارِ درختی ندارد (نمایش با رده‌بندیِ راندها)
  }

  reportLobby(matchId: string, rankedIds: string[]): void {
    if (matchId !== `FFA-R${this.current}`) throw new Error('unexpected lobby id');
    const N = this.participants.length;
    if (rankedIds.length !== N) throw new Error('ranking must include all participants');
    if (new Set(rankedIds).size !== N) throw new Error('ranking has duplicates');
    rankedIds.forEach((id, idx) => {
      const placement = idx + 1;
      const pts = N - placement + 1;
      this.points.set(id, (this.points.get(id) ?? 0) + pts);
      if (placement === 1) this.roundWins.set(id, (this.roundWins.get(id) ?? 0) + 1);
    });
    this.current++;
  }

  isComplete(): boolean {
    return this.current >= this.rounds;
  }

  standings(): Standing[] {
    const list: Standing[] = this.participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      rank: 0,
      wins: this.roundWins.get(p.id) ?? 0,
      losses: 0,
      points: this.points.get(p.id) ?? 0,
    }));
    list.sort((x, y) => (y.points !== x.points ? y.points - x.points : y.wins - x.wins));
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }

  champion(): string | null {
    return this.isComplete() ? this.standings()[0].participantId : null;
  }
}
