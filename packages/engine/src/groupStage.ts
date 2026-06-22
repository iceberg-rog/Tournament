import { Engine, Match, Participant, ReadyMatch, Standing } from './types';
import { SingleElimEngine } from './singleElim';

export interface GroupStageOptions {
  /** حداکثر اعضای هر گروه (پیش‌فرض ۴). */
  groupSize?: number;
  /** تعداد صعودکننده از هر گروه به پلی‌آف (پیش‌فرض ۲). */
  advancePerGroup?: number;
}

/**
 * مرحله‌ی گروهی + پلی‌آف (مثلِ toornament): شرکت‌کننده‌ها به چند گروه تقسیم می‌شوند،
 * هر گروه به‌صورتِ round-robin بازی می‌کند، و نفراتِ برترِ هر گروه به براکتِ حذفیِ نهایی صعود می‌کنند.
 */
export class GroupStageEngine implements Engine {
  readonly format = 'GROUP_STAGE' as const;
  private participants: Participant[];
  private groups: Participant[][] = [];
  private groupMatches: Match[] = [];
  private byId = new Map<string, Match>();
  private wins = new Map<string, number>();
  private losses = new Map<string, number>();
  private seedById = new Map<string, number>();
  private advancePerGroup: number;
  private playoff: SingleElimEngine | null = null;
  private playoffSeeded = false;

  constructor(participants: Participant[], opts: GroupStageOptions = {}) {
    if (participants.length < 2) throw new Error('GROUP_STAGE needs >= 2 participants');
    this.participants = participants;
    const groupSize = Math.max(2, opts.groupSize ?? 4);
    this.advancePerGroup = Math.max(1, opts.advancePerGroup ?? 2);

    const numGroups = Math.max(1, Math.ceil(participants.length / groupSize));
    for (let i = 0; i < numGroups; i++) this.groups.push([]);
    // توزیعِ متوازنِ seed بین گروه‌ها (snake): seed ۱ به گروه ۰، seed ۲ به گروه ۱، ...
    const bySeed = [...participants].sort((a, b) => a.seed - b.seed);
    bySeed.forEach((p, idx) => {
      this.seedById.set(p.id, p.seed);
      this.wins.set(p.id, 0);
      this.losses.set(p.id, 0);
      this.groups[idx % numGroups].push(p);
    });
    // مسابقاتِ round-robin داخلِ هر گروه
    this.groups.forEach((members, g) => {
      let mi = 0;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const m: Match = {
            id: `G${g}-M${mi++}`,
            bracket: 'RR',
            group: g,
            round: 1,
            a: members[i].id,
            b: members[j].id,
            winner: null,
            loser: null,
            isBye: false,
            winnerTo: null,
            loserTo: null,
          };
          this.groupMatches.push(m);
          this.byId.set(m.id, m);
        }
      }
    });
  }

  private points(id: string): number {
    return (this.wins.get(id) ?? 0) * 3;
  }

  private groupsComplete(): boolean {
    return this.groupMatches.every((m) => !!m.winner);
  }

  /** رتبه‌بندیِ یک گروه (امتیاز، سپس برد، سپس seed). */
  private rankGroup(members: Participant[]): Participant[] {
    return [...members].sort(
      (a, b) =>
        this.points(b.id) - this.points(a.id) ||
        (this.wins.get(b.id) ?? 0) - (this.wins.get(a.id) ?? 0) ||
        (this.seedById.get(a.id) ?? 0) - (this.seedById.get(b.id) ?? 0),
    );
  }

  private seedPlayoff(): void {
    if (this.playoffSeeded || !this.groupsComplete()) return;
    const qualifiers: Participant[] = [];
    this.groups.forEach((members) => {
      this.rankGroup(members)
        .slice(0, this.advancePerGroup)
        .forEach((p) => qualifiers.push(p));
    });
    this.playoffSeeded = true;
    this.playoff =
      qualifiers.length >= 2
        ? new SingleElimEngine(qualifiers.map((p, i) => ({ ...p, seed: i + 1 })))
        : null;
  }

  ready(): ReadyMatch[] {
    if (!this.groupsComplete()) {
      return this.groupMatches
        .filter((m) => m.a && m.b && !m.winner)
        .map((m) => ({ id: m.id, kind: 'DUEL' as const, participantIds: [m.a!, m.b!] }));
    }
    this.seedPlayoff();
    if (!this.playoff) return [];
    return this.playoff.ready().map((rm) => ({ ...rm, id: `P-${rm.id}` }));
  }

  reportDuel(matchId: string, winnerId: string): void {
    if (matchId.startsWith('P-')) {
      this.seedPlayoff();
      if (!this.playoff) throw new Error('playoff has not started');
      this.playoff.reportDuel(matchId.slice(2), winnerId);
      return;
    }
    const m = this.byId.get(matchId);
    if (!m) throw new Error(`match ${matchId} not found`);
    if (m.winner) throw new Error(`match ${matchId} already resolved`);
    if (winnerId !== m.a && winnerId !== m.b) throw new Error('winner not in match');
    const loser = winnerId === m.a ? m.b! : m.a!;
    m.winner = winnerId;
    m.loser = loser;
    this.wins.set(winnerId, (this.wins.get(winnerId) ?? 0) + 1);
    this.losses.set(loser, (this.losses.get(loser) ?? 0) + 1);
  }

  reportLobby(): void {
    throw new Error('GROUP_STAGE does not use lobbies');
  }

  bracket(): Match[] {
    const out = this.groupMatches.map((m) => ({ ...m }));
    this.seedPlayoff();
    if (this.playoff) {
      out.push(
        ...this.playoff.bracket().map((m) => ({
          ...m,
          id: `P-${m.id}`,
          winnerTo: m.winnerTo ? { ...m.winnerTo, matchId: `P-${m.winnerTo.matchId}` } : null,
        })),
      );
    }
    return out;
  }

  isComplete(): boolean {
    if (!this.groupsComplete()) return false;
    this.seedPlayoff();
    return this.playoff ? this.playoff.isComplete() : true;
  }

  champion(): string | null {
    if (!this.groupsComplete()) return null;
    this.seedPlayoff();
    return this.playoff ? this.playoff.champion() : null;
  }

  standings(): Standing[] {
    const list: Standing[] = this.participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      rank: 0,
      wins: this.wins.get(p.id) ?? 0,
      losses: this.losses.get(p.id) ?? 0,
      points: this.points(p.id),
    }));
    // رتبه‌بندیِ پایه از مرحله‌ی گروهی
    list.sort(
      (a, b) =>
        b.points - a.points ||
        b.wins - a.wins ||
        (this.seedById.get(a.participantId) ?? 0) - (this.seedById.get(b.participantId) ?? 0),
    );
    // اگر پلی‌آف قهرمان دارد، او را رتبه ۱ کن
    this.seedPlayoff();
    const champ = this.playoff?.champion();
    if (champ) {
      const idx = list.findIndex((s) => s.participantId === champ);
      if (idx > 0) list.unshift(list.splice(idx, 1)[0]);
    }
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }
}
