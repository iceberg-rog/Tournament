import {
  createTournament,
  Engine,
  Format,
  Genre,
  Participant,
  ReadyMatch,
  Standing,
} from '@tournament/engine';
import { DomainError } from './errors';
import { NotificationRepository, NotificationType } from './notifications';
import { ReportEvent, TournamentRecord, TournamentRepository } from './repository';
import { WalletRepository } from './wallet';

export interface CreateTournamentInput {
  title: string;
  format: Format;
  genre: Genre;
  participants?: Participant[];
  ffaRounds?: number;
  swissRounds?: number;
  requireCheckIn?: boolean;
  maxParticipants?: number;
  prizePool?: { rank: number; amount: number }[];
}

/** نتیجه‌ی یک مسابقه برای نمایش تاریخچه. */
export type MatchResult =
  | {
      kind: 'DUEL';
      matchId: string;
      sides?: [string, string];
      winner: string;
      score?: string;
      source: string;
    }
  | { kind: 'LOBBY'; matchId: string; ranking: string[] };

/**
 * سرویس دامنه‌ی تورنومنت روی موتور.
 * مدل replay: وضعیت هر تورنومنت = شرکت‌کننده‌ها + لاگِ رویدادها؛
 * هر عملیات، موتور را از صفر بازسازی (replay) می‌کند → قطعی و قابل‌بازسازی،
 * مستقل از حافظه‌ی فرایند (سازگار با persistence).
 */
export class TournamentService {
  constructor(
    private readonly repo: TournamentRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly wallet?: WalletRepository,
    private readonly notifier?: NotificationRepository,
  ) {}

  private async notify(
    userId: string,
    type: NotificationType,
    tournamentId: string,
    message: string,
  ): Promise<void> {
    if (this.notifier) await this.notifier.notify({ userId, type, tournamentId, message });
  }

  async create(input: CreateTournamentInput): Promise<TournamentRecord> {
    const valid: Format[] = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA'];
    if (!valid.includes(input.format)) throw new DomainError(`invalid format: ${input.format}`);
    const rec: TournamentRecord = {
      id: this.idGen(),
      title: input.title,
      format: input.format,
      genre: input.genre,
      participants: input.participants ? input.participants.map((p) => ({ ...p })) : [],
      ffaRounds: input.ffaRounds,
      swissRounds: input.swissRounds,
      requireCheckIn: input.requireCheckIn ?? false,
      maxParticipants: input.maxParticipants,
      waitlist: [],
      prizePool: input.prizePool,
      paidOut: false,
      status: 'DRAFT',
      events: [],
      createdAt: this.now(),
    };
    await this.repo.create(rec);
    return rec;
  }

