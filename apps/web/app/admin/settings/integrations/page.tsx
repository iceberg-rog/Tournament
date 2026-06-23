'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { useAdminRole, useEnsureAdminRole } from '@/lib/admin/store';
import { ADMIN_ROLE_FA, type AdminRole } from '@/lib/admin/ops';
import { useIntegrations } from '@/lib/integrations/useIntegrations';
import { computeStatus, featureWarnings, summarize } from '@/lib/integrations/health';
import { INTEGRATIONS, ENV_VARS } from '@/lib/integrations/catalog';
import { ENV_FA, type IntegrationEnvironment, type IntegrationProviderType } from '@/lib/integrations/types';
import { IntegrationTab } from '@/components/admin/integrations/IntegrationTab';
import { OverviewTab } from '@/components/admin/integrations/OverviewTab';
import { FeatureFlagsTab } from '@/components/admin/integrations/FeatureFlagsTab';
import { EnvVarsTab } from '@/components/admin/integrations/EnvVarsTab';
import { AuditTab } from '@/components/admin/integrations/AuditTab';

type TabDef = { key: string; label: string; kind: 'overview' | 'service' | 'flags' | 'env' | 'audit'; type?: IntegrationProviderType };

const TABS: TabDef[] = [
  { key: 'overview', label: 'نمای کلی', kind: 'overview' },
  ...INTEGRATIONS.map((d) => ({ key: d.id, label: d.label, kind: 'service' as const, type: d.id })),
  { key: 'flags', label: 'Feature Flags', kind: 'flags' },
  { key: 'env', label: 'متغیرهای محیطی', kind: 'env' },
  { key: 'audit', label: 'گزارشِ ممیزی', kind: 'audit' },
];

const FINANCE_TABS = new Set(['overview', 'payment', 'wallet', 'env', 'audit']);

function Console({ role }: { role: AdminRole }) {
  const [env, setEnv] = useState<IntegrationEnvironment>('development');
  const it = useIntegrations(env);
  const [tab, setTab] = useState('overview');

  const canWrite = role === 'super_admin';
  const canSeeSecrets = role === 'super_admin';
  const tabs = role === 'finance_admin' ? TABS.filter((t) => FINANCE_TABS.has(t.key)) : TABS;

  const sum = useMemo(() => summarize(it.state), [it.state]);
  const warnings = useMemo(() => featureWarnings(it.state), [it.state]);
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];

  function exportEnv() {
    const txt = ENV_VARS.map((v) => `# ${v.description}\n${v.name}=${v.secret ? '' : v.example}`).join('\n');
    navigator.clipboard?.writeText(txt);
  }

  const fdate = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—');

  const cards = [
    { label: 'متصل', value: sum.connected, tone: 'text-good' },
    { label: 'حالتِ آزمایشی', value: sum.mock, tone: 'text-accent' },
    { label: 'تنظیماتِ ناقص', value: sum.missing, tone: 'text-gold' },
    { label: 'خطا', value: sum.error, tone: 'text-bad' },
    { label: 'آخرین اعتبارسنجی', value: -1, tone: '', text: fdate(it.lastValidated) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="تنظیماتِ اتصال‌ها و APIها"
        subtitle="مدیریتِ سرویس‌های خارجیِ موردنیاز برای اعلان، پرداخت، احرازِ هویت، چت، آپلودِ مدارک و کارهای خودکار."
        actions={
          <>
            <select value={env} onChange={(e) => setEnv(e.target.value as IntegrationEnvironment)} className="rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim">
              {(Object.keys(ENV_FA) as IntegrationEnvironment[]).map((e) => <option key={e} value={e}>{ENV_FA[e]}</option>)}
            </select>
            <button onClick={it.testAll} disabled={!canWrite} className="btn-ghost px-3 py-2 text-sm disabled:opacity-50">تستِ همه</button>
            <button onClick={exportEnv} className="btn-ghost px-3 py-2 text-sm">کپیِ env</button>
            {canWrite && <button onClick={it.save} className="btn-primary px-4 py-2 text-sm">ذخیره</button>}
          </>
        }
      />

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-tile p-4">
            <p className="text-[11px] text-faint">{c.label}</p>
            <p className={`mt-1 font-display text-xl font-bold tnum ${c.tone}`}>{c.text ?? c.value.toLocaleString('fa-IR')}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
        {/* tab rail */}
        <nav className="hscroll flex gap-1 overflow-x-auto rounded-2xl border border-line bg-tile p-2 lg:flex-col lg:overflow-visible">
          {tabs.map((t) => {
            const activeTab = tab === t.key;
            const st = t.kind === 'service' && t.type ? computeStatus(it.state.integrations[t.type]) : null;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-medium transition ${activeTab ? 'bg-accent/15 text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,.3)]' : 'text-muted hover:bg-white/[.04] hover:text-white'}`}
              >
                {t.label}
                {st && <span className={`h-1.5 w-1.5 flex-none rounded-full ${st === 'connected' ? 'bg-good' : st === 'error' ? 'bg-bad' : st === 'missing_config' ? 'bg-gold' : st === 'disabled' ? 'bg-slate-600' : 'bg-accent'}`} />}
              </button>
            );
          })}
        </nav>

        {/* content */}
        <div className="min-w-0">
          {it.loading ? (
            <div className="py-20 text-center text-sm text-muted">در حال بارگذاری…</div>
          ) : active.kind === 'overview' ? (
            <OverviewTab state={it.state} warnings={warnings} onSelect={(type) => setTab(type)} onTest={(type) => it.testOne(type)} />
          ) : active.kind === 'flags' ? (
            <FeatureFlagsTab state={it.state} canWrite={canWrite} onToggle={it.setFlag} />
          ) : active.kind === 'env' ? (
            <EnvVarsTab state={it.state} canSeeSecrets={canSeeSecrets} />
          ) : active.kind === 'audit' ? (
            <AuditTab env={env} />
          ) : active.type ? (
            <IntegrationTab
              def={INTEGRATIONS.find((d) => d.id === active.type)!}
              inst={it.state.integrations[active.type]}
              status={computeStatus(it.state.integrations[active.type])}
              canWrite={canWrite}
              canSeeSecrets={canSeeSecrets}
              testing={it.testing === active.type}
              dirty={it.dirty}
              onProvider={(v) => it.setInstance(active.type!, { provider: v })}
              onToggleEnabled={(v) => it.setInstance(active.type!, { enabled: v })}
              onToggleMock={(v) => it.setInstance(active.type!, { mockMode: v })}
              onField={(k, v, s) => it.setField(active.type!, k, v, s)}
              onToggleList={(k, v) => it.setToggle(active.type!, k, v)}
              onTest={() => it.testOne(active.type!)}
              onSave={it.save}
              onReset={() => it.resetMock(active.type!)}
              onReveal={(k) => it.revealSecret(active.type!, k)}
              onRotate={(k) => it.rotateSecret(active.type!, k)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  useEnsureAdminRole();
  const role = useAdminRole();

  if (role === 'moderator')
    return (
      <AdminGuard>
        <div className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <p className="text-lg font-bold">دسترسی نداری</p>
            <p className="mt-1 text-sm text-faint">این بخش فقط برای مدیرِ کل، مدیرِ مالی، پشتیبان و مدیرِ تورنومنت است. نقشِ فعلی: {ADMIN_ROLE_FA[role]}</p>
            <Link href="/admin" className="btn-ghost mt-4 px-4 py-2 text-sm">بازگشت</Link>
          </div>
        </div>
      </AdminGuard>
    );

  return (
    <AdminGuard>
      <Console role={role} />
    </AdminGuard>
  );
}
