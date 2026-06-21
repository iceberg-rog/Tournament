import { DomainError } from './errors';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Payment {
  id: string;
  amount: number;
  description: string;
  status: PaymentStatus;
  authority: string;
  ref?: string;
  createdAt: string;
}

/** انتزاع درگاه پرداخت — Sandbox برای تست/توسعه، زرین‌پال واقعی برای پروداکشن. */
export interface PaymentGateway {
  request(amount: number, description: string): Promise<{ authority: string; redirectUrl: string }>;
  verify(authority: string, amount?: number): Promise<{ ok: boolean; ref?: string }>;
}

/** درگاه آزمایشی بدون شبکه (همیشه موفق) — تا بدون merchant واقعی هم اجرا شود. */
export class SandboxGateway implements PaymentGateway {
  constructor(private readonly idGen: () => string) {}
  async request(amount: number): Promise<{ authority: string; redirectUrl: string }> {
    const authority = `SBX-${this.idGen()}`;
    return { authority, redirectUrl: `sandbox://pay/${authority}?amount=${amount}` };
  }
  async verify(authority: string): Promise<{ ok: boolean; ref?: string }> {
    return { ok: true, ref: `REF-${authority}` };
  }
}

/**
 * درگاه واقعی زرین‌پال (Payment API v4). با merchantId/callbackUrl از تنظیمات مدیریت
 * ساخته می‌شود؛ با sandbox=false روی درگاه واقعی و با true روی sandbox زرین‌پال کار می‌کند.
 */
export class ZarinpalGateway implements PaymentGateway {
  private readonly api: string;
  private readonly startPay: string;
  constructor(
    private readonly merchantId: string,
    private readonly callbackUrl: string,
    sandbox = false,
  ) {
    this.api = sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';
    this.startPay = sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  async request(amount: number, description: string): Promise<{ authority: string; redirectUrl: string }> {
    const json = await this.post('/request.json', {
      merchant_id: this.merchantId,
      amount,
      callback_url: this.callbackUrl,
      description,
    });
    const code = json?.data?.code;
    if (code !== 100 && code !== 101) {
      throw new DomainError(`zarinpal request failed: ${JSON.stringify(json?.errors ?? code)}`);
    }
    const authority = String(json.data.authority);
    return { authority, redirectUrl: `${this.startPay}/${authority}` };
  }

  async verify(authority: string, amount?: number): Promise<{ ok: boolean; ref?: string }> {
    const json = await this.post('/verify.json', {
      merchant_id: this.merchantId,
      amount,
      authority,
    });
    const code = json?.data?.code;
    return {
      ok: code === 100 || code === 101,
      ref: json?.data?.ref_id ? String(json.data.ref_id) : undefined,
    };
  }

  private async post(path: string, body: unknown): Promise<any> {
    const res = await fetch(`${this.api}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }
}

export interface PaymentRepository {
  create(p: Payment): Promise<void>;
  get(id: string): Promise<Payment | null>;
  update(p: Payment): Promise<void>;
}

export class InMemoryPaymentRepository implements PaymentRepository {
  private store = new Map<string, Payment>();
  async create(p: Payment): Promise<void> {
    this.store.set(p.id, structuredClone(p));
  }
  async get(id: string): Promise<Payment | null> {
    const p = this.store.get(id);
    return p ? structuredClone(p) : null;
  }
  async update(p: Payment): Promise<void> {
    if (!this.store.has(p.id)) throw new DomainError(`payment ${p.id} not found`);
    this.store.set(p.id, structuredClone(p));
  }
}

/** سرویس پرداخت: ساخت درخواست، و verify از طریق درگاه. */
export class PaymentService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly idGen: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async createRequest(
    amount: number,
    description: string,
  ): Promise<{ payment: Payment; redirectUrl: string }> {
    if (amount <= 0) throw new DomainError('amount must be greater than 0');
    const { authority, redirectUrl } = await this.gateway.request(amount, description);
    const payment: Payment = {
      id: this.idGen(),
      amount,
      description,
      status: 'PENDING',
      authority,
      createdAt: this.now(),
    };
    await this.repo.create(payment);
    return { payment, redirectUrl };
  }

  async verify(paymentId: string): Promise<Payment> {
    const p = await this.mustGet(paymentId);
    if (p.status !== 'PENDING') throw new DomainError('payment is not pending');
    const res = await this.gateway.verify(p.authority, p.amount);
    p.status = res.ok ? 'PAID' : 'FAILED';
    if (res.ok) p.ref = res.ref;
    await this.repo.update(p);
    return p;
  }

  async get(id: string): Promise<Payment> {
    return this.mustGet(id);
  }

  private async mustGet(id: string): Promise<Payment> {
    const p = await this.repo.get(id);
    if (!p) throw new DomainError(`payment ${id} not found`);
    return p;
  }
}
