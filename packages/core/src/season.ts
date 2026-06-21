import { DomainError } from './errors';
import { TournamentService } from './tournamentService';

/** یک فصل/لیگ که چند تورنومنت را گروه می‌کند. */
export interface SeasonRecord {
  id: string;
  title: string;
  tournamentIds: string[];
}

export interface SeasonRepository {
  create(s: SeasonRecord): Promise<void>;
  get(id: string): Promise<SeasonRecord | null>;
  update(s: SeasonRecord): Promise<void>;
  list(): Promise<SeasonRecord[]>;
}

export class InMemorySeasonRepository implements SeasonRepository {
  private store = new Map<string, SeasonRecord>();
  async create(s: SeasonRecord): Promise<void> {
    this.store.set(s.id, structuredClone(s));
  }
  async get(id: string): Promise<SeasonRecord | null> {
    const s = this.store.get(id);
    return s ? structuredClone(s) : null;
  }
  async update(s: SeasonRecord): Promise<void> {
    if (!this.store.has(s.id)) throw new DomainError(`season ${s.id} not found`);
    this.store.set(s.id, structuredClone(s));
  }
  async list(): Promise<SeasonRecord[]> {
    return [...this.store.values()].map((s) => structuredClone(s));
  }
}

export interface SeasonStanding {
  participantId: string;
  name: string;
  rank: number;
  points: number;
  tournamentsPlayed: number;
}

/**
 * سرویس فصل/لیگ: گروه‌بندی تورنومنت‌ها و رده‌بندیِ تجمعی.
 * امتیاز فصلِ هر شرکت‌کننده در هر تورنومنت = (تعداد شرکت‌کننده − رتبه + ۱) (placement points).
 */
export class SeasonService {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly tournaments: TournamentService,
    private readonly idGen: () => string,
  ) {}

  async create(title: string): Promise<SeasonRecord> {
    const s: SeasonRecord = { id: this.idGen(), title, tournamentIds: [] };
    await this.seasons.create(s);
    return s;
  }

  async addTournament(seasonId: string, tournamentId: string): Promise<void> {
    const s = await this.mustGet(seasonId);
    await this.tournaments.get(tournamentId); // وجود تورنومنت را اعتبارسنجی می‌کند
    if (!s.tournamentIds.includes(tournamentId)) s.tournamentIds.push(tournamentId);
    await this.seasons.update(s);
  }

  async get(seasonId: string): Promise<SeasonRecord> {
    return this.mustGet(seasonId);
  }

  async list(): Promise<SeasonRecord[]> {
    return this.seasons.list();
  }

  async standings(seasonId: string): Promise<SeasonStanding[]> {
    const s = await this.mustGet(seasonId);
    const agg = new Map<
      string,
      { participantId: string; name: string; points: number; tournamentsPlayed: number }
    >();
    for (const tid of s.tournamentIds) {
      const st = await this.tournaments.standings(tid);
      const n = st.length;
      for (const row of st) {
        const seasonPts = n - row.rank + 1;
        const e =
          agg.get(row.participantId) ??
          { participantId: row.participantId, name: row.name, points: 0, tournamentsPlayed: 0 };
        e.points += seasonPts;
        e.tournamentsPlayed += 1;
        e.name = row.name;
        agg.set(row.participantId, e);
      }
    }
    return [...agg.values()]
      .sort((a, b) => b.points - a.points)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }

  private async mustGet(id: string): Promise<SeasonRecord> {
    const s = await this.seasons.get(id);
    if (!s) throw new DomainError(`season ${id} not found`);
    return s;
  }
}
