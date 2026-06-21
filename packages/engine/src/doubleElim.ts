import { Engine, Match, Participant, ReadyMatch, Slot, Standing } from './types';
import { nextPow2, seedOrder } from './util';

/** سنتینل برای اسلاتی که هرگز پر نمی‌شود (نتیجه‌ی BYE). */
const DEAD = '__DEAD__';

/**
 * موتور حذفی دوگانه (Double Elimination):
 * براکت برنده‌ها (WB) + براکت بازنده‌ها (LB) + Grand Final با امکان bracket reset.
 * هر شرکت‌کننده برای حذف باید دو بار ببازد.
 */
export class DoubleElimEngine implements Engine {
  readonly format = 'DOUBLE_ELIM' as const;
  private matches: Match[] = [];
  private byId = new Map<string, Match>();
  private participants: Participant[];
  private seedById = new Map<string, number>();
  private wins = new Map<string, number>();
  private losses = new Map<string, number>();
  private elimOrder = new Map<string, number>();
  private elimCounter = 0;
  private gfId = 'GF';
  private gf2Id = 'GF2';
  private championId: string | null = null;

  constructor(participants: Participant[]) {
    if (participants.length < 2) throw new Error('DOUBLE_ELIM needs >= 2 participants');
    this.participants = participants;
    for (const p of participants) {
      this.seedById.set(p.id, p.seed);
      this.wins.set(p.id, 0);
      this.losses.set(p.id, 0);
    }
    this.build();
    this.resolveDead();
  }

  private mk(id: string, bracket: Match['bracket'], round: number): Match {
    const m: Match = {
      id,
      bracket,
      round,
      a: null,
      b: null,
      winner: null,
      loser: null,
      isBye: false,
      winnerTo: null,
      loserTo: null,
    };
    this.matches.push(m);
    this.byId.set(id, m);
    return m;
  }

  private build(): void {
    const N = this.participants.length;
    const size = nextPow2(N);
    const k = Math.log2(size);
    const bySeed = [...this.participants].sort((a, b) => a.seed - b.seed);
    const order = seedOrder(size);
    const idForSeed = (s: number): string | null => (s <= N ? bySeed[s - 1].id : null);

    // ---- WB ----
    const wb: Match[][] = [];
    for (let r = 1; r <= k; r++) {
      const count = size >> r;
      const arr: Match[] = [];
      for (let i = 0; i < count; i++) arr.push(this.mk(`W-R${r}-M${i}`, 'W', r));
      wb.push(arr);
    }
    for (let r = 0; r < k - 1; r++) {
      for (let i = 0; i < wb[r].length; i++) {
        wb[r][i].winnerTo = { matchId: wb[r + 1][i >> 1].id, slot: i % 2 === 0 ? 'a' : 'b' };
      }
    }
    const r1 = wb[0];
    for (let i = 0; i < r1.length; i++) {
      r1[i].a = idForSeed(order[i * 2]);
      r1[i].b = idForSeed(order[i * 2 + 1]);
    }
    // BYEهای دور اول WB → سنتینل DEAD (تا cascade حل شوند)
    for (const m of r1) {
      if (m.a === null) m.a = DEAD;
      if (m.b === null) m.b = DEAD;
    }

    const gf = this.mk(this.gfId, 'GF', k + 1);
    this.mk(this.gf2Id, 'GF', k + 2); // reset (در صورت نیاز فعال می‌شود)

    if (k === 1) {
      // فقط دو نفر: WB final همان GF.a را می‌سازد و بازنده به GF.b می‌رود
      wb[0][0].winnerTo = { matchId: gf.id, slot: 'a' };
      wb[0][0].loserTo = { matchId: gf.id, slot: 'b' };
      return;
    }

    // ---- LB ----
    // LB R1 (minor): بازنده‌های WB R1 جفت می‌شوند
    const lbR1Count = size >> 2;
    const lbR1: Match[] = [];
    for (let i = 0; i < lbR1Count; i++) lbR1.push(this.mk(`L-R1-M${i}`, 'L', 1));
    for (let i = 0; i < wb[0].length; i++) {
      wb[0][i].loserTo = { matchId: lbR1[i >> 1].id, slot: i % 2 === 0 ? 'a' : 'b' };
    }

    let frontier = lbR1;
    let lbRound = 2;
    for (let r = 2; r <= k; r++) {
      const wbLosers = wb[r - 1];
      const major: Match[] = [];
      for (let j = 0; j < wbLosers.length; j++) major.push(this.mk(`L-R${lbRound}-M${j}`, 'L', lbRound));
      lbRound++;
      for (let j = 0; j < major.length; j++) {
        frontier[j].winnerTo = { matchId: major[j].id, slot: 'a' };
        wbLosers[j].loserTo = { matchId: major[j].id, slot: 'b' };
      }
      frontier = major;
      if (r < k) {
        const minor: Match[] = [];
        const minorCount = major.length >> 1;
        for (let j = 0; j < minorCount; j++) minor.push(this.mk(`L-R${lbRound}-M${j}`, 'L', lbRound));
        lbRound++;
        for (let j = 0; j < minorCount; j++) {
          major[2 * j].winnerTo = { matchId: minor[j].id, slot: 'a' };
          major[2 * j + 1].winnerTo = { matchId: minor[j].id, slot: 'b' };
        }
        frontier = minor;
      }
    }
    const lbFinal = frontier[0];

    // ---- Grand Final ----
    wb[k - 1][0].winnerTo = { matchId: gf.id, slot: 'a' };
    lbFinal.winnerTo = { matchId: gf.id, slot: 'b' };
  }

