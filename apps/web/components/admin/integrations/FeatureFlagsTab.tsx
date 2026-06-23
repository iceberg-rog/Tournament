'use client';

import { StatusBadge } from '@/components/admin/integrations/StatusBadge';
import { FEATURE_FLAGS, INTEGRATION_BY_ID } from '@/lib/integrations/catalog';
import { computeStatus } from '@/lib/integrations/health';
import type { IntegrationProviderType, IntegrationStatus, IntegrationsState } from '@/lib/integrations/types';

export interface FeatureFlagsTabProps {
  state: IntegrationsState;
  canWrite: boolean;
  onToggle: (key: string, value: boolean) => void;
}

/** وضعیتِ یک وابستگی؛ نبودِ نمونه = تنظیماتِ ناقص (هم‌سو با health.ts). */
function depStatus(state: IntegrationsState, type: IntegrationProviderType): IntegrationStatus {
  const inst = state.integrations[type];
  return inst ? computeStatus(inst) : 'missing_config';
}

const notReady = (s: IntegrationStatus) => s === 'missing_config' || s === 'error' || s === 'disabled';

function Switch({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-accent/50 bg-accent/30' : 'border-line bg-tile2'}`}
    >
      <span
        className={`absolute top-0.5 rounded-full bg-white transition-all ${checked ? 'start-0.5' : 'end-0.5'}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

function WarnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-none">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function FeatureFlagsTab({ state, canWrite, onToggle }: FeatureFlagsTabProps) {
  const onCount = FEATURE_FLAGS.filter((f) => !!state.flags[f.key]).length;
  const unmetCount = FEATURE_FLAGS.filter((f) => {
    if (!state.flags[f.key] || !f.dependsOn?.length) return false;
    return f.dependsOn.some((t) => notReady(depStatus(state, t)));
  }).length;

  return (
    <div className="space-y-5">
      {/* head / note */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold">پرچم‌های قابلیت</h2>
            <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">
              این پرچم‌ها قابلیت‌های محصول را روشن یا خاموش می‌کنند. توجه: برخی قابلیت‌ها هنوز بک‌اندِ پروداکشن ندارند —
              روشن‌کردنِ پرچم به‌تنهایی به‌معنای آماده‌بودنِ سرویسِ پشتیبان نیست. وضعیتِ وابستگیِ هر قابلیت در همان ردیف نشان داده می‌شود.
            </p>
          </div>
          <div className="flex flex-none flex-wrap items-center gap-2">
            <span className="chip border border-line bg-tile2 text-muted">
              <span className="tnum text-text">{onCount.toLocaleString('fa-IR')}</span>
              <span className="text-faint">/</span>
              <span className="tnum">{FEATURE_FLAGS.length.toLocaleString('fa-IR')}</span>
              روشن
            </span>
            {unmetCount > 0 && (
              <span className="chip border border-bad/40 bg-bad/15 text-[#fca5a5]">
                <WarnIcon />
                {unmetCount.toLocaleString('fa-IR')} وابستگیِ ناآماده
              </span>
            )}
          </div>
        </div>
        {!canWrite && <p className="mt-3 text-xs text-faint">فقط مدیرِ کل می‌تواند پرچم‌ها را تغییر دهد.</p>}
      </div>

      {/* flag rows */}
      <div className="space-y-3">
        {FEATURE_FLAGS.map((flag) => {
          const on = !!state.flags[flag.key];
          const deps = flag.dependsOn ?? [];
          const unmet = on && deps.some((t) => notReady(depStatus(state, t)));

          return (
            <div
              key={flag.key}
              className={`rounded-2xl border bg-tile p-4 transition ${unmet ? 'border-bad/40' : 'border-line'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-bold">{flag.label}</h3>
                    <span className="font-mono text-[10px] text-faint">{flag.key}</span>
                  </div>
                  <p className="mt-1 text-xs leading-6 text-muted">{flag.description}</p>
                </div>
                <Switch checked={on} disabled={!canWrite} onChange={(v) => onToggle(flag.key, v)} label={flag.label} />
              </div>

              {/* dependsOn chips */}
              {deps.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-[11px] text-faint">وابسته به:</span>
                  {deps.map((type) => {
                    const def = INTEGRATION_BY_ID[type];
                    return (
                      <span key={type} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-tile2 px-2 py-0.5 text-[11px] text-muted">
                        {def?.label ?? type}
                        <StatusBadge status={depStatus(state, type)} />
                      </span>
                    );
                  })}
                </div>
              )}

              {/* unmet-dependency warning */}
              {unmet && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-[#fca5a5]">
                  <WarnIcon />
                  این قابلیت روشن است ولی وابستگی‌اش آماده نیست.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {FEATURE_FLAGS.length === 0 && (
        <div className="rounded-2xl border border-line bg-tile p-8 text-center text-sm text-faint">
          هیچ پرچمِ قابلیتی تعریف نشده است.
        </div>
      )}
    </div>
  );
}
