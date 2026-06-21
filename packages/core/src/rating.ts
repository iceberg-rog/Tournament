import { DomainError } from './errors';

/** امتیاز یک کاربر به یک تورنومنت (UC25) — یک امتیاز per کاربر per تورنومنت. */
export interface Rating {
  id: string;
  tournamentId: string;
  userId: string;
  score: number; // ۱ تا ۵
  comment?: string;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface RatingRepository {
  upsert(r: Rating): Promise<void>;
  listFor(tournamentId: string): Promise<Rating[]>;
  getUserRating(tournamentId: string, userId: string): Promise<Rating | null>;
}

export class InMemoryRatingRepository implements RatingRepository {
  private store = new Map<string, Rating>();
  private key(t: string, u: string) {
    return `${t}:${u}`;
  }
  async upsert(r: Rating): Promise<void> {
    this.store.set(this.key(r.tournamentId, r.userId), { ...r });
  }
  async listFor(tournamentId: string): Promise<Rating[]> {
    return [...this.store.values()].filter((r) => r.tournamentId === tournamentId).map((r) => ({ ...r }));
  }
  async getUserRating(tournamentId: string, userId: string): Promise<Rating | null> {
    const r = this.store.get(this.key(tournamentId, userId));
    return r ? { ...r } : null;
  }
}

export class RatingService {
  constructor(
    private readonly repo: RatingRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async rate(tournamentId: string, userId: string, score: number, comment?: string): Promise<Rating> {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new DomainError('امتیاز باید عددی بین ۱ تا ۵ باشد');
    }
    const existing = await this.repo.getUserRating(tournamentId, userId);
    const r: Rating = {
      id: existing?.id ?? this.idGen(),
      tournamentId,
      userId,
      score,
      comment,
      createdAt: existing?.createdAt ?? this.now(),
    };
    await this.repo.upsert(r);
    return r;
  }

  async summary(tournamentId: string): Promise<RatingSummary> {
    const list = await this.repo.listFor(tournamentId);
    if (list.length === 0) return { average: 0, count: 0 };
    const sum = list.reduce((a, r) => a + r.score, 0);
    return { average: Math.round((sum / list.length) * 10) / 10, count: list.length };
  }

  async listFor(tournamentId: string): Promise<Rating[]> {
    return this.repo.listFor(tournamentId);
  }
  async getUserRating(tournamentId: string, userId: string): Promise<Rating | null> {
    return this.repo.getUserRating(tournamentId, userId);
  }
}
