import { DomainError } from './errors';
import { WalletService } from './wallet';

// ───────────────────────── KYC (UC30) ─────────────────────────

export type KycStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycCase {
  userId: string;
  status: KycStatus;
  fullName: string;
  nationalId: string;
  createdAt: string;
  reviewedAt?: string;
  reason?: string;
}

export interface KycRepository {
  upsert(c: KycCase): Promise<void>;
  get(userId: string): Promise<KycCase | null>;
  list(): Promise<KycCase[]>;
}

export class InMemoryKycRepository implements KycRepository {
  private store = new Map<string, KycCase>();
  async upsert(c: KycCase): Promise<void> {
    this.store.set(c.userId, { ...c });
  }
  async get(userId: string): Promise<KycCase | null> {
    const c = this.store.get(userId);
    return c ? { ...c } : null;
  }
  async list(): Promise<KycCase[]> {
    return [...this.store.values()].map((c) => ({ ...c }));
  }
}

export class KycService {
  constructor(
    private readonly repo: KycRepository,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async submit(userId: string, fullName: string, nationalId: string): Promise<KycCase> {
    if (fullName.trim().length < 3) throw new DomainError('نام کامل نامعتبر است');
    if (!/^\d{10}$/.test(nationalId)) throw new DomainError('کد ملی باید ۱۰ رقم باشد');
    const c: KycCase = { userId, status: 'PENDING', fullName, nationalId, createdAt: this.now() };
    await this.repo.upsert(c);
    return c;
  }
  async status(userId: string): Promise<KycStatus> {
    return (await this.repo.get(userId))?.status ?? 'NONE';
  }
  async get(userId: string): Promise<KycCase | null> {
    return this.repo.get(userId);
  }
  async approve(userId: string): Promise<KycCase> {
    return this.review(userId, 'APPROVED');
  }
  async reject(userId: string, reason: string): Promise<KycCase> {
    return this.review(userId, 'REJECTED', reason);
  }
  async listPending(): Promise<KycCase[]> {
    return (await this.repo.list()).filter((c) => c.status === 'PENDING');
  }
  private async review(userId: string, status: KycStatus, reason?: string): Promise<KycCase> {
    const c = await this.repo.get(userId);
    if (!c) throw new DomainError('پرونده‌ی KYC یافت نشد');
    c.status = status;
    c.reviewedAt = this.now();
    c.reason = reason;
    await this.repo.upsert(c);
    return c;
  }
}

// ─────────────────────── برداشت جایزه (UC29) ───────────────────────

export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  iban: string;
  status: WithdrawalStatus;
  createdAt: string;
  reviewedAt?: string;
  reason?: string;
}

export interface WithdrawalRepository {
  create(w: WithdrawalRequest): Promise<void>;
  get(id: string): Promise<WithdrawalRequest | null>;
  update(w: WithdrawalRequest): Promise<void>;
  list(): Promise<WithdrawalRequest[]>;
  listForUser(userId: string): Promise<WithdrawalRequest[]>;
}

export class InMemoryWithdrawalRepository implements WithdrawalRepository {
  private store = new Map<string, WithdrawalRequest>();
  async create(w: WithdrawalRequest): Promise<void> {
    this.store.set(w.id, { ...w });
  }
  async get(id: string): Promise<WithdrawalRequest | null> {
    const w = this.store.get(id);
    return w ? { ...w } : null;
  }
  async update(w: WithdrawalRequest): Promise<void> {
    this.store.set(w.id, { ...w });
  }
  async list(): Promise<WithdrawalRequest[]> {
    return [...this.store.values()].map((w) => ({ ...w }));
  }
  async listForUser(userId: string): Promise<WithdrawalRequest[]> {
    return [...this.store.values()].filter((w) => w.userId === userId).map((w) => ({ ...w }));
  }
}

/** برداشت جایزه به حساب بانکی — نیازمند KYC تأییدشده؛ مبلغ بلافاصله از موجودی کسر می‌شود. */
export class WithdrawalService {
  constructor(
    private readonly repo: WithdrawalRepository,
    private readonly wallet: WalletService,
    private readonly kyc: KycService,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async request(userId: string, amount: number, iban: string): Promise<WithdrawalRequest> {
    if ((await this.kyc.status(userId)) !== 'APPROVED') {
      throw new DomainError('برای برداشت، احراز هویت (KYC) باید تأیید شده باشد');
    }
    if (!/^IR\d{24}$/.test(iban)) throw new DomainError('شماره‌ی شبا (IBAN) نامعتبر است');
    await this.wallet.withdraw(userId, amount, 'withdraw-request'); // کسر فوری (با بررسی موجودی)
    const w: WithdrawalRequest = {
      id: this.idGen(),
      userId,
      amount,
      iban,
      status: 'PENDING',
      createdAt: this.now(),
    };
    await this.repo.create(w);
    return w;
  }

  async markPaid(id: string): Promise<WithdrawalRequest> {
    const w = await this.mustGet(id);
    if (w.status !== 'PENDING') throw new DomainError('درخواست در وضعیت در انتظار نیست');
    w.status = 'PAID';
    w.reviewedAt = this.now();
    await this.repo.update(w);
    return w;
  }

  async reject(id: string, reason: string): Promise<WithdrawalRequest> {
    const w = await this.mustGet(id);
    if (w.status !== 'PENDING') throw new DomainError('درخواست در وضعیت در انتظار نیست');
    w.status = 'REJECTED';
    w.reason = reason;
    w.reviewedAt = this.now();
    await this.wallet.deposit(w.userId, w.amount, `withdraw-refund:${w.id}`); // بازگشت وجه
    await this.repo.update(w);
    return w;
  }

  async listForUser(userId: string): Promise<WithdrawalRequest[]> {
    return this.repo.listForUser(userId);
  }
  async listPending(): Promise<WithdrawalRequest[]> {
    return (await this.repo.list()).filter((w) => w.status === 'PENDING');
  }
  private async mustGet(id: string): Promise<WithdrawalRequest> {
    const w = await this.repo.get(id);
    if (!w) throw new DomainError(`withdrawal ${id} not found`);
    return w;
  }
}
