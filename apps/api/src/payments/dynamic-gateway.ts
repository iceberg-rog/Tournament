import { randomUUID } from 'node:crypto';
import {
  PaymentGateway,
  SandboxGateway,
  SettingsService,
  ZarinpalGateway,
} from '@tournament/core';

/**
 * در هر فراخوانی، درگاه را بر اساس تنظیماتِ زنده‌ی مدیریت انتخاب می‌کند:
 * sandbox=true یا نبودِ merchantId → SandboxGateway، در غیر این صورت زرین‌پال واقعی.
 */
export class DynamicPaymentGateway implements PaymentGateway {
  constructor(private readonly settings: SettingsService) {}

  private async pick(): Promise<PaymentGateway> {
    const s = await this.settings.get();
    if (s.payment.sandbox || !s.payment.merchantId) {
      return new SandboxGateway(() => randomUUID());
    }
    return new ZarinpalGateway(s.payment.merchantId, s.payment.callbackUrl, false);
  }

  async request(amount: number, description: string): Promise<{ authority: string; redirectUrl: string }> {
    return (await this.pick()).request(amount, description);
  }

  async verify(authority: string, amount?: number): Promise<{ ok: boolean; ref?: string }> {
    return (await this.pick()).verify(authority, amount);
  }
}
