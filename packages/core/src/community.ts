import { DomainError } from './errors';

export interface Post {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

/** فضای اجتماعی (Space) — مستقل یا مرتبط با یک تورنومنت. */
export interface Space {
  id: string;
  title: string;
  tournamentId?: string;
  memberIds: string[];
  posts: Post[];
}

export interface SpaceRepository {
  create(s: Space): Promise<void>;
  get(id: string): Promise<Space | null>;
  update(s: Space): Promise<void>;
  list(): Promise<Space[]>;
}

export class InMemorySpaceRepository implements SpaceRepository {
  private store = new Map<string, Space>();
  async create(s: Space): Promise<void> {
    this.store.set(s.id, structuredClone(s));
  }
  async get(id: string): Promise<Space | null> {
    const s = this.store.get(id);
    return s ? structuredClone(s) : null;
  }
  async update(s: Space): Promise<void> {
    if (!this.store.has(s.id)) throw new DomainError(`space ${s.id} not found`);
    this.store.set(s.id, structuredClone(s));
  }
  async list(): Promise<Space[]> {
    return [...this.store.values()].map((s) => structuredClone(s));
  }
}

/** سرویس کامیونیتی: ساخت فضا، عضویت، و پست (فقط اعضا می‌توانند پست بگذارند). */
export class CommunityService {
  constructor(
    private readonly repo: SpaceRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async createSpace(title: string, tournamentId?: string): Promise<Space> {
    if (title.trim().length < 2) throw new DomainError('space title is too short');
    const s: Space = { id: this.idGen(), title, tournamentId, memberIds: [], posts: [] };
    await this.repo.create(s);
    return s;
  }

  async join(spaceId: string, userId: string): Promise<void> {
    const s = await this.mustGet(spaceId);
    if (!s.memberIds.includes(userId)) s.memberIds.push(userId);
    await this.repo.update(s);
  }

  async leave(spaceId: string, userId: string): Promise<void> {
    const s = await this.mustGet(spaceId);
    s.memberIds = s.memberIds.filter((m) => m !== userId);
    await this.repo.update(s);
  }

  async post(spaceId: string, authorId: string, text: string): Promise<Post> {
    const s = await this.mustGet(spaceId);
    if (!s.memberIds.includes(authorId)) throw new DomainError('only members can post in this space');
    if (text.trim().length === 0) throw new DomainError('post text is empty');
    const p: Post = { id: this.idGen(), authorId, text, createdAt: this.now() };
    s.posts.push(p);
    await this.repo.update(s);
    return p;
  }

  async get(spaceId: string): Promise<Space> {
    return this.mustGet(spaceId);
  }

  async list(): Promise<Space[]> {
    return this.repo.list();
  }

  private async mustGet(id: string): Promise<Space> {
    const s = await this.repo.get(id);
    if (!s) throw new DomainError(`space ${id} not found`);
    return s;
  }
}
