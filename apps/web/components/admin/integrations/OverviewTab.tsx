'use client';

import { StatusBadge } from '@/components/admin/integrations/StatusBadge';
import { INTEGRATIONS, FC26_DEPENDENCIES } from '@/lib/integrations/catalog';
import { computeStatus, type HealthWarning } from '@/lib/integrations/health';
import type { IntegrationInstance, IntegrationProviderType, IntegrationsState } from '@/lib/integrations/types';

const fdate = (iso?: string) => {
  if (!iso) return 'بررسی‌نشده';
  try {
    return new Date(iso).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 16);
  }
};

/** نمونه‌ی پیش‌فرض برای اتصالی که هنوز در state نیست (تا UI خالی نماند). */
function fallbackInst(type: IntegrationProviderType): IntegrationInstance {
  return { type, provider: '—', enabled: false, mockMode: true, settings: {}, secrets: {} };
}

const WARN_TONE: Record<HealthWarning['level'], { box: string; dot: string; label: string }> = {
  critical: { box: 'border-bad/30 bg-bad/[.07] text-[#fca5a5]', dot: 'bg-bad', label: 'بحرانی' },
  warning: { box: 'border-gold/30 bg-gold/[.07] text-gold', dot: 'bg-gold', label: 'هشدار' },
  production: { box: 'border-accent/30 bg-accent/[.07] text-[#5eead4]', dot: 'bg-accent', label: 'پروداکشن' },
};

// ───────── آیکن‌ها (inline SVG، بدون emoji) ─────────
const IconGear = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconPlay = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconCheck = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconArrow = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export interface OverviewTabProps {
  state: IntegrationsState;
  warnings: HealthWarning[];
  onSelect: (type: IntegrationProviderType) => void;
  onTest: (type: IntegrationProviderType) => void;
}

export function OverviewTab({ state, warnings, onSelect, onTest }: OverviewTabProps) {
  return (
    <div className="space-y-5">
      {/* ───────── ۱. هشدارهای سلامت ───────── */}
      <section className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 font-display text-sm font-bold">هشدارهای سلامت</h3>
        {warnings.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-good/30 bg-good/[.07] px-4 py-3 text-sm font-semibold text-good">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-good/15 text-good">{IconCheck}</span>
            همه‌ی سرویس‌ها سالم‌اند.
          </div>
        ) : (
          <ul className="space-y-2">
            {warnings.map((w, i) => {
              const t = WARN_TONE[w.level];
              return (
                <li key={i} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm leading-6 ${t.box}`}>
                  <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${t.dot}`} />
                  <span className="flex-1">{w.text}</span>
                  <span className={`flex-none rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-bold`}>{t.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ───────── ۲. نقشه‌ی اتصال‌ها ───────── */}
      <section className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 font-display text-sm font-bold">نقشه‌ی اتصال‌ها</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          {INTEGRATIONS.map((def) => {
            const inst = state.integrations[def.id] ?? fallbackInst(def.id);
            const status = computeStatus(inst);
            return (
              <div key={def.id} className="flex flex-col gap-3 rounded-xl border border-line bg-tile2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold">{def.label}</span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-faint">{inst.provider}</p>
                  </div>
                  <span className="flex-none text-[11px] text-faint">آخرین بررسی: {fdate(inst.lastCheckedAt)}</span>
                </div>

                {def.dependentFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {def.dependentFeatures.map((d) => (
                      <span key={d} className="chip border border-line bg-tile text-muted">{d}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-1">
                  <button onClick={() => onSelect(def.id)} className="btn-ghost px-3 py-1.5 text-xs">
                    {IconGear}
                    پیکربندی
                  </button>
                  <button onClick={() => onTest(def.id)} className="btn-ghost px-3 py-1.5 text-xs">
                    {IconPlay}
                    تست
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── ۳. وابستگی‌های سناریوی FC26 ───────── */}
      <section className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold">وابستگی‌های سناریوی FC26</h3>
          <span className="text-[11px] text-faint">سناریوی ۱۲۸ بازیکنه</span>
        </div>
        <div className="space-y-2.5">
          {FC26_DEPENDENCIES.map((dep) => {
            const parts = dep.types.map((type) => {
              const inst = state.integrations[type] ?? fallbackInst(type);
              return { type, status: computeStatus(inst) };
            });
            const hasGap = parts.some((p) => p.status === 'mock' || p.status === 'missing_config' || p.status === 'disabled' || p.status === 'error');
            const first = dep.types[0];
            return (
              <div
                key={dep.feature}
                className={`flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${
                  hasGap ? 'border-gold/25 bg-gold/[.04]' : 'border-good/25 bg-good/[.04]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{dep.feature}</span>
                    {hasGap ? (
                      <span className="chip border border-gold/40 bg-gold/15 text-gold">شکافِ پروداکشن</span>
                    ) : (
                      <span className="chip border border-good/40 bg-good/15 text-good">آماده‌ی پروداکشن</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {parts.map((p) => (
                      <span key={p.type} className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-muted">{INTEGRATION_LABEL[p.type]}</span>
                        <StatusBadge status={p.status} />
                      </span>
                    ))}
                  </div>
                  {hasGap && (
                    <p className="mt-2 text-[11px] leading-5 text-gold/90">
                      دستِ‌کم یک سرویسِ موردِنیاز در حالتِ آزمایشی یا ناقص است؛ تا اتصالِ واقعی این قابلیت در پروداکشن قابل‌اتکا نیست.
                    </p>
                  )}
                </div>
                <button onClick={() => onSelect(first)} className="btn-ghost flex-none px-3 py-1.5 text-xs">
                  {IconArrow}
                  پیکربندیِ {INTEGRATION_LABEL[first]}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const INTEGRATION_LABEL = Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.label])) as Record<IntegrationProviderType, string>;
