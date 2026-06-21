import { DomainError } from './errors';

export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type ReportAction = 'NONE' | 'WARN' | 'SUSPEND' | 'BAN' | 'DISQUALIFY';
/** دسته‌ی گزارش — مبنای anti-cheat/تجمیع سیگنال. */
export type ReportCategory = 'CHEAT' | 'ABUSE' | 'SMURF' | 'NO_SHOW' | 'OTHER';

export interface Report {
  id: string;
  reporterId: string;
  targetUserId?: string;
  tournamentId?: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  action?: ReportAction;
  resolution?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReportRepository {
  create(r: Report): Promise<void>;
  get(id: string): Promise<Report | null>;
  update(r: Report): Promise<void>;
  list(): Promise<Report[]>;
}

export class InMemoryReportRepository implements ReportRepository {
  private store = new Map<string, Report>();
  async create(r: Report): Promise<void> {
    this.store.set(r.id, { ...r });
  }
  async get(id: string): Promise<Report | null> {
    const r = this.store.get(id);
    return r ? { ...r } : null;
  }
  async update(r: Report): Promise<void> {
    this.store.set(r.id, { ...r });
  }
  async list(): Promise<Report[]> {
    return [...this.store.values()].map((r) => ({ ...r }));
  }
}

/** گزارش تخلف (UC27) و رسیدگی/تعدیل (UC18) + تجمیع پرچم‌های anti-cheat. */
export class ModerationService {
  constructor(
    private readonly repo: ReportRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async file(
    reporterId: string,
    input: { targetUserId?: string; tournamentId?: string; category: ReportCategory; reason: string },
  ): Promise<Report> {
    if (!input.reason || input.reason.trim().length < 3) throw new DomainError('شرح گزارش کوتاه است');
    const r: Report = {
      id: this.idGen(),
      reporterId,
      targetUserId: input.targetUserId,
      tournamentId: input.tournamentId,
      category: input.category,
      reason: input.reason,
      status: 'OPEN',
      createdAt: this.now(),
    };
    await this.repo.create(r);
    return r;
  }

  async resolve(id: string, action: ReportAction, resolution: string): Promise<Report> {
    return this.review(id, 'RESOLVED', action, resolution);
  }
  async dismiss(id: string, resolution: string): Promise<Report> {
    return this.review(id, 'DISMISSED', 'NONE', resolution);
  }

  async get(id: string): Promise<Report | null> {
    return this.repo.get(id);
  }
  async listOpen(): Promise<Report[]> {
    return (await this.repo.list()).filter((r) => r.status === 'OPEN');
  }

  /** تعداد پرچم‌های یک کاربر (گزارش‌های ثبت‌شده علیه او) — سیگنالِ anti-cheat. */
  async flagsForUser(userId: string): Promise<number> {
    return (await this.repo.list()).filter((r) => r.targetUserId === userId).length;
  }

  private async review(
    id: string,
    status: ReportStatus,
    action: ReportAction,
    resolution: string,
  ): Promise<Report> {
    const r = await this.repo.get(id);
    if (!r) throw new DomainError(`report ${id} not found`);
    if (r.status !== 'OPEN') throw new DomainError('گزارش قبلاً رسیدگی شده است');
    r.status = status;
    r.action = action;
    r.resolution = resolution;
    r.reviewedAt = this.now();
    await this.repo.update(r);
    return r;
  }
}
