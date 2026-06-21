/** تنظیمات پایه‌ی پلتفرم — درگاه پرداخت، پیامک، OAuth و عمومی. */
export interface PlatformSettings {
  general: { siteName: string; currency: string };
  payment: { provider: string; merchantId: string; callbackUrl: string; sandbox: boolean };
  sms: { provider: string; apiKey: string; senderLine: string };
  oauth: { googleClientId: string; discordClientId: string };
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  general: { siteName: 'Tournament', currency: 'IRR' },
  payment: { provider: 'zarinpal', merchantId: '', callbackUrl: '', sandbox: true },
  sms: { provider: '', apiKey: '', senderLine: '' },
  oauth: { googleClientId: '', discordClientId: '' },
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface SettingsRepository {
  load(): Promise<Partial<PlatformSettings> | null>;
  save(s: PlatformSettings): Promise<void>;
}

export class InMemorySettingsRepository implements SettingsRepository {
  private stored: PlatformSettings | null = null;
  async load(): Promise<Partial<PlatformSettings> | null> {
    return this.stored ? structuredClone(this.stored) : null;
  }
  async save(s: PlatformSettings): Promise<void> {
    this.stored = structuredClone(s);
  }
}

/** ادغام عمیق (فقط آبجکت‌های ساده؛ مقادیر undefined نادیده گرفته می‌شوند). */
function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === null || typeof patch !== 'object') return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, pv] of Object.entries(patch as Record<string, unknown>)) {
    const bv = (base as Record<string, unknown>)?.[k];
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object') {
      out[k] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[k] = pv;
    }
  }
  return out as T;
}

/** سرویس تنظیمات پلتفرم (تنظیماتِ ذخیره‌شده روی پیش‌فرض‌ها merge می‌شوند). */
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async get(): Promise<PlatformSettings> {
    const stored = await this.repo.load();
    return deepMerge(DEFAULT_SETTINGS, stored ?? {});
  }

  async update(patch: DeepPartial<PlatformSettings>): Promise<PlatformSettings> {
    const merged = deepMerge(await this.get(), patch);
    await this.repo.save(merged);
    return merged;
  }
}
