'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/admin/integrations/StatusBadge';
import { SecretInput } from '@/components/admin/integrations/SecretInput';
import type { FieldDef, IntegrationDef, IntegrationInstance, IntegrationStatus } from '@/lib/integrations/types';

const fdate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 16);
  }
};

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none rounded-full border transition disabled:opacity-50 ${checked ? 'border-accent/50 bg-accent/30' : 'border-line bg-tile2'}`}
    >
      <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${checked ? 'start-0.5' : 'end-0.5'}`} style={{ height: 18, width: 18 }} />
    </button>
  );
}

export interface IntegrationTabProps {
  def: IntegrationDef;
  inst: IntegrationInstance;
  status: IntegrationStatus;
  canWrite: boolean;
  canSeeSecrets: boolean;
  testing: boolean;
  dirty: boolean;
  onProvider: (v: string) => void;
  onToggleEnabled: (v: boolean) => void;
  onToggleMock: (v: boolean) => void;
  onField: (key: string, value: unknown, secret?: boolean) => void;
  onToggleList: (key: string, value: boolean) => void;
  onTest: () => void;
  onSave: () => void;
  onReset: () => void;
  onReveal: (key: string) => void;
  onRotate: (key: string) => void;
}

function FieldControl({ f, inst, p }: { f: FieldDef; inst: IntegrationInstance; p: IntegrationTabProps }) {
  const cls = 'w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim disabled:opacity-60';
  if (f.secret) {
    return (
      <SecretInput
        value={(inst.secrets[f.key] as string) ?? ''}
        onChange={(v) => p.onField(f.key, v, true)}
        canReveal={p.canSeeSecrets}
        onReveal={() => p.onReveal(f.key)}
        onRotate={p.canWrite ? () => p.onRotate(f.key) : undefined}
        disabled={!p.canWrite}
        placeholder={f.placeholder}
      />
    );
  }
  const val = inst.settings[f.key] ?? f.defaultValue;
  if (f.kind === 'toggle') return <Switch checked={!!val} disabled={!p.canWrite} onChange={(v) => p.onField(f.key, v)} />;
  if (f.kind === 'select')
    return (
      <select value={String(val ?? '')} disabled={!p.canWrite} onChange={(e) => p.onField(f.key, e.target.value)} className={cls}>
        {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  if (f.kind === 'textarea') return <textarea value={String(val ?? '')} disabled={!p.canWrite} rows={2} onChange={(e) => p.onField(f.key, e.target.value)} className={cls} placeholder={f.placeholder} />;
  return (
    <input
      type={f.kind === 'number' ? 'number' : 'text'}
      value={val === undefined ? '' : String(val)}
      disabled={!p.canWrite}
      onChange={(e) => p.onField(f.key, f.kind === 'number' ? Number(e.target.value) : e.target.value)}
      className={cls}
      placeholder={f.placeholder}
    />
  );
}

function FieldRow({ f, inst, p }: { f: FieldDef; inst: IntegrationInstance; p: IntegrationTabProps }) {
  return (
    <label className={`flex ${f.kind === 'toggle' ? 'items-center justify-between' : 'flex-col gap-1'}`}>
      <span className="flex items-center gap-1.5 text-xs text-faint">
        {f.label}
        {f.required && <span className="text-[#fca5a5]">*</span>}
        {f.secret && <span className="rounded bg-bad/15 px-1 text-[9px] text-[#fca5a5]">secret</span>}
      </span>
      <span className={f.kind === 'toggle' ? '' : 'block'}>
        <FieldControl f={f} inst={inst} p={p} />
      </span>
    </label>
  );
}

export function IntegrationTab(p: IntegrationTabProps) {
  const { def, inst, status } = p;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const basic = def.fields.filter((f) => !f.advanced);
  const advanced = def.fields.filter((f) => f.advanced);
  const res = inst.lastTest;

  return (
    <div className="space-y-5">
      {/* head */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h2 className="font-display text-lg font-bold">{def.label}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted">{def.description}</p>
          </div>
          <span className="text-[11px] text-faint">آخرین بررسی: {fdate(inst.lastCheckedAt)}</span>
        </div>

        {inst.lastError && <div className="mt-3 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-[#fca5a5]">{inst.lastError}</div>}

        {/* provider + toggles */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-faint">ارائه‌دهنده</span>
            <select value={inst.provider} disabled={!p.canWrite} onChange={(e) => p.onProvider(e.target.value)} className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim disabled:opacity-60">
              {def.providers.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between rounded-lg border border-line bg-tile2 px-3 py-2">
            <span className="text-xs text-faint">فعال</span>
            <Switch checked={inst.enabled} disabled={!p.canWrite} onChange={p.onToggleEnabled} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-line bg-tile2 px-3 py-2">
            <span className="text-xs text-faint">حالتِ آزمایشی (mock)</span>
            <Switch checked={inst.mockMode} disabled={!p.canWrite} onChange={p.onToggleMock} />
          </label>
        </div>
      </div>

      {/* basic fields */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 font-display text-sm font-bold">پیکربندی</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {basic.map((f) => <FieldRow key={f.key} f={f} inst={inst} p={p} />)}
        </div>

        {advanced.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <button onClick={() => setShowAdvanced((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`transition ${showAdvanced ? 'rotate-90' : ''}`}><path d="M9 6l6 6-6 6" /></svg>
              تنظیماتِ پیشرفته ({advanced.length.toLocaleString('fa-IR')})
            </button>
            {showAdvanced && <div className="mt-3 grid gap-3 sm:grid-cols-2">{advanced.map((f) => <FieldRow key={f.key} f={f} inst={inst} p={p} />)}</div>}
          </div>
        )}
      </div>

      {/* toggle list (events / jobs) */}
      {def.toggleList && (
        <div className="rounded-2xl border border-line bg-tile p-5">
          <h3 className="mb-3 font-display text-sm font-bold">{def.toggleListTitle}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {def.toggleList.map((t) => (
              <label key={t.key} className="flex items-center justify-between rounded-lg border border-line bg-tile2 px-3 py-2 text-sm">
                <span>{t.label}</span>
                <Switch checked={inst.toggles?.[t.key] ?? false} disabled={!p.canWrite} onChange={(v) => p.onToggleList(t.key, v)} />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* deps + envs */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-tile p-4">
          <p className="mb-2 text-xs font-semibold text-muted">قابلیت‌های وابسته</p>
          <div className="flex flex-wrap gap-1.5">{def.dependentFeatures.map((d) => <span key={d} className="chip border border-line bg-tile2 text-muted">{d}</span>)}</div>
        </div>
        <div className="rounded-2xl border border-line bg-tile p-4">
          <p className="mb-2 text-xs font-semibold text-muted">متغیرهای محیطی</p>
          {def.requiredEnvs.length ? (
            <div className="flex flex-wrap gap-1.5">{def.requiredEnvs.map((e) => <span key={e} className="rounded border border-line bg-tile2 px-2 py-0.5 font-mono text-[11px] text-slate-300">{e}</span>)}</div>
          ) : <p className="text-xs text-faint">برای این سرویس env خارجی لازم نیست.</p>}
        </div>
      </div>

      {/* test result */}
      {res && (
        <div className={`rounded-2xl border p-4 text-sm ${res.status === 'failed' ? 'border-bad/30 bg-bad/[.06] text-[#fca5a5]' : res.status === 'skipped' ? 'border-line bg-tile2 text-muted' : 'border-good/30 bg-good/[.06] text-good'}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{res.message}</span>
            {res.latencyMs != null && <span className="tnum text-xs text-faint">{res.latencyMs.toLocaleString('fa-IR')}ms</span>}
          </div>
        </div>
      )}

      {/* footer actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={p.onTest} disabled={!p.canWrite || p.testing} className="btn-ghost px-4 py-2 text-sm disabled:opacity-50">
          {p.testing ? 'در حالِ تست…' : 'تستِ اتصال'}
        </button>
        <button onClick={p.onSave} disabled={!p.canWrite} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">ذخیره</button>
        <button onClick={p.onReset} disabled={!p.canWrite} className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:text-text disabled:opacity-50">بازنشانی به آزمایشی</button>
        {!p.canWrite && <span className="text-xs text-faint">فقط مدیرِ کل می‌تواند ویرایش کند.</span>}
        {p.dirty && p.canWrite && <span className="ms-auto text-xs text-gold">تغییراتِ ذخیره‌نشده</span>}
      </div>
    </div>
  );
}
