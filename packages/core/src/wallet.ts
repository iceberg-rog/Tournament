import { DomainError } from './errors';

/** نوع تراکنش دفترِ کیف پول. */
export type LedgerType =
  | 'DEPOSIT' // شارژ کیف پول
  | 'WITHDRAWAL' // برداشت به حساب بانکی
  | 'ENTRY_HOLD' // مسدودی هزینه‌ی ورودی (available → escrow)
  | 'ENTRY_RELEASE' // آزادسازی مسدودی (escrow → available) — بازگشت وجه
  | 'ENTRY_CAPTURE' // قطعی‌شدن هزینه‌ی ورودی (خروج از escrow)
  | 'PRIZE'; // واریز جایزه (→ available)

/** یک سطر دفترِ کیف پول (مدلِ دلتا برای ممیزی و بازسازی موجودی). */
export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerType;
  availableDelta: number;
  escrowDelta: number;
  ref: string;
  createdAt: string;
}

export interface WalletBalance {
  available: number;
  escrow: number;
}

/** انتزاع پایداریِ دفتر — in-memory برای تست، Prisma برای پروداکشن. */
export interface WalletRepository {
  append(e: LedgerEntry): Promise<void>;
  entriesFor(userId: string): Promise<LedgerEntry[]>;
  all(): Promise<LedgerEntry[]>;
}

export class InMemoryWalletRepository implements WalletRepository {
  private entries: LedgerEntry[] = [];
  async append(e: LedgerEntry): Promise<void> {
    this.entries.push({ ...e });
  }
  async entriesFor(userId: string): Promise<LedgerEntry[]> {
    return this.entries.filter((x) => x.userId === userId).map((e) => ({ ...e }));
  }
  async all(): Promise<LedgerEntry[]> {
    return this.entries.map((e) => ({ ...e }));
  }
}

/** پورتِ موردنیاز سرویس تورنومنت برای چرخه‌ی escrow و جایزه. */
export interface WalletPort {
  hold(userId: string, amount: number, ref: string): Promise<void>;
  release(userId: string, amount: number, ref: string): Promise<void>;
  capture(userId: string, amount: number, ref: string): Promise<void>;
  prize(userId: string, amount: number, ref: string): Promise<void>;
}

/** سرویس کیف پول: موجودی = جمعِ دلتاهای دفتر (available + escrow). */
export class WalletService implements WalletPort {
  constructor(
    private readonly repo: WalletRepository,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private async add(
    userId: string,
    type: LedgerType,
    availableDelta: number,
    escrowDelta: number,
    ref: string,
  ): Promise<void> {
    await this.repo.append({
      id: this.idGen(),
      userId,
      type,
      availableDelta,
      escrowDelta,
      ref,
      createdAt: this.now(),
    });
  }

  async balance(userId: string): Promise<WalletBalance> {
    const es = await this.repo.entriesFor(userId);
    return es.reduce(
      (b, e) => ({ available: b.available + e.availableDelta, escrow: b.escrow + e.escrowDelta }),
      { available: 0, escrow: 0 },
    );
  }

  /** شارژ کیف پول (مثلاً پس از پرداخت موفق از درگاه). */
  async deposit(userId: string, amount: number, ref = 'deposit'): Promise<void> {
    if (amount <= 0) throw new DomainError('amount must be greater than 0');
    await this.add(userId, 'DEPOSIT', amount, 0, ref);
  }

  /** مسدودسازی هزینه‌ی ورودی (نیازمند موجودیِ کافی). */
  async hold(userId: string, amount: number, ref: string): Promise<void> {
    if (amount <= 0) return;
    const { available } = await this.balance(userId);
    if (available < amount) throw new DomainError('موجودی کیف پول برای هزینه‌ی ورودی کافی نیست');
    await this.add(userId, 'ENTRY_HOLD', -amount, amount, ref);
  }

  /** آزادسازی مسدودی (بازگشت وجه به موجودی در دسترس). */
  async release(userId: string, amount: number, ref: string): Promise<void> {
    if (amount <= 0) return;
    await this.add(userId, 'ENTRY_RELEASE', amount, -amount, ref);
  }

  /** قطعی‌کردن هزینه (خروج از escrow؛ هنگام پایان تورنومنت). */
  async capture(userId: string, amount: number, ref: string): Promise<void> {
    if (amount <= 0) return;
    await this.add(userId, 'ENTRY_CAPTURE', 0, -amount, ref);
  }

  /** واریز جایزه به موجودی در دسترس. */
  async prize(userId: string, amount: number, ref: string): Promise<void> {
    if (amount <= 0) return;
    await this.add(userId, 'PRIZE', amount, 0, ref);
  }

  /** برداشت به حساب بانکی (کسر از موجودی در دسترس). */
  async withdraw(userId: string, amount: number, ref = 'withdrawal'): Promise<void> {
    if (amount <= 0) throw new DomainError('amount must be greater than 0');
    const { available } = await this.balance(userId);
    if (available < amount) throw new DomainError('موجودی برای برداشت کافی نیست');
    await this.add(userId, 'WITHDRAWAL', -amount, 0, ref);
  }

  /** تاریخچه‌ی تراکنش‌های کاربر (UC28). */
  async history(userId: string): Promise<LedgerEntry[]> {
    return this.repo.entriesFor(userId);
  }
}
