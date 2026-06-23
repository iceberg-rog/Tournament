'use client';

import { useMemo, useState } from 'react';
import { ENV_VARS, INTEGRATION_BY_ID } from '@/lib/integrations/catalog';
import type { EnvVarDef, IntegrationsState } from '@/lib/integrations/types';

const MASK = '••••';

type VarStatus = { label: string; tone: 'good' | 'gold' | 'muted' };

/** وضعیتِ هر متغیر طبقِ قراردادِ tab. */
function varStatus(v: EnvVarDef, state: IntegrationsState): VarStatus {
  if (v.secret) return { label: 'ماسک‌شده', tone: 'muted' };
  const inst = state.integrations[v.type];
  if (inst && inst.enabled && !inst.mockMode) return { label: 'موجود', tone: 'good' };
  return { label: 'غایب', tone: 'gold' };
}

const TONE: Record<VarStatus['tone'], string> = {
  good: 'border-good/40 bg-good/15 text-good',
  gold: 'border-gold/40 bg-gold/15 text-gold',
  muted: 'border-line bg-tile2 text-muted',
};

/** خطِ .env از نام و مقدارِ نمونه. secretها به‌جای مقدار، placeholder می‌گیرند. */
function envLine(v: EnvVarDef): string {
  const val = v.secret ? '' : v.example;
  return `${v.name}=${val}`;
}

function buildEnvFile(): string {
  return ENV_VARS.map(envLine).join('\n') + '\n';
}

export function EnvVarsTab({ state, canSeeSecrets }: { state: IntegrationsState; canSeeSecrets: boolean }) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENV_VARS;
    return ENV_VARS.filter((v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
  }, [query]);

  const flash = (id: string) => {
    setCopied(id);
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(id);
    } catch {
      /* clipboard مسدود است؛ بی‌صدا رد می‌شویم */
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildEnvFile()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.example';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const requiredCount = ENV_VARS.filter((v) => v.requiredInProduction).length;

  return (
    <div className="space-y-5">
      {/* head */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="mb-1 font-display text-lg font-bold">متغیرهای محیطی</h2>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              فهرستِ کاملِ متغیرهای محیطیِ موردِنیازِ سرویس‌ها. مقادیرِ محرمانه ماسک‌شده‌اند؛ نمایش و چرخشِ کلید در جای دیگری ثبت و ممیزی می‌شود.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => copy(buildEnvFile(), '__envfile')} className="btn-ghost px-4 py-2 text-sm">
              {copied === '__envfile' ? (
                <span className="flex items-center gap-1.5 text-good">
                  <CheckIcon /> کپی شد
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CopyIcon /> کپیِ .env.example
                </span>
              )}
            </button>
            <button onClick={downloadTemplate} className="btn-primary px-4 py-2 text-sm">
              <span className="flex items-center gap-1.5">
                <DownloadIcon /> دانلودِ قالب
              </span>
            </button>
          </div>
        </div>

        {/* stats + search */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="chip border border-line bg-tile2 text-muted tnum">
            مجموع: {ENV_VARS.length.toLocaleString('fa-IR')}
          </span>
          <span className="chip border border-gold/40 bg-gold/15 text-gold tnum">
            لازم در پروداکشن: {requiredCount.toLocaleString('fa-IR')}
          </span>
          <label className="relative ms-auto block w-full max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-faint">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی نام یا توضیح…"
              className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="پاک‌کردنِ جست‌وجو"
                className="absolute inset-y-0 end-2 flex items-center text-faint hover:text-text"
              >
                <CloseIcon />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-tile">
        <div className="hscroll">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs text-faint">
                <th className="px-4 py-3 text-start font-semibold">نام</th>
                <th className="px-4 py-3 text-start font-semibold">توضیح</th>
                <th className="px-4 py-3 text-start font-semibold">نوع</th>
                <th className="px-4 py-3 text-start font-semibold">لازم در پروداکشن</th>
                <th className="px-4 py-3 text-start font-semibold">وضعیت</th>
                <th className="px-4 py-3 text-start font-semibold">مقدارِ نمونه</th>
                <th className="px-4 py-3 text-start font-semibold">کپی</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const st = varStatus(v, state);
                const typeLabel = INTEGRATION_BY_ID[v.type]?.label ?? v.type;
                const showValue = !v.secret || canSeeSecrets;
                const sample = showValue ? v.example : MASK;
                return (
                  <tr key={v.name} className="border-b border-line/60 last:border-b-0 transition hover:bg-white/[.02]">
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono text-[12.5px] text-slate-200">{v.name}</span>
                      {v.secret && (
                        <span className="ms-2 rounded bg-bad/15 px-1 text-[9px] text-[#fca5a5] align-middle">secret</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-muted">{v.description}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="chip border border-line bg-tile2 text-muted whitespace-nowrap">{typeLabel}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {v.requiredInProduction ? (
                        <span className="chip border border-gold/40 bg-gold/15 text-gold">الزامی</span>
                      ) : (
                        <span className="chip border border-line bg-tile2 text-faint">اختیاری</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${TONE[st.tone]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`font-mono text-[12px] ${showValue ? 'text-faint' : 'text-muted tracking-widest'}`}>{sample}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => copy(v.name, v.name)}
                        aria-label={`کپیِ ${v.name}`}
                        title="کپیِ نام"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-tile2 text-faint transition hover:border-accent-dim hover:text-text"
                      >
                        {copied === v.name ? <CheckIcon className="text-good" /> : <CopyIcon />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="text-faint">
              <SearchIcon size={28} />
            </span>
            <p className="text-sm text-muted">متغیری با «{query}» یافت نشد.</p>
            <button onClick={() => setQuery('')} className="btn-ghost px-3 py-1.5 text-xs">
              پاک‌کردنِ جست‌وجو
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-faint">
        مقادیرِ محرمانه در قالبِ خروجی خالی گذاشته می‌شوند؛ آن‌ها را در محیطِ امن تنظیم کنید.
      </p>
    </div>
  );
}

/* ───────── icons (inline svg, no emoji) ───────── */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
