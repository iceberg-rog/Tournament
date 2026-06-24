/**
 * adapterهای تحویلِ اعلان. in-app واقعی است؛ email/sms/push آماده‌ی adapter
 * هستند (mock با وضعیتِ تحویل). در پروداکشن با سرویسِ واقعی جایگزین می‌شوند.
 */
export type DeliveryChannel = 'in_app' | 'email' | 'sms' | 'push' | 'chat';

export interface DeliveryPayload {
  userId?: string | null;
  title: string;
  body: string;
  type: string;
}
export interface DeliveryResult {
  ok: boolean;
  error?: string;
}

export interface DeliveryAdapter {
  readonly channel: DeliveryChannel;
  send(payload: DeliveryPayload): Promise<DeliveryResult>;
}

/** in-app — همیشه موفق (فقط در DB ثبت می‌شود). */
export class InAppAdapter implements DeliveryAdapter {
  readonly channel = 'in_app' as const;
  async send(): Promise<DeliveryResult> {
    return { ok: true };
  }
}

/** mock — اگر گیرنده نداشته باشد، شکست می‌خورد (برای آزمونِ مسیرِ failed/retry). */
class MockChannelAdapter implements DeliveryAdapter {
  constructor(readonly channel: DeliveryChannel) {}
  async send(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (this.channel !== 'chat' && !payload.userId) return { ok: false, error: 'no recipient' };
    return { ok: true };
  }
}

export class EmailAdapter extends MockChannelAdapter {
  constructor() {
    super('email');
  }
}
export class SmsAdapter extends MockChannelAdapter {
  constructor() {
    super('sms');
  }
}
export class PushAdapter extends MockChannelAdapter {
  constructor() {
    super('push');
  }
}
export class ChatAdapter extends MockChannelAdapter {
  constructor() {
    super('chat');
  }
}

/** انتخابِ adapter بر اساسِ کانال. */
export class DeliveryDispatcher {
  private readonly adapters: Record<DeliveryChannel, DeliveryAdapter>;
  constructor() {
    this.adapters = {
      in_app: new InAppAdapter(),
      email: new EmailAdapter(),
      sms: new SmsAdapter(),
      push: new PushAdapter(),
      chat: new ChatAdapter(),
    };
  }
  dispatch(channel: DeliveryChannel, payload: DeliveryPayload): Promise<DeliveryResult> {
    return (this.adapters[channel] ?? this.adapters.in_app).send(payload);
  }
}

export const DELIVERY_DISPATCHER = 'DELIVERY_DISPATCHER';