  /** ثبت‌نام یک کاربر (فقط در وضعیت DRAFT). */
  async register(id: string, p: Participant): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'DRAFT') throw new DomainError('registration is closed');
    if (
      rec.participants.some((x) => x.id === p.id) ||
      (rec.waitlist ?? []).some((x) => x.id === p.id)
    ) {
      throw new DomainError('already registered');
    }
    let waitlisted = false;
    if (rec.maxParticipants && rec.participants.length >= rec.maxParticipants) {
      (rec.waitlist ??= []).push({ ...p }); // ظرفیت پر است → waitlist
      waitlisted = true;
    } else {
      rec.participants.push({ ...p });
    }
    await this.repo.update(rec);
    await this.notify(
      p.id,
      waitlisted ? 'WAITLISTED' : 'REGISTERED',
      rec.id,
      waitlisted ? 'در لیست انتظار قرار گرفتید' : 'ثبت‌نام شما ثبت شد',
    );
  }

  /** انصراف یک شرکت‌کننده (فقط در DRAFT)؛ با انصرافِ یک تأییدشده اولین waitlist promote می‌شود. */
  async withdraw(id: string, participantId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'DRAFT') throw new DomainError('cannot withdraw after the tournament has started');
    const ci = rec.participants.findIndex((x) => x.id === participantId);
    if (ci >= 0) {
      rec.participants.splice(ci, 1);
      const wl = rec.waitlist ?? [];
      const promoted = wl.shift();
      if (promoted) rec.participants.push(promoted);
      rec.waitlist = wl;
      await this.repo.update(rec);
      return;
    }
    const wi = (rec.waitlist ?? []).findIndex((x) => x.id === participantId);
    if (wi >= 0) {
      rec.waitlist!.splice(wi, 1);
      await this.repo.update(rec);
      return;
    }
    throw new DomainError('participant is not registered');
  }

  /** شروع تورنومنت: seeding بر اساس ترتیب ثبت‌نام، DRAFT → RUNNING. */
  async start(id: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'DRAFT') throw new DomainError('tournament already started');
    if (rec.participants.length < 2) throw new DomainError('need at least 2 participants');
    rec.participants.forEach((p, i) => (p.seed = i + 1));
    rec.status = 'RUNNING';
    await this.repo.update(rec);
    for (const p of rec.participants) {
      await this.notify(p.id, 'STARTED', rec.id, 'تورنومنت شروع شد');
    }
  }

  /** لغو تورنومنت (در DRAFT یا RUNNING) → CANCELLED، با اعلان به شرکت‌کننده‌ها. */
  async cancel(id: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status === 'COMPLETED') throw new DomainError('a completed tournament cannot be cancelled');
    if (rec.status === 'CANCELLED') throw new DomainError('tournament is already cancelled');
    rec.status = 'CANCELLED';
    await this.repo.update(rec);
    for (const p of rec.participants) {
      await this.notify(p.id, 'CANCELLED', rec.id, 'تورنومنت لغو شد');
    }
  }

  private buildEngine(rec: TournamentRecord): Engine {
    const e = createTournament(rec.format, rec.participants, {
      ffaRounds: rec.ffaRounds,
      swissRounds: rec.swissRounds,
    });
    // RESOLVE‌ها برنده‌ی مؤثر هر مسابقه را override می‌کنند (داوری)
    const overrides = new Map<string, string>();
    for (const ev of rec.events) {
      if (ev.kind === 'RESOLVE') overrides.set(ev.matchId, ev.winnerId);
    }
    for (const ev of rec.events) {
      if (ev.kind === 'CHECKIN' || ev.kind === 'RESOLVE') continue;
      e.ready(); // تضمین تولید ساختارهای lazy (مثلاً راندهای Swiss)
      if (ev.kind === 'DUEL') e.reportDuel(ev.matchId, overrides.get(ev.matchId) ?? ev.winnerId);
      else e.reportLobby(ev.matchId, ev.rankedIds);
    }
    return e;
  }

  async ready(id: string): Promise<ReadyMatch[]> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') return [];
    return this.buildEngine(rec).ready();
  }

  async reportDuel(id: string, matchId: string, winnerId: string, score?: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new DomainError('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new DomainError('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new DomainError('this match is a lobby, not a duel');
    if (!rm.participantIds.includes(winnerId)) throw new DomainError('winner is not in this match');
    if (rec.requireCheckIn) {
      const checked = this.checkInsFor(rec, matchId);
      if (!rm.participantIds.every((p) => checked.includes(p))) {
        throw new DomainError('both participants must check in before reporting a result');
      }
    }
    e.reportDuel(matchId, winnerId);
    rec.events.push({
      kind: 'DUEL',
      matchId,
      winnerId,
      source: 'REPORT',
      sides: [rm.participantIds[0], rm.participantIds[1]],
      score,
    });
    if (e.isComplete()) await this.complete(rec, e);
    await this.repo.update(rec);
  }

  /** اعلام حضور یک طرف برای یک مسابقه‌ی آماده. */
  async checkIn(id: string, matchId: string, participantId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new DomainError('tournament is not running');
    const rm = this.buildEngine(rec).ready().find((m) => m.id === matchId);
    if (!rm) throw new DomainError('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new DomainError('check-in applies only to duels');
    if (!rm.participantIds.includes(participantId)) throw new DomainError('participant is not in this match');
    if (this.checkInsFor(rec, matchId).includes(participantId)) throw new DomainError('already checked in');
    rec.events.push({ kind: 'CHECKIN', matchId, participantId });
    await this.repo.update(rec);
  }

  /** اعلام no-show: طرفِ حاضر (check-in‌کرده) برنده می‌شود چون حریف نیامده است. */
  async declareNoShow(id: string, matchId: string, presentId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new DomainError('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new DomainError('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new DomainError('no-show applies only to duels');
    if (!rm.participantIds.includes(presentId)) throw new DomainError('participant is not in this match');
    const checked = this.checkInsFor(rec, matchId);
    if (!checked.includes(presentId)) throw new DomainError('the declarer must be checked in');
    const opponent = rm.participantIds.find((p) => p !== presentId)!;
    if (checked.includes(opponent)) throw new DomainError('opponent has checked in — not a no-show');
    e.reportDuel(matchId, presentId);
    rec.events.push({
      kind: 'DUEL',
      matchId,
      winnerId: presentId,
      source: 'NO_SHOW',
      sides: [rm.participantIds[0], rm.participantIds[1]],
    });
    if (e.isComplete()) await this.complete(rec, e);
    await this.repo.update(rec);
  }

  /** فهرست شناسه‌ی طرف‌هایی که برای یک مسابقه check-in کرده‌اند. */
  async checkIns(id: string, matchId: string): Promise<string[]> {
    return this.checkInsFor(await this.mustGet(id), matchId);
  }

  private checkInsFor(rec: TournamentRecord, matchId: string): string[] {
    return rec.events
      .filter((ev) => ev.kind === 'CHECKIN' && ev.matchId === matchId)
      .map((ev) => (ev as { participantId: string }).participantId);
  }

  async reportLobby(id: string, matchId: string, rankedIds: string[]): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new DomainError('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new DomainError('lobby not ready or does not exist');
    if (rm.kind !== 'LOBBY') throw new DomainError('this match is a duel, not a lobby');
    e.reportLobby(matchId, rankedIds);
    rec.events.push({ kind: 'LOBBY', matchId, rankedIds: [...rankedIds] });
    if (e.isComplete()) await this.complete(rec, e);
    await this.repo.update(rec);
  }

  async standings(id: string): Promise<Standing[]> {
    return this.buildEngine(await this.mustGet(id)).standings();
  }

  async champion(id: string): Promise<string | null> {
    return this.buildEngine(await this.mustGet(id)).champion();
  }

  /** تاریخچه‌ی نتایج: برنده‌ی مؤثر (با اعمال داوری)، اسکور و منشأ هر مسابقه. */
  async results(id: string): Promise<MatchResult[]> {
    const rec = await this.mustGet(id);
    const overrides = new Map<string, string>();
    for (const ev of rec.events) {
      if (ev.kind === 'RESOLVE') overrides.set(ev.matchId, ev.winnerId);
    }
    const out: MatchResult[] = [];
    for (const ev of rec.events) {
      if (ev.kind === 'DUEL') {
        const overridden = overrides.has(ev.matchId);
        out.push({
          kind: 'DUEL',
          matchId: ev.matchId,
          sides: ev.sides,
          winner: overridden ? overrides.get(ev.matchId)! : ev.winnerId,
          score: ev.score,
          source: overridden ? 'DISPUTE_RESOLUTION' : ev.source ?? 'REPORT',
        });
      } else if (ev.kind === 'LOBBY') {
        out.push({ kind: 'LOBBY', matchId: ev.matchId, ranking: ev.rankedIds });
      }
    }
    return out;
  }

  async get(id: string): Promise<TournamentRecord> {
    return this.mustGet(id);
  }

  async list(): Promise<TournamentRecord[]> {
    return this.repo.list();
  }

  /**
   * داوری اعتراض: برنده‌ی یک مسابقه را تأیید یا overturn می‌کند.
   * فقط حین RUNNING. در فرمت‌های حذفی، اگر برنده‌ی فعلی قبلاً به دور بعد رفته و بازی کرده،
   * overturn رد می‌شود (محافظت در برابر cascade). یک تریجِ replay هم سازگاری ساختاری را تضمین می‌کند.
   */
  async resolveDispute(id: string, matchId: string, winnerId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') {
      throw new DomainError('disputes can only be resolved while the tournament is running');
    }
    const duel = [...rec.events]
      .reverse()
      .find(
        (ev): ev is Extract<ReportEvent, { kind: 'DUEL' }> =>
          ev.kind === 'DUEL' && ev.matchId === matchId,
      );
    if (!duel) throw new DomainError('no reported result exists for this match');
    if (!duel.sides || !duel.sides.includes(winnerId)) {
      throw new DomainError('winner must be one of the two match participants');
    }
    const currentWinner = this.effectiveWinner(rec, matchId);
    const isElim = rec.format === 'SINGLE_ELIM' || rec.format === 'DOUBLE_ELIM';
    if (isElim && winnerId !== currentWinner) {
      const idx = rec.events.indexOf(duel);
      const advancedAndPlayed = rec.events
        .slice(idx + 1)
        .some((ev) => ev.kind === 'DUEL' && ev.sides?.includes(currentWinner ?? ''));
      if (advancedAndPlayed) {
        throw new DomainError('cannot overturn: the winner has already advanced to a later match');
      }
    }
    const candidate: TournamentRecord = {
      ...rec,
      events: [...rec.events, { kind: 'RESOLVE', matchId, winnerId }],
    };
    let engine: Engine;
    try {
      engine = this.buildEngine(candidate);
    } catch {
      throw new DomainError('cannot overturn: it would invalidate later results');
    }
    rec.events.push({ kind: 'RESOLVE', matchId, winnerId });
    if (engine.isComplete()) await this.complete(rec, engine);
    await this.repo.update(rec);
  }

  private effectiveWinner(rec: TournamentRecord, matchId: string): string | undefined {
    let w: string | undefined;
    for (const ev of rec.events) {
      if (ev.kind === 'DUEL' && ev.matchId === matchId) w = ev.winnerId;
      if (ev.kind === 'RESOLVE' && ev.matchId === matchId) w = ev.winnerId;
    }
    return w;
  }

  /** نهایی‌سازی تورنومنت: COMPLETED + پرداخت جایزه + اعلان به برنده/همه. */
  private async complete(rec: TournamentRecord, engine: Engine): Promise<void> {
    rec.status = 'COMPLETED';
    await this.payout(rec, engine);
    const champ = engine.champion();
    for (const p of rec.participants) {
      await this.notify(
        p.id,
        p.id === champ ? 'WON' : 'COMPLETED',
        rec.id,
        p.id === champ ? 'شما قهرمان شدید! 🏆' : 'تورنومنت پایان یافت',
      );
    }
  }

  /** پرداخت جوایز per-rank به کیف پول برنده‌ها (یک‌بار، هنگام پایان). */
  private async payout(rec: TournamentRecord, engine: Engine): Promise<void> {
    if (!this.wallet || !rec.prizePool || rec.paidOut) return;
    const standings = engine.standings();
    for (const prize of rec.prizePool) {
      const s = standings.find((x) => x.rank === prize.rank);
      if (s && prize.amount > 0) {
        await this.wallet.credit(s.participantId, prize.amount, `prize:${rec.id}:rank${prize.rank}`);
      }
    }
    rec.paidOut = true;
  }

  private async mustGet(id: string): Promise<TournamentRecord> {
    const rec = await this.repo.get(id);
    if (!rec) throw new DomainError(`tournament ${id} not found`);
    return rec;
  }
}
