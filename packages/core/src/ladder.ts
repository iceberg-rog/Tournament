import { DomainError } from './errors';

export interface RatingEntry {
  userId: string;
  rating: number;
  played: number;
  wins: number;
}

/** یک نردبان (ladder) دائمی با صف matchmaking و رتبه‌ی ELO. */
export interface LadderRecord {
  id: string;
  title: string;
  queue: string[];
  ratings: Record<string, RatingEntry>;
}

export interface LadderRepository {
  create(l: LadderRecord): Promise<void>;
  get(id: string): Promise<LadderRecord | null>;
  update(l: LadderRecord): Promise<void>;
  list(): Promise<LadderRecord[]>;
}

export class InMemoryLadderRepository implements LadderRepository {
  private store = new Map<string, LadderRecord>();
  async create(l: LadderRecord): Promise<void> {
    this.store.set(l.id, structuredClone(l));
  }
  async get(id: string): Promise<LadderRecord | null> {
    const l = this.store.get(id);
    return l ? structuredClone(l) : null;
  }
  async update(l: LadderRecord): Promise<void> {
    if (!this.store.has(l.id)) throw new DomainError(`ladder ${l.id} not found`);
    this.store.set(l.id, structuredClone(l));
  }
  async list(): Promise<LadderRecord[]> {
    return [...this.store.values()].map((l) => structuredClone(l));
  }
}

const START_RATING = 1000;
const K = 32;

/**
 * سرویس نردبان: صف، جفت‌سازیِ نزدیک‌ترین رتبه‌ها، و به‌روزرسانی ELO پس از نتیجه.
 */
export class LadderService {
  constructor(
    private readonly repo: LadderRepository,
    private readonly idGen: () => string,
  ) {}

  async createLadder(title: string): Promise<LadderRecord> {
    if (title.trim().length < 2) throw new DomainError('ladder title is too short');
    const l: LadderRecord = { id: this.idGen(), title, queue: [], ratings: {} };
    await this.repo.create(l);
    return l;
  }

  /** پیوستن به صف (و ساخت رکورد rating در صورت تازه‌بودن). */
  async join(ladderId: string, userId: string): Promise<void> {
    const l = await this.mustGet(ladderId);
    l.ratings[userId] ??= { userId, rating: START_RATING, played: 0, wins: 0 };
    if (!l.queue.includes(userId)) l.queue.push(userId);
    await this.repo.update(l);
  }

  /** جفت‌سازی: نزدیک‌ترین دو نفرِ صف بر اساس rating (یا null اگر کمتر از ۲). */
  async matchmake(ladderId: string): Promise<{ a: string; b: string } | null> {
    const l = await this.mustGet(ladderId);
    if (l.queue.length < 2) return null;
    const sorted = [...l.queue].sort((x, y) => l.ratings[x].rating - l.ratings[y].rating);
    let bestI = 0;
    let bestGap = Infinity;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = Math.abs(l.ratings[sorted[i]].rating - l.ratings[sorted[i + 1]].rating);
      if (gap < bestGap) {
        bestGap = gap;
        bestI = i;
      }
    }
    const a = sorted[bestI];
    const b = sorted[bestI + 1];
    l.queue = l.queue.filter((u) => u !== a && u !== b);
    await this.repo.update(l);
    return { a, b };
  }

  /** ثبت نتیجه و به‌روزرسانی ELO (zero-sum). */
  async reportMatch(ladderId: string, a: string, b: string, winnerId: string): Promise<void> {
    const l = await this.mustGet(ladderId);
    const ra = l.ratings[a];
    const rb = l.ratings[b];
    if (!ra || !rb) throw new DomainError('both players must be on the ladder');
    if (winnerId !== a && winnerId !== b) throw new DomainError('winner must be one of the two players');
    const ea = 1 / (1 + 10 ** ((rb.rating - ra.rating) / 400));
    const eb = 1 - ea;
    const sa = winnerId === a ? 1 : 0;
    const sb = winnerId === b ? 1 : 0;
    ra.rating = Math.round(ra.rating + K * (sa - ea));
    rb.rating = Math.round(rb.rating + K * (sb - eb));
    ra.played += 1;
    rb.played += 1;
    if (winnerId === a) ra.wins += 1;
    else rb.wins += 1;
    await this.repo.update(l);
  }

  async standings(ladderId: string): Promise<(RatingEntry & { rank: number })[]> {
    const l = await this.mustGet(ladderId);
    return Object.values(l.ratings)
      .sort((x, y) => y.rating - x.rating)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }

  async get(ladderId: string): Promise<LadderRecord> {
    return this.mustGet(ladderId);
  }

  private async mustGet(id: string): Promise<LadderRecord> {
    const l = await this.repo.get(id);
    if (!l) throw new DomainError(`ladder ${id} not found`);
    return l;
  }
}
