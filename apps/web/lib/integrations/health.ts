import { INTEGRATION_BY_ID } from '@/lib/integrations/catalog';
import type { IntegrationInstance, IntegrationStatus, IntegrationsState, IntegrationProviderType } from '@/lib/integrations/types';

/** وضعیتِ سلامتِ یک اتصال طبقِ قوانینِ health. */
export function computeStatus(inst: IntegrationInstance): IntegrationStatus {
  const def = INTEGRATION_BY_ID[inst.type];
  if (!inst.enabled) return 'disabled';
  if (inst.mockMode || inst.provider === def?.mockProvider) return 'mock';
  const missing = (def?.fields ?? []).some((f) => {
    if (!f.required) return false;
    const v = f.secret ? inst.secrets[f.key] : inst.settings[f.key];
    return v === undefined || v === '' || v === null;
  });
  if (missing) return 'missing_config';
  if (inst.lastTest?.status === 'failed') return 'error';
  if (inst.lastTest?.status === 'success') return 'connected';
  return 'mock'; // پیکربندی‌شده ولی هنوز تست‌نشده
}

export interface HealthWarning {
  level: 'warning' | 'critical' | 'production';
  text: string;
}

function statusOf(state: IntegrationsState, type: IntegrationProviderType): IntegrationStatus {
  const inst = state.integrations[type];
  return inst ? computeStatus(inst) : 'missing_config';
}
const bad = (s: IntegrationStatus) => s === 'missing_config' || s === 'error' || s === 'disabled';

/** هشدارهای سطحِ ویژگی/محیط. */
export function featureWarnings(state: IntegrationsState): HealthWarning[] {
  const out: HealthWarning[] = [];
  const f = state.flags;

  if (state.environment === 'production') {
    const mocks = Object.values(state.integrations).filter((i) => computeStatus(i) === 'mock');
    if (mocks.length) out.push({ level: 'production', text: `در محیطِ پروداکشن ${mocks.length.toLocaleString('fa-IR')} سرویس در حالتِ آزمایشی است.` });
  }
  if (f.enable_payment_gateway && bad(statusOf(state, 'webhooks'))) out.push({ level: 'critical', text: 'درگاهِ پرداخت فعال است ولی Webhook (کلیدِ امضا) آماده نیست.' });
  if (f.enable_payouts && (bad(statusOf(state, 'kyc')) || !f.enable_kyc)) out.push({ level: 'warning', text: 'پرداختِ جوایز فعال است ولی KYC غیرفعال/ناقص است.' });
  if (f.enable_evidence_upload && bad(statusOf(state, 'storage'))) out.push({ level: 'critical', text: 'آپلودِ مدرک فعال است ولی فضای ذخیره آماده نیست.' });
  if (f.enable_auto_no_show && (bad(statusOf(state, 'jobs')) || !f.enable_background_jobs)) out.push({ level: 'critical', text: 'عدمِ حضورِ خودکار فعال است ولی کارهای پس‌زمینه آماده نیست.' });

  // هر flag روشن ولی وابستگیِ ناقص
  // (در FeatureFlags tab به‌صورتِ ردیفی هم نشان داده می‌شود)
  return out;
}

export function summarize(state: IntegrationsState) {
  const list = Object.values(state.integrations).map(computeStatus);
  return {
    connected: list.filter((s) => s === 'connected').length,
    mock: list.filter((s) => s === 'mock').length,
    missing: list.filter((s) => s === 'missing_config').length,
    error: list.filter((s) => s === 'error').length,
    disabled: list.filter((s) => s === 'disabled').length,
    total: list.length,
  };
}
