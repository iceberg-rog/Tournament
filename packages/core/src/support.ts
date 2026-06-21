import { DomainError } from './errors';

export type TicketStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

export interface TicketMessage {
  authorId: string;
  staff: boolean;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
}

export interface TicketRepository {
  create(t: Ticket): Promise<void>;
  get(id: string): Promise<Ticket | null>;
  update(t: Ticket): Promise<void>;
  list(): Promise<Ticket[]>;
  listForUser(userId: string): Promise<Ticket[]>;
}

export class InMemoryTicketRepository implements TicketRepository {
  private store = new Map<string, Ticket>();
  async create(t: Ticket): Promise<void> {
    this.store.set(t.id, structuredClone(t));
  }
  async get(id: string): Promise<Ticket | null> {
    const t = this.store.get(id);
    return t ? structuredClone(t) : null;
  }
  async update(t: Ticket): Promise<void> {
    this.store.set(t.id, structuredClone(t));
  }
  async list(): Promise<Ticket[]> {
    return [...this.store.values()].map((t) => structuredClone(t));
  }
  async listForUser(userId: string): Promise<Ticket[]> {
    return [...this.store.values()].filter((t) => t.userId === userId).map((t) => structuredClone(t));
  }
}

/** تیکت پشتیبانی (UC26): کاربر باز می‌کند و پیام می‌گذارد؛ پشتیبانی پاسخ می‌دهد. */
export class SupportService {
  constructor(
    private readonly repo: TicketRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async open(userId: string, subject: string, text: string): Promise<Ticket> {
    if (subject.trim().length < 3) throw new DomainError('موضوع تیکت کوتاه است');
    if (text.trim().length < 3) throw new DomainError('متن پیام کوتاه است');
    const t: Ticket = {
      id: this.idGen(),
      userId,
      subject,
      status: 'OPEN',
      messages: [{ authorId: userId, staff: false, text, createdAt: this.now() }],
      createdAt: this.now(),
    };
    await this.repo.create(t);
    return t;
  }

  async reply(id: string, authorId: string, text: string, staff: boolean): Promise<Ticket> {
    const t = await this.mustGet(id);
    if (t.status === 'CLOSED') throw new DomainError('تیکت بسته شده است');
    if (!staff && t.userId !== authorId) throw new DomainError('اجازه‌ی پاسخ به این تیکت را ندارید');
    t.messages.push({ authorId, staff, text, createdAt: this.now() });
    t.status = staff ? 'ANSWERED' : 'OPEN';
    await this.repo.update(t);
    return t;
  }

  async close(id: string): Promise<Ticket> {
    const t = await this.mustGet(id);
    t.status = 'CLOSED';
    await this.repo.update(t);
    return t;
  }

  async get(id: string): Promise<Ticket | null> {
    return this.repo.get(id);
  }
  async listForUser(userId: string): Promise<Ticket[]> {
    return this.repo.listForUser(userId);
  }
  async listOpen(): Promise<Ticket[]> {
    return (await this.repo.list()).filter((t) => t.status !== 'CLOSED');
  }

  private async mustGet(id: string): Promise<Ticket> {
    const t = await this.repo.get(id);
    if (!t) throw new DomainError(`ticket ${id} not found`);
    return t;
  }
}
