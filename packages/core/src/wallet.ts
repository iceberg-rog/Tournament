/** ثبت یک تراکنش کیف پول (برای ممیزی). */
export interface WalletLedgerEntry {
  userId: string;
  amount: number;
  ref: string;
}

/** انتزاع کیف پول — in-memory برای تست، Prisma برای پروداکشن. */
export interface WalletRepository {
  credit(userId: string, amount: number, ref: string): Promise<void>;
  balanceOf(userId: string): Promise<number>;
  ledger(): Promise<WalletLedgerEntry[]>;
}

/** کیف پول in-memory با دفتر تراکنش‌ها. */
export class InMemoryWalletRepository implements WalletRepository {
  private balances = new Map<string, number>();
  private entries: WalletLedgerEntry[] = [];

  async credit(userId: string, amount: number, ref: string): Promise<void> {
    if (amount <= 0) throw new Error('amount must be > 0');
    this.balances.set(userId, (this.balances.get(userId) ?? 0) + amount);
    this.entries.push({ userId, amount, ref });
  }

  async balanceOf(userId: string): Promise<number> {
    return this.balances.get(userId) ?? 0;
  }

  async ledger(): Promise<WalletLedgerEntry[]> {
    return [...this.entries];
  }
}
