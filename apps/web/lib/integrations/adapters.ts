import { INTEGRATION_BY_ID } from '@/lib/integrations/catalog';
import type { IntegrationInstance, IntegrationTestResult } from '@/lib/integrations/types';

// adapterِ آزمایشی — ساختار واقعی است تا بعداً سرویسِ واقعی جای آن بنشیند.
// هر adapterِ واقعی فقط باید test() را پیاده کند و به همین قرارداد پاسخ دهد.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** تستِ اتصالِ mock با تأخیرِ شبیه‌سازی‌شده و نتیجه‌ی منطقی. */
export async function testIntegration(inst: IntegrationInstance): Promise<IntegrationTestResult> {
  const def = INTEGRATION_BY_ID[inst.type];
  const latency = 40 + (hash(inst.provider + inst.type) % 260);
  await new Promise((r) => setTimeout(r, Math.min(latency, 400)));
  const now = new Date().toISOString();

  if (!inst.enabled) return { integrationId: inst.type, status: 'skipped', message: 'اتصال غیرفعال است', checkedAt: now };
  if (inst.mockMode || inst.provider === def?.mockProvider)
    return { integrationId: inst.type, status: 'success', message: 'حالتِ آزمایشی — پاسخِ شبیه‌سازی‌شده سالم است', checkedAt: now, latencyMs: latency };

  const missing = (def?.fields ?? []).filter((f) => f.required).filter((f) => {
    const v = f.secret ? inst.secrets[f.key] : inst.settings[f.key];
    return v === undefined || v === '' || v === null;
  });
  if (missing.length)
    return { integrationId: inst.type, status: 'failed', message: `تنظیماتِ ناقص: ${missing.map((m) => m.label).join('، ')}`, checkedAt: now, latencyMs: latency };

  return { integrationId: inst.type, status: 'success', message: `اتصال به ${inst.provider} برقرار شد`, checkedAt: now, latencyMs: latency };
}
