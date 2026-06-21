import {
  createTournament,
  Engine,
  Format,
  Genre,
  Participant,
  ReadyMatch,
  Standing,
} from '@tournament/engine';
import { TournamentRecord, TournamentRepository } from './repository';

export interface CreateTournamentInput {
  title: string;
  format: Format;
  genre: Genre;
  participants?: Participant[];
  ffaRounds?: number;
  swissRounds?: number;
  requireCheckIn?: boolean;
}

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
  ) {}

  async create(input: CreateTournamentInput): Promise<TournamentRecord> {
    const valid: Format[] = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA'];
    if (!valid.includes(input.format)) throw new Error(`invalid format: ${input.format}`);
    const rec: TournamentRecord = {
      id: this.idGen(),
      title: input.title,
      format: input.format,
      genre: input.genre,
      participants: input.participants ? input.participants.map((p) => ({ ...p })) : [],
      ffaRounds: input.ffaRounds,
      swissRounds: input.swissRounds,
      requireCheckIn: input.requireCheckIn ?? false,
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
    if (rec.status !== 'DRAFT') throw new Error('registration is closed');
    if (rec.participants.some((x) => x.id === p.id)) throw new Error('already registered');
    rec.participants.push({ ...p });
    await this.repo.update(rec);
  }

  /** شروع تورنومنت: seeding بر اساس ترتیب ثبت‌نام، DRAFT → RUNNING. */
  async start(id: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'DRAFT') throw new Error('tournament already started');
    if (rec.participants.length < 2) throw new Error('need at least 2 participants');
    rec.participants.forEach((p, i) => (p.seed = i + 1));
    rec.status = 'RUNNING';
    await this.repo.update(rec);
  }

  private buildEngine(rec: TournamentRecord): Engine {
    const e = createTournament(rec.format, rec.participants, {
      ffaRounds: rec.ffaRounds,
      swissRounds: rec.swissRounds,
    });
    for (const ev of rec.events) {
      if (ev.kind === 'CHECKIN') continue; // check-in بر موتور اثر ندارد (لایه‌ی بالاتر)
      e.ready(); // تضمین تولید ساختارهای lazy (مثلاً راندهای Swiss)
      if (ev.kind === 'DUEL') e.reportDuel(ev.matchId, ev.winnerId);
      else e.reportLobby(ev.matchId, ev.rankedIds);
    }
    return e;
  }

  async ready(id: string): Promise<ReadyMatch[]> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') return [];
    return this.buildEngine(rec).ready();
  }

  async reportDuel(id: string, matchId: string, winnerId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new Error('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new Error('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new Error('this match is a lobby, not a duel');
    if (!rm.participantIds.includes(winnerId)) throw new Error('winner is not in this match');
    if (rec.requireCheckIn) {
      const checked = this.checkInsFor(rec, matchId);
      if (!rm.participantIds.every((p) => checked.includes(p))) {
        throw new Error('both participants must check in before reporting a result');
      }
    }
    e.reportDuel(matchId, winnerId);
    rec.events.push({ kind: 'DUEL', matchId, winnerId, source: 'REPORT' });
    if (e.isComplete()) rec.status = 'COMPLETED';
    await this.repo.update(rec);
  }

  /** اعلام حضور یک طرف برای یک مسابقه‌ی آماده. */
  async checkIn(id: string, matchId: string, participantId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new Error('tournament is not running');
    const rm = this.buildEngine(rec).ready().find((m) => m.id === matchId);
    if (!rm) throw new Error('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new Error('check-in applies only to duels');
    if (!rm.participantIds.includes(participantId)) throw new Error('participant is not in this match');
    if (this.checkInsFor(rec, matchId).includes(participantId)) throw new Error('already checked in');
    rec.events.push({ kind: 'CHECKIN', matchId, participantId });
    await this.repo.update(rec);
  }

  /** اعلام no-show: طرفِ حاضر (check-in‌کرده) برنده می‌شود چون حریف نیامده است. */
  async declareNoShow(id: string, matchId: string, presentId: string): Promise<void> {
    const rec = await this.mustGet(id);
    if (rec.status !== 'RUNNING') throw new Error('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new Error('match not ready or does not exist');
    if (rm.kind !== 'DUEL') throw new Error('no-show applies only to duels');
    if (!rm.participantIds.includes(presentId)) throw new Error('participant is not in this match');
    const checked = this.checkInsFor(rec, matchId);
    if (!checked.includes(presentId)) throw new Error('the declarer must be checked in');
    const opponent = rm.participantIds.find((p) => p !== presentId)!;
    if (checked.includes(opponent)) throw new Error('opponent has checked in — not a no-show');
    e.reportDuel(matchId, presentId);
    rec.events.push({ kind: 'DUEL', matchId, winnerId: presentId, source: 'NO_SHOW' });
    if (e.isComplete()) rec.status = 'COMPLETED';
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
    if (rec.status !== 'RUNNING') throw new Error('tournament is not running');
    const e = this.buildEngine(rec);
    const rm = e.ready().find((m) => m.id === matchId);
    if (!rm) throw new Error('lobby not ready or does not exist');
    if (rm.kind !== 'LOBBY') throw new Error('this match is a duel, not a lobby');
    e.reportLobby(matchId, rankedIds);
    rec.events.push({ kind: 'LOBBY', matchId, rankedIds: [...rankedIds] });
    if (e.isComplete()) rec.status = 'COMPLETED';
    await this.repo.update(rec);
  }

  async standings(id: string): Promise<Standing[]> {
    return this.buildEngine(await this.mustGet(id)).standings();
  }

  async champion(id: string): Promise<string | null> {
    return this.buildEngine(await this.mustGet(id)).champion();
  }

  async get(id: string): Promise<TournamentRecord> {
    return this.mustGet(id);
  }

  async list(): Promise<TournamentRecord[]> {
    return this.repo.list();
  }

  private async mustGet(id: string): Promise<TournamentRecord> {
    const rec = await this.repo.get(id);
    if (!rec) throw new Error(`tournament ${id} not found`);
    return rec;
  }
}
