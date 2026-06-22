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
import { WalletPort } from './wallet';

export interface CreateTournamentInput {
  title: string;
  game?: string;
  format: Format;
  genre: Genre;
  participants?: Participant[];
  ffaRounds?: number;
  swissRounds?: number;
  requireCheckIn?: boolean;
  maxParticipants?: number;
  prizePool?: { rank: number; amount: number }[];
  entryFee?: number;
  streamUrl?: string;
  requireResultConfirmation?: boolean;
  scoring?: { win: number; draw: number; loss: number };
  platform?: string;
  startAt?: string;
  durationHours?: number;
  coverImage?: string;
  organizerId?: string;
  organizerName?: string;
}

/** آمار تجمیعیِ یک کاربر برای داشبورد (UC22/پروفایل). */
export interface UserStats {
  joined: number;
  completed: number;
  wins: number;
  podiums: number;
  winRate: number; // درصد
  byGame: { game: string; played: number; wins: number }[];
  timeline: { id: string; title: string; game: string; rank: number; total: number; createdAt: string }[];
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
    private readonly wallet?: WalletPort,
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
      game: input.game,
      format: input.format,
      genre: input.genre,
      participants: input.participants ? input.participants.map((p) => ({ ...p })) : [],
      ffaRounds: input.ffaRounds,
      swissRounds: input.swissRounds,
      requireCheckIn: input.requireCheckIn ?? false,
      maxParticipants: input.maxParticipants,
      waitlist: [],
      prizePool: input.prizePool,
      entryFee: input.entryFee,
      streamUrl: input.streamUrl,
      requireResultConfirmation: input.requireResultConfirmation ?? false,
      scoring: input.scoring,
      platform: input.platform,
      startAt: input.startAt,
      durationHours: input.durationHours,
      coverImage: input.coverImage,
      organizerId: input.organizerId,
      organizerName: input.organizerName,
      heldFees: [],
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
      (rec.waitlist ??= []).push({ ...p }); // ظرفیت پر است → waitlist (هزینه‌ی ورودی هنگام promote مسدود می‌شود)
      waitlisted = true;
    } else {
      if (this.wallet && rec.entryFee) {
        await this.wallet.hold(p.id, rec.entryFee, `entry:${rec.id}`); // در صورت کمبود موجودی، throw و لغو ثبت‌نام
        (rec.heldFees ??= []).push(p.id);
      }
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
      await this.releaseFee(rec, participantId); // بازگشت هزینه‌ی ورودی
      const wl = rec.waitlist ?? [];
      const promoted = wl.shift();
      if (promoted) {
        rec.participants.push(promoted);
        if (this.wallet && rec.entryFee) {
          try {
            await this.wallet.hold(promoted.id, rec.entryFee, `entry:${rec.id}`);
            (rec.heldFees ??= []).push(promoted.id);
          } catch {
            // موجودیِ ناکافیِ نفرِ promote‌شده: همچنان اضافه می‌شود (ساده‌سازیِ MVP)
          }
        }
      }
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
    // بازگشت همه‌ی هزینه‌های ورودیِ مسدودشده (هیچ هزینه‌ای هنوز قطعی نشده)
    if (this.wallet && rec.entryFee && rec.heldFees) {
      for (const uid of [...rec.heldFees]) {
        await this.wallet.release(uid, rec.entryFee, `entry:${rec.id}`);
      }
      rec.heldFees = [];
    }
    await this.repo.update(rec);
    for (const p of rec.participants) {
      await this.notify(p.id, 'CANCELLED', rec.id, 'تورنومنت لغو شد');
    }
  }

  /** آزادسازی هزینه‌ی ورودیِ مسدودِ یک کاربر (اگر داشته باشد). */
  private async releaseFee(rec: TournamentRecord, userId: string): Promise<void> {
    if (!this.wallet || !rec.entryFee || !rec.heldFees) return;
    const i = rec.heldFees.indexOf(userId);
    if (i >= 0) {
      await this.wallet.release(userId, rec.entryFee, `entry:${rec.id}`);
      rec.heldFees.splice(i, 1);
    }
  }

  /** ویرایش تورنومنت (فقط در DRAFT) — UC09. */
  async update(
    id: string,
    patch: {
      title?: string;
      game?: string;
      maxParticipants?: number;
      entryFee?: number;
      prizePool?: { rank: number; amount: number }[];
      requireCheckIn?: boolean;
      streamUrl?: string;
      requireResultConfirmation?: boolean;
      scoring?: { win: number; draw: number; loss: number };
      platform?: string;
      startAt?: string;
      durationHours?: number;
      coverImage?: string;
    },
  ): Promise<TournamentRecord> {
    const rec = await this.mustGet(id);
    // آدرس استریم در هر وضعیتی قابل تنظیم است (UC16)؛ بقیه‌ی فیلدها فقط در DRAFT.
    if (patch.streamUrl !== undefined) {
      rec.streamUrl = patch.streamUrl;
      if (rec.status !== 'DRAFT' && Object.keys(patch).length === 1) {
        await this.repo.update(rec);
        return rec;
      }
    }
    if (rec.status !== 'DRAFT') throw new DomainError('فقط تورنومنتِ پیش‌نویس قابل ویرایش است');
    if (patch.entryFee !== undefined && (rec.heldFees?.length ?? 0) > 0) {
      throw new DomainError('پس از ثبت‌نام با هزینه‌ی ورودی نمی‌توان مبلغ را تغییر داد');
    }
    if (patch.title !== undefined) rec.title = patch.title;
    if (patch.game !== undefined) rec.game = patch.game;
    if (patch.maxParticipants !== undefined) rec.maxParticipants = patch.maxParticipants;
    if (patch.entryFee !== undefined) rec.entryFee = patch.entryFee;
    if (patch.prizePool !== undefined) rec.prizePool = patch.prizePool;
    if (patch.requireCheckIn !== undefined) rec.requireCheckIn = patch.requireCheckIn;
    if (patch.requireResultConfirmation !== undefined)
      rec.requireResultConfirmation = patch.requireResultConfirmation;
    if (patch.scoring !== undefined) rec.scoring = patch.scoring;
    if (patch.platform !== undefined) rec.platform = patch.platform;
    if (patch.startAt !== undefined) rec.startAt = patch.startAt;
    if (patch.durationHours !== undefined) rec.durationHours = patch.durationHours;
    if (patch.coverImage !== undefined) rec.coverImage = patch.coverImage;
    await this.repo.update(rec);
    return rec;
  }

  /** کپی‌کردن تنظیماتِ یک تورنومنت به‌صورت یک DRAFT جدید (بدون شرکت‌کننده/رویداد) — UC09. */
  async copy(id: string): Promise<TournamentRecord> {
    const src = await this.mustGet(id);
    return this.create({
      title: `${src.title} (کپی)`,
      game: src.game,
      format: src.format,
      genre: src.genre,
      ffaRounds: src.ffaRounds,
      swissRounds: src.swissRounds,
      requireCheckIn: src.requireCheckIn,
      maxParticipants: src.maxParticipants,
      prizePool: src.prizePool,
      entryFee: src.entryFee,
      requireResultConfirmation: src.requireResultConfirmation,
      scoring: src.scoring,
    });
  }

  private buildEngine(rec: TournamentRecord): Engine {
    const e = createTournament(rec.format, rec.participants, {
      ffaRounds: rec.ffaRounds,
      swissRounds: rec.swissRounds,
    });
    // RESOLVE‌ها برنده‌ی مؤثر هر مسابقه را override می‌کنند (داوری)
    const overrides = new Map<string, string>();
    const confirmed = new Set<string>(); // CONFIRM یا RESOLVE → نتیجه مؤثر است
    for (const ev of rec.events) {
      if (ev.kind === 'RESOLVE') {
        overrides.set(ev.matchId, ev.winnerId);
        confirmed.add(ev.matchId);
      }
      if (ev.kind === 'CONFIRM') confirmed.add(ev.matchId);
    }
    // مسابقه‌هایی که اصلاً گزارش‌نشده‌اند (برای داوریِ مستقیم؛ مثلاً no-show دوطرفه)
    const reportedMatches = new Set(
      rec.events.filter((ev) => ev.kind === 'DUEL').map((ev) => (ev as { matchId: string }).matchId),
    );
    for (const ev of rec.events) {
      if (ev.kind === 'CHECKIN' || ev.kind === 'CONFIRM') continue;
      if (ev.kind === 'RESOLVE') {
        // داوریِ مسابقه‌ی هرگز‌گزارش‌نشده: داور مستقیماً برنده را تعیین می‌کند
        if (!reportedMatches.has(ev.matchId)) {
          e.ready();
          e.reportDuel(ev.matchId, ev.winnerId);
        }
        continue;
      }
      e.ready(); // تضمین تولید ساختارهای lazy (مثلاً راندهای Swiss)
      if (ev.kind === 'DUEL') {
        // گیتِ تأیید داور (UC11): هر نتیجه‌ی تأییدنشده (REPORT یا NO_SHOW) براکت را جلو نمی‌برد.
        // RESOLVE خودش تأیید محسوب می‌شود (در confirmed قرار دارد).
        if (rec.requireResultConfirmation && !confirmed.has(ev.matchId)) {
          continue;
        }
        e.reportDuel(ev.matchId, overrides.get(ev.matchId) ?? ev.winnerId);
      } else {
        e.reportLobby(ev.matchId, ev.rankedIds);
      }
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
    // گیتِ تأیید داور (UC11): نتیجه ثبت می‌شود ولی تا تأیید، براکت جلو نمی‌رود
    if (rec.requireResultConfirmation) {
      if (this.hasPendingConfirmation(rec, matchId)) {
        throw new DomainError('نتیجه‌ی این مسابقه گزارش شده و در انتظار تأیید داور است');
      }
      rec.events.push({
        kind: 'DUEL',
        matchId,
        winnerId,
        source: 'REPORT',
        sides: [rm.participantIds[0], rm.participantIds[1]],
        score,
      });
      await this.repo.update(rec);
      return;
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

  /** تأیید نتیجه‌ی گزارش‌شده توسط داور (UC11) → نتیجه مؤثر و در صورت اتمام، نهایی می‌شود. */
  async confirmResult(id: string, matchId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new DomainError('tournament is not running');
    const reported = rec.events.some((ev) => ev.kind === 'DUEL' && ev.matchId === matchId);
    if (!reported) throw new DomainError('نتیجه‌ای برای تأیید در این مسابقه وجود ندارد');
    const already = rec.events.some(
      (ev) => (ev.kind === 'CONFIRM' || ev.kind === 'RESOLVE') && ev.matchId === matchId,
    );
    if (already) throw new DomainError('این نتیجه قبلاً تأیید/داوری شده است');
    rec.events.push({ kind: 'CONFIRM', matchId });
    const e = this.buildEngine(rec); // اکنون نتیجه اعمال می‌شود
    if (e.isComplete()) await this.complete(rec, e);
    await this.repo.update(rec);
  }

  /** فهرست نتایجِ گزارش‌شده‌ی در انتظار تأیید (برای داور) — UC11. */
  async pendingConfirmations(
    id: string,
  ): Promise<{ matchId: string; winnerId: string; sides?: [string, string] }[]> {
    const rec = await this.mustGet(id);
    if (!rec.requireResultConfirmation) return [];
    const done = new Set(
      rec.events
        .filter((ev) => ev.kind === 'CONFIRM' || ev.kind === 'RESOLVE')
        .map((ev) => (ev as { matchId: string }).matchId),
    );
    // آخرین DUELِ تأییدنشده per matchId (REPORT یا NO_SHOW)
    const byMatch = new Map<string, { matchId: string; winnerId: string; sides?: [string, string] }>();
    for (const ev of rec.events) {
      if (ev.kind === 'DUEL' && !done.has(ev.matchId)) {
        byMatch.set(ev.matchId, { matchId: ev.matchId, winnerId: ev.winnerId, sides: ev.sides });
      }
    }
    return [...byMatch.values()];
  }

  /** آیا برای این مسابقه نتیجه‌ای گزارش شده ولی هنوز تأیید/داوری نشده است؟ */
  private hasPendingConfirmation(rec: TournamentRecord, matchId: string): boolean {
    const reported = rec.events.some((ev) => ev.kind === 'DUEL' && ev.matchId === matchId);
    const done = rec.events.some(
      (ev) => (ev.kind === 'CONFIRM' || ev.kind === 'RESOLVE') && ev.matchId === matchId,
    );
    return reported && !done;
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
    // گیتِ تأیید داور (UC11): no-show هم تا تأیید، براکت را جلو نمی‌برد
    if (rec.requireResultConfirmation) {
      if (this.hasPendingConfirmation(rec, matchId)) {
        throw new DomainError('نتیجه‌ی این مسابقه گزارش شده و در انتظار تأیید داور است');
      }
      rec.events.push({
        kind: 'DUEL',
        matchId,
        winnerId: presentId,
        source: 'NO_SHOW',
        sides: [rm.participantIds[0], rm.participantIds[1]],
      });
      await this.repo.update(rec);
      return;
    }
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
    const rec = await this.mustGet(id);
    const st = this.buildEngine(rec).standings();
    // قالب امتیازدهیِ سفارشی (UC14) فقط برای فرمت‌های امتیازمحور (rank = ترتیبِ points).
    // در فرمت‌های حذفی/FFA رتبه از جایگاهِ براکت می‌آید و دست‌نخورده می‌ماند.
    if (rec.scoring && (rec.format === 'ROUND_ROBIN' || rec.format === 'SWISS')) {
      const { win, loss } = rec.scoring;
      const rescored = st.map((s) => ({ ...s, points: s.wins * win + s.losses * loss }));
      rescored.sort((a, b) => b.points - a.points || a.rank - b.rank);
      return rescored.map((s, i) => ({ ...s, rank: i + 1 }));
    }
    return st;
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

  /** آمار تجمیعیِ یک کاربر: تعداد شرکت، برد، رتبه‌ها، تفکیک بازی و تایم‌لاین. */
  async userStats(userId: string): Promise<UserStats> {
    const all = await this.repo.list();
    let joined = 0;
    let completed = 0;
    let wins = 0;
    let podiums = 0;
    const byGame = new Map<string, { game: string; played: number; wins: number }>();
    const timeline: UserStats['timeline'] = [];
    for (const rec of all) {
      if (!rec.participants.some((p) => p.id === userId)) continue;
      joined++;
      const game = rec.game ?? 'سایر';
      const g = byGame.get(game) ?? { game, played: 0, wins: 0 };
      g.played++;
      if (rec.status === 'COMPLETED') {
        completed++;
        const st = this.buildEngine(rec).standings();
        const mine = st.find((s) => s.participantId === userId);
        const rank = mine?.rank ?? 0;
        if (rank === 1) {
          wins++;
          g.wins++;
        }
        if (rank > 0 && rank <= 3) podiums++;
        timeline.push({ id: rec.id, title: rec.title, game, rank, total: st.length, createdAt: rec.createdAt });
      }
      byGame.set(game, g);
    }
    timeline.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return {
      joined,
      completed,
      wins,
      podiums,
      winRate: completed ? Math.round((wins / completed) * 100) : 0,
      byGame: [...byGame.values()].sort((a, b) => b.played - a.played),
      timeline: timeline.slice(0, 12),
    };
  }

  /** کاتالوگ بازی‌ها: گروه‌بندی تورنومنت‌ها بر اساس بازی، با شمارش هر وضعیت. */
  async gamesCatalog(): Promise<
    { game: string; total: number; upcoming: number; running: number; finished: number }[]
  > {
    const all = await this.repo.list();
    const map = new Map<
      string,
      { game: string; total: number; upcoming: number; running: number; finished: number }
    >();
    for (const t of all) {
      const g = t.game ?? 'سایر';
      const e = map.get(g) ?? { game: g, total: 0, upcoming: 0, running: 0, finished: 0 };
      e.total++;
      if (t.status === 'DRAFT') e.upcoming++;
      else if (t.status === 'RUNNING') e.running++;
      else e.finished++;
      map.set(g, e);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
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
    let sides: string[] | undefined;
    if (duel) {
      sides = duel.sides;
    } else {
      // نتیجه‌ای گزارش نشده (no-show دوطرفه/رهاشده): داور روی مسابقه‌ی معلقِ فعلی نتیجه را تعیین می‌کند
      const rm = this.buildEngine(rec)
        .ready()
        .find((m) => m.id === matchId);
      if (!rm) {
        throw new DomainError('no reported result exists and this match is not currently pending');
      }
      if (rm.kind !== 'DUEL') throw new DomainError('resolve applies only to duels');
      sides = [rm.participantIds[0], rm.participantIds[1]];
    }
    if (!sides || !sides.includes(winnerId)) {
      throw new DomainError('winner must be one of the two match participants');
    }
    if (duel) {
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

  /** قطعی‌کردن هزینه‌های ورودی (escrow) و پرداخت جوایز per-rank (یک‌بار، هنگام پایان). */
  private async payout(rec: TournamentRecord, engine: Engine): Promise<void> {
    if (!this.wallet || rec.paidOut) return;
    // قطعی‌کردن همه‌ی هزینه‌های ورودیِ مسدود (escrow → خروج)
    if (rec.entryFee && rec.heldFees) {
      for (const uid of [...rec.heldFees]) {
        await this.wallet.capture(uid, rec.entryFee, `entry:${rec.id}`);
      }
      rec.heldFees = [];
    }
    // واریز جوایز
    if (rec.prizePool) {
      const standings = engine.standings();
      for (const prize of rec.prizePool) {
        const s = standings.find((x) => x.rank === prize.rank);
        if (s && prize.amount > 0) {
          await this.wallet.prize(s.participantId, prize.amount, `prize:${rec.id}:rank${prize.rank}`);
        }
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
