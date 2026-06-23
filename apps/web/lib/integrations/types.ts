// مدلِ دادهٔ «تنظیماتِ اتصال‌ها و APIها».

export type IntegrationStatus = 'connected' | 'mock' | 'missing_config' | 'error' | 'disabled';
export type IntegrationEnvironment = 'development' | 'staging' | 'production';
export type IntegrationProviderType =
  | 'notification'
  | 'email'
  | 'sms'
  | 'chat'
  | 'storage'
  | 'payment'
  | 'wallet'
  | 'kyc'
  | 'jobs'
  | 'webhooks'
  | 'moderation'
  | 'analytics';

export const STATUS_FA: Record<IntegrationStatus, string> = {
  connected: 'متصل',
  mock: 'حالتِ آزمایشی',
  missing_config: 'تنظیماتِ ناقص',
  error: 'خطا',
  disabled: 'غیرفعال',
};
export const STATUS_TONE: Record<IntegrationStatus, 'good' | 'gold' | 'bad' | 'muted' | 'accent'> = {
  connected: 'good',
  mock: 'accent',
  missing_config: 'gold',
  error: 'bad',
  disabled: 'muted',
};
export const ENV_FA: Record<IntegrationEnvironment, string> = {
  development: 'توسعه',
  staging: 'استیجینگ',
  production: 'پروداکشن',
};

// ───────── کاتالوگ (تعریفِ هر اتصال) ─────────
export type FieldKind = 'text' | 'password' | 'number' | 'select' | 'toggle' | 'textarea';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  secret?: boolean;
  placeholder?: string;
  help?: string;
  advanced?: boolean;
  required?: boolean; // برای production لازم است
  defaultValue?: string | number | boolean;
}
export interface IntegrationDef {
  id: IntegrationProviderType;
  label: string;
  description: string;
  providers: { value: string; label: string }[];
  mockProvider: string;
  fields: FieldDef[];
  requiredEnvs: string[];
  dependentFeatures: string[];
  /** فهرست‌های قابلِ‌تنظیم (مثلِ eventهای نوتیفیکیشن یا jobهای زمان‌بند). */
  toggleList?: { key: string; label: string }[];
  toggleListTitle?: string;
}

// ───────── نمونه‌ی ذخیره‌شده‌ی هر اتصال ─────────
export interface IntegrationInstance {
  type: IntegrationProviderType;
  provider: string;
  enabled: boolean;
  mockMode: boolean;
  settings: Record<string, unknown>;
  secrets: Record<string, string>;
  toggles?: Record<string, boolean>;
  lastCheckedAt?: string;
  lastError?: string;
  lastTest?: IntegrationTestResult;
}

export interface IntegrationTestResult {
  integrationId: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  checkedAt: string;
  latencyMs?: number;
}

export interface FeatureFlagDef {
  key: string;
  label: string;
  description: string;
  dependsOn?: IntegrationProviderType[];
}
export interface EnvVarDef {
  name: string;
  description: string;
  requiredInProduction: boolean;
  example: string;
  type: IntegrationProviderType;
  secret?: boolean;
}

export interface IntegrationsState {
  environment: IntegrationEnvironment;
  integrations: Record<string, IntegrationInstance>;
  flags: Record<string, boolean>;
}

// ───────── الگوی adapter (برای اتصالِ بعدیِ بک‌اندِ واقعی) ─────────
export interface IntegrationAdapter {
  test(instance: IntegrationInstance): Promise<IntegrationTestResult>;
}