  private isReal(v: string | null): boolean {
    return v !== null && v !== DEAD;
  }

  /** پخش برنده/بازنده به اسلات‌های مقصد (بازنده‌ی BYE = DEAD). */
  private push(m: Match): void {
    if (m.winnerTo) {
      const t = this.byId.get(m.winnerTo.matchId);
      if (t) t[m.winnerTo.slot] = m.winner;
    }
    if (m.loserTo) {
      const t = this.byId.get(m.loserTo.matchId);
      if (t) t[m.loserTo.slot] = m.isBye ? DEAD : m.loser;
    }
  }

  /** حل BYEها تا نقطه‌ی ثابت (با سنتینل DEAD). */
  private resolveDead(): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of this.matches) {
        if (m.id === this.gfId || m.id === this.gf2Id) continue;
        if (m.winner !== null) continue;
        const aDead = m.a === DEAD;
        const bDead = m.b === DEAD;
        const aReal = this.isReal(m.a);
        const bReal = this.isReal(m.b);
        if (aReal && bDead) {
          m.winner = m.a;
          m.isBye = true;
          this.push(m);
          changed = true;
        } else if (bReal && aDead) {
          m.winner = m.b;
          m.isBye = true;
          this.push(m);
          changed = true;
        } else if (aDead && bDead) {
          m.winner = DEAD;
          m.isBye = true;
          this.push(m);
          changed = true;
        }
      }
    }
    // GF: اگر یک طرف DEAD باشد، طرف دیگر قهرمان است
    this.settleGfByes();
  }

  private settleGfByes(): void {
    const gf = this.byId.get(this.gfId)!;
    if (gf.winner) return;
    const aReal = this.isReal(gf.a);
    const bReal = this.isReal(gf.b);
    if (aReal && gf.b === DEAD) {
      gf.winner = gf.a;
      this.championId = gf.a;
    } else if (bReal && gf.a === DEAD) {
      gf.winner = gf.b;
      this.championId = gf.b;
    }
  }

  ready(): ReadyMatch[] {
    const out: ReadyMatch[] = [];
    for (const m of this.matches) {
      if (m.winner !== null) continue;
      if (!this.isReal(m.a) || !this.isReal(m.b)) continue;
      out.push({ id: m.id, kind: 'DUEL', participantIds: [m.a!, m.b!] });
    }
    return out;
  }

  private recordLoss(loser: string): void {
    const l = (this.losses.get(loser) ?? 0) + 1;
    this.losses.set(loser, l);
    if (l >= 2 && !this.elimOrder.has(loser)) {
      this.elimOrder.set(loser, ++this.elimCounter);
    }
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

    if (m.id === this.gfId) {
      this.recordLoss(loser);
      if (winnerId === m.a) {
        // قهرمان WB در GF برد → قهرمان نهایی
        this.championId = winnerId;
      } else {
        // قهرمان LB برد → reset: GF2 با همان دو نفر
        const gf2 = this.byId.get(this.gf2Id)!;
        gf2.a = m.a;
        gf2.b = m.b;
      }
      return;
    }
    if (m.id === this.gf2Id) {
      this.recordLoss(loser);
      this.championId = winnerId;
      return;
    }

    this.recordLoss(loser);
    this.push(m);
    // cascade: ممکن است یک خانه‌ی LB حالا (یک طرف واقعی + یک طرف DEAD) قابل‌حل شده باشد
    this.resolveDead();
  }

  reportLobby(): void {
    throw new Error('DOUBLE_ELIM does not use lobbies');
  }

  isComplete(): boolean {
    return this.championId !== null;
  }

  champion(): string | null {
    return this.championId;
  }

  standings(): Standing[] {
    const champ = this.championId;
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
      const ex = this.elimOrder.get(x.participantId) ?? Number.MAX_SAFE_INTEGER;
      const ey = this.elimOrder.get(y.participantId) ?? Number.MAX_SAFE_INTEGER;
      if (ex !== ey) return ey - ex; // دیرتر حذف‌شده = بهتر
      return (this.seedById.get(x.participantId) ?? 0) - (this.seedById.get(y.participantId) ?? 0);
    });
    list.forEach((s, i) => (s.rank = i + 1));
    return list;
  }
}
