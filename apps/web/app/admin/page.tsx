'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { apiGet, isLoggedIn } from '@/lib/api';
import { roleGroup } from '@/lib/roles';
import { ADMIN_ROLE_FA, type AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useAuditLog, useEnsureAdminRole, useTournaments } from '@/lib/admin/store';
import { buildDashboard, type Priority, type Tone } from '@/lib/admin/dashboard';
import { money, fmt } from '@/lib/admin';
import { PageHeader } from '@/components/admin/PageHeader';

const TXT: Record<Tone, string> = { healthy: 'text-good', warning: 'text-gold', critical: 'text-[#fca5a5]', idle: 'text-muted' };
const DOT: Record<Tone, string> = { healthy: 'bg-good', warning: 'bg-gold', critical: 'bg-bad', idle: 'bg-slate-500' };
const RING: Record<Tone, string> = { healthy: 'hover:border-good/30', warning: 'hover:border-gold/40', critical: 'hover:border-bad/40', idle: 'hover:border-accent-dim' };
const PRI: Record<Priority, { rail: string; chip: string; label: string }> = {
  critical: { rail: 'bg-bad', chip: 'border-bad/40 bg-bad/15 text-[#fca5a5]', label: 'بحرانی' },
  urgent: { rail: 'bg-[#fb923c]', chip: 'border-[#fb923c]/40 bg-[#fb923c]/15 text-[#fdba74]', label: 'فوری' },
  warning: { rail: 'bg-gold', chip: 'border-gold/35 bg-gold/15 text-gold', label: 'هشدار' },
  normal: { rail: 'bg-accent', chip: 'border-accent/30 bg-accent/15 text-[#5eead4]', label: 'عادی' },
};
const HEALTH_TONE: Record<string, string> = { connected: 'bg-good', mock: 'bg-accent', missing_config: 'bg-gold', error: 'bg-bad', disabled: 'bg-slate-600' };
const HEALTH_FA: Record<string, string> = { connected: 'متصل', mock: 'آزمایشی', missing_config: 'ناقص', error: 'خطا', disabled: 'غیرفعال' };

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Console({ role }: { role: AdminRole }) {
  const tournaments = useTournaments();
  const audit = useAuditLog();
  const d = useMemo(() => buildDashboard(tournaments, audit), [tournaments, audit]);
  const canCreate = role === 'super_admin' || role === 'tournament_admin';
  const canFinance = role === 'super_admin' || role === 'finance_admin';

  const quick = [
    { label: 'ساختِ تورنومنت', href: '/tournaments/new', show: canCreate },
    { label: 'صفِ اقدامات', href: '/admin/queue', show: true },
    { label: 'بررسیِ اختلاف‌ها', href: '/admin/reports', show: true },
    { label: 'بررسیِ پرداخت‌ها', href: '/admin/finance', show: canFinance },
    { label: 'بررسیِ KYC', href: '/admin/kyc', show: role !== 'support_admin' },
    { label: 'درخواست‌های برگزارکننده', href: '/admin/organizer-requests', show: true },
    { label: 'تنظیماتِ APIها', href: '/admin/settings/integrations', show: role === 'super_admin' },
  ].filter((q) => q.show);

  return (
    <div className="space-y-6">
      {/* breadcrumb + header */}
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-faint">
          <span>SHELTER</span><span>/</span><Link href="/admin" className="hover:text-text">مدیریت</Link><span>/</span><span className="text-slate-300">داشبوردِ مدیریت</span>
        </nav>
        <PageHeader
          title="داشبوردِ مدیریت"
          subtitle="نمای عملیاتیِ امروز؛ تورنومنت‌ها، اختلاف‌ها، پرداخت‌ها و اقدام‌های ضروری."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border border-accent/30 bg-accent/10 text-accent">{ADMIN_ROLE_FA[role]}</span>
              <span className="chip border border-line bg-tile2 text-muted">development</span>
              <span className="chip border border-gold/30 bg-gold/10 text-gold">Mock / QA Data</span>
            </div>
          }
        />
      </div>

      {/* critical banner */}
      {d.criticalCount > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-bad/40 bg-bad/[.08] p-4">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-bad/15 text-bad">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-[#fca5a5]">{fmt(d.criticalCount)} اقدامِ بحرانی نیاز به بررسی دارد</p>
            <p className="mt-0.5 truncate text-xs text-muted">{d.criticalItems.join(' · ')}</p>
          </div>
          <Link href="/admin/queue" className="btn-danger flex-none px-4 py-2 text-sm">رفتن به صفِ اقدامات</Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-good/30 bg-good/[.06] p-3 text-sm text-good">
          <span className="h-2 w-2 rounded-full bg-good" />همه‌ی عملیات‌های حیاتی پایدارند.
        </div>
      )}

      {/* عملیاتِ امروز */}
      <Section title="عملیاتِ امروز">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {d.today.map((c) => (
            <Link key={c.key} href={c.href} className={`group rounded-2xl border border-line bg-tile p-4 transition ${RING[c.tone]}`}>
              <div className="flex items-start justify-between">
                <p className="text-[11px] leading-4 text-faint">{c.label}</p>
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${DOT[c.tone]}`} />
              </div>
              <p className={`mt-1 font-display text-2xl font-bold tnum ${TXT[c.tone]}`}>{fmt(c.count)}</p>
              <p className="mt-1 truncate text-[11px] text-muted">{c.detail}</p>
              <p className="mt-2 text-[11px] font-semibold text-accent opacity-0 transition group-hover:opacity-100">{c.cta} ←</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* KPI */}
      <Section title="شاخص‌های کلیدی">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {d.kpis.map((k) => (
            <Link key={k.key} href={k.href} className={`rounded-xl border border-line bg-tile p-3.5 transition ${RING[k.tone]}`}>
              <p className="text-[11px] text-faint">{k.label}</p>
              <p className={`mt-1 font-display text-xl font-bold tnum ${TXT[k.tone]}`}>{k.money ? money(k.value) : fmt(k.value)}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* گریدِ اصلی */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* ستونِ اصلی */}
        <div className="space-y-6">
          {/* صفِ اقدامات */}
          <Section title="صفِ اقدامات" action={<Link href="/admin/queue" className="text-xs font-semibold text-accent">همه</Link>}>
            {d.actions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-tile2 p-8 text-center text-sm text-faint">اقدامِ فوری‌ای لازم نیست؛ همه‌چیز در جریان است.</div>
            ) : (
              <ul className="space-y-2">
                {d.actions.slice(0, 6).map((a) => {
                  const p = PRI[a.priority];
                  return (
                    <li key={a.id} className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-tile p-3.5">
                      <span className={`absolute inset-y-2 start-0 w-1 rounded-full ${p.rail}`} />
                      <div className="min-w-0 flex-1 ps-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${p.chip}`}>{p.label}</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold">{a.title}</p>
                        <p className="truncate text-[11.5px] text-muted">{a.detail}</p>
                      </div>
                      <Link href={a.href} className="btn-ghost flex-none px-3 py-1.5 text-xs">{a.cta}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* در جریان الآن */}
          <Section title="در جریانِ الآن">
            {d.live.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-tile2 p-6 text-center text-sm text-faint">تورنومنتِ زنده‌ای نیست. وقتی تورنومنتی شروع شود اینجا می‌آید.</div>
            ) : (
              <div className="space-y-3">
                {d.live.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-line bg-tile p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bad" /></span>
                          <p className="truncate font-display text-sm font-bold">{t.title}</p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-faint">{t.game} · {t.round}</p>
                      </div>
                      <Link href={t.href} className="btn-primary flex-none px-3 py-1.5 text-xs">اتاقِ کنترل</Link>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-line bg-tile2 p-2"><p className="font-display text-base font-bold tnum text-bad">{fmt(t.liveMatches)}</p><p className="text-[10px] text-faint">زنده</p></div>
                      <div className="rounded-lg border border-line bg-tile2 p-2"><p className="font-display text-base font-bold tnum text-gold">{fmt(t.pendingResults)}</p><p className="text-[10px] text-faint">معلق</p></div>
                      <div className="rounded-lg border border-line bg-tile2 p-2"><p className={`font-display text-base font-bold tnum ${t.disputes ? 'text-[#fca5a5]' : 'text-muted'}`}>{fmt(t.disputes)}</p><p className="text-[10px] text-faint">اختلاف</p></div>
                    </div>
                    <p className="mt-2 text-[11.5px] text-muted">اقدامِ بعدی: <span className="text-[#5eead4]">{t.nextAction}</span></p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* فعالیتِ اخیر */}
          <Section title="فعالیتِ اخیر" action={<Link href="/admin/audit-log" className="text-xs font-semibold text-accent">گزارشِ ممیزی</Link>}>
            {d.activity.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-tile2 p-6 text-center text-sm text-faint">رویدادی ثبت نشده است.</p>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-tile">
                {d.activity.map((e) => (
                  <li key={e.id}><Link href={e.href} className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/[.03]">
                    <span className={`h-1.5 w-1.5 flex-none rounded-full ${DOT[e.tone]}`} />
                    <span className="min-w-0 flex-1 truncate"><span className="text-slate-200">{e.text}</span> <span className="text-faint">· {e.actor}</span></span>
                    <span className="flex-none text-[11px] text-faint">{e.at}</span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* ستونِ کناری */}
        <div className="space-y-6">
          {/* ریسک‌ها و موانع */}
          <Section title="ریسک‌ها و موانع">
            {d.blockers.length === 0 ? (
              <div className="rounded-2xl border border-good/25 bg-good/[.05] p-5 text-center text-sm text-good">مانعِ فعالی وجود ندارد.</div>
            ) : (
              <ul className="space-y-2">
                {d.blockers.map((b) => (
                  <li key={b.id} className={`rounded-2xl border p-3.5 ${b.severity === 'critical' ? 'border-bad/35 bg-bad/[.06]' : 'border-gold/30 bg-gold/[.05]'}`}>
                    <p className="text-sm font-bold text-text">{b.title}</p>
                    <p className="mt-1 text-[12px] text-muted"><span className="text-faint">علت: </span>{b.cause}</p>
                    <p className="text-[12px] text-[#fca5a5]"><span className="text-faint">اثر: </span>{b.locked}</p>
                    <Link href={b.href} className="btn-ghost mt-2 inline-block px-3 py-1.5 text-xs">{b.cta}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* مالی و escrow */}
          <Section title="مالی و escrow" action={<Link href="/admin/finance" className="text-xs font-semibold text-accent">جزئیات</Link>}>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/admin/finance" className="rounded-xl border border-gold/25 bg-gold/[.05] p-3"><p className="text-[11px] text-faint">قفل در escrow</p><p className="mt-0.5 font-display text-sm font-bold tnum text-gold">{money(d.finance.escrowLocked)}</p></Link>
              <Link href="/admin/finance" className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">پرداختِ معلق</p><p className="mt-0.5 font-display text-sm font-bold tnum">{money(d.finance.pendingPayouts)}</p></Link>
              <Link href="/admin/finance" className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">بازپرداختِ معلق</p><p className={`mt-0.5 font-display text-sm font-bold tnum ${d.finance.pendingRefunds ? 'text-gold' : ''}`}>{fmt(d.finance.pendingRefunds)}</p></Link>
              <Link href="/admin/finance" className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">پرداختِ ناموفق</p><p className={`mt-0.5 font-display text-sm font-bold tnum ${d.finance.failedPayments ? 'text-[#fca5a5]' : ''}`}>{fmt(d.finance.failedPayments)}</p></Link>
              <Link href="/admin/finance" className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">درخواستِ برداشت</p><p className="mt-0.5 font-display text-sm font-bold tnum">{fmt(d.finance.withdrawalRequests)}</p></Link>
              <Link href="/admin/tournaments" className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">پرداختِ قفل‌شده</p><p className="mt-0.5 font-display text-sm font-bold tnum">{fmt(d.finance.lockedTournaments)} تورنومنت</p></Link>
            </div>
          </Section>

          {/* سلامتِ سیستم */}
          <Section title="سلامتِ سیستم" action={<Link href="/admin/settings/integrations" className="text-xs font-semibold text-accent">تنظیمات</Link>}>
            <ul className="space-y-1.5 rounded-2xl border border-line bg-tile p-3">
              {d.health.map((h) => (
                <li key={h.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${HEALTH_TONE[h.status]}`} />{h.label}</span>
                  <span className="text-[11px] text-faint">{HEALTH_FA[h.status]} · {h.note}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* نظارت */}
          <Section title="نظارت و گزارش‌ها" action={<Link href="/admin/reports" className="text-xs font-semibold text-accent">همه</Link>}>
            {d.moderation.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-tile2 p-5 text-center text-sm text-faint">گزارشِ بازی نیست.</p>
            ) : (
              <ul className="space-y-2">
                {d.moderation.slice(0, 4).map((m) => (
                  <li key={m.id}><Link href={m.href} className="flex items-center gap-2 rounded-xl border border-line bg-tile p-3 transition hover:border-accent-dim">
                    <span className={`h-1.5 w-1.5 flex-none rounded-full ${m.severity === 'critical' ? 'bg-bad' : 'bg-gold'}`} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{m.title}</span><span className="block truncate text-[11px] text-faint">{m.entity}</span></span>
                  </Link></li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* اقدام‌های سریع */}
      <Section title="اقدام‌های سریع">
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <Link key={q.href} href={q.href} className="btn-ghost px-4 py-2 text-sm">{q.label}</Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function AdminDashboard() {
  useEnsureAdminRole();
  const role = useAdminRole();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { setAllowed(false); return; }
    apiGet<{ role: string }>('/users/me').then((m) => setAllowed(roleGroup(m.role) === 'admin')).catch(() => setAllowed(false));
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

  return <Console role={role} />;
}
