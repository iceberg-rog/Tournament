import { TournamentRecord, TournamentRepository } from './repository';

/** مخزن in-memory — برای تست و توسعه‌ی محلی بدون دیتابیس. */
export class InMemoryTournamentRepository implements TournamentRepository {
  private store = new Map<string, TournamentRecord>();

  async create(rec: TournamentRecord): Promise<void> {
    this.store.set(rec.id, structuredClone(rec));
  }

  async get(id: string): Promise<TournamentRecord | null> {
    const rec = this.store.get(id);
    return rec ? structuredClone(rec) : null;
  }

  async update(rec: TournamentRecord): Promise<void> {
    if (!this.store.has(rec.id)) throw new Error(`tournament ${rec.id} not found`);
    this.store.set(rec.id, structuredClone(rec));
  }

  async list(): Promise<TournamentRecord[]> {
    return [...this.store.values()].map((r) => structuredClone(r));
  }
}
