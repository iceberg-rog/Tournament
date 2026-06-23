'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { apiGet, isLoggedIn } from '@/lib/api';
import { roleGroup } from '@/lib/roles';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  ADMIN_KPIS,
  ADMIN_QUEUE,
  QUEUE_META,
  RECENT_ACTIVITY,
  SYSTEM_HEALTH,
  TOURNAMENT_STATUS_META,
  fmt,
  money,
  todayOps,
} from '@/lib/admin';

const PATHS: Record<string, ReactNode> = {
  trophy: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  inbox: <><path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M4 13h5l1.5 2.5h3L19 13" /></>,
  ticket: <><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></>,
  idcard: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16a3 3 0 0 1 6 0M14 9.5h4M14 13h3" /></>,
  arrow: <path d="M19 12H5M11 18l-6-6 6-6" />,
};
const Ico = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
);

function OpsList({ title, items }: { title: string; items: { id: string; title: string; status: string }[] }) {
  return (
    <div className="rounded-xl border border-line bg-tile2 p-3">
      <p className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">{title}<span className="tnum text-faint">{fmt(items.length)}</span></p>
      <div className="space-y-1.5">
        {items.length ? items.map((t) => (
          <Link key={t.id} href="/admin/tournaments" className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-white/[.04]">
            <span className="min-w-0 flex-1 truncate">{t.title}</span>
            <AdminBadge label={TOURNAMENT_STATUS_META[t.status as keyof typeof TOURNAMENT_STATUS_META]?.label ?? t.status} tone={TOURNAMENT_STATUS_META[t.status as keyof typeof TOURNAMENT_STATUS_META]?.tone ?? 'muted'} />
          </Link>
        )) : <p className="px-2 py-2 text-xs text-faint">موردی نیست</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { setAllowed(false); return; }
    apiGet<{ role: string }>('/users/me')
      .then((m) => setAllowed(roleGroup(m.role) === 'admin'))
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div className="py-20 text-center text-sm text-muted">در حال بارگذاری…</div>;
  if (!allowed)
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="text-lg font-bold">دسترسی نداری</p>
          <p className="mt-1 text-sm text-faint">این بخش فقط برای مدیرانِ SHELTER است.</p>
          <Link href="/dashboard" className="btn-ghost mt-4 px-4 py-2 text-sm">بازگشت به داشبورد</Link>
        </div>
      </div>
    );

  const ops = todayOps();

  return (
    <div className="space-y-5">
      <PageHeader
        title="داشبوردِ مدیریت"
        subtitle="نمای کلیِ عملیاتِ پلتفرم — امروز چه کاری باید انجام شود."
        actions={<Link href="/admin/queue" className="btn-primary px-4 py-2 text-sm">صفِ اقدامات</Link>}
      />

      {/* KPI */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ADMIN_KPIS.map((k) => (
          <div key={k.key} className="rounded-2xl border border-line bg-tile p-4">
            <p className="text-[11px] text-faint">{k.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold tnum ${k.tone === 'gold' ? 'text-gold' : k.tone === 'bad' ? 'text-[#fca5a5]' : k.tone === 'accent' ? 'text-accent' : ''}`}>
              {k.money ? money(k.value) : fmt(k.value)}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Action Queue */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">صفِ اقدامات</h2>
            <Link href="/admin/queue" className="text-xs font-semibold text-accent">همه</Link>
          </div>
          <div className="space-y-2">
            {ADMIN_QUEUE.map((q) => {
              const m = QUEUE_META[q.kind];
              return (
                <div key={q.id} className="flex items-center gap-3 rounded-xl border border-line bg-tile2 p-3">
                  <span className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${q.urgent ? 'bg-bad/15 text-[#fca5a5]' : 'bg-accent/10 text-accent'}`}><Ico name={m.icon} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{q.title}</p>
                    <p className="truncate text-[11px] text-faint">{m.label} · {q.meta}</p>
                  </div>
                  {q.urgent && <AdminBadge label="فوری" tone="bad" />}
                  <Link href={m.href} className="btn-ghost flex-none px-3 py-1.5 text-xs">بررسی</Link>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          {/* Recent Activity */}
          <section className="rounded-2xl border border-line bg-tile p-5">
            <h2 className="mb-3 font-display text-lg font-bold">فعالیتِ اخیر</h2>
            <ul className="space-y-2">
              {RECENT_ACTIVITY.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${a.tone === 'gold' ? 'bg-gold' : a.tone === 'bad' ? 'bg-bad' : a.tone === 'good' ? 'bg-good' : a.tone === 'accent' ? 'bg-accent' : 'bg-slate-500'}`} />
                  <span className="text-slate-200">{a.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* System Health */}
          <section className="rounded-2xl border border-line bg-tile p-5">
            <h2 className="mb-3 font-display text-lg font-bold">سلامتِ سیستم</h2>
            <ul className="space-y-2">
              {SYSTEM_HEALTH.map((h) => (
                <li key={h.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${h.ok ? 'bg-good' : 'bg-bad animate-pulse'}`} />
                    {h.label}
                  </span>
                  <span className="text-xs text-faint">{h.note}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Today Operations */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">عملیاتِ امروز</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OpsList title="شروعِ امروز" items={ops.startingToday} />
          <OpsList title="مسابقاتِ زنده" items={ops.live} />
          <OpsList title="در انتظارِ تأیید" items={ops.pendingApproval} />
          <OpsList title="در انتظارِ پرداخت" items={ops.payoutPending} />
        </div>
      </section>
    </div>
  );
}
