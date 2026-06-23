'use client';

// نمای کلیِ تورنومنت (تبِ OVERVIEW) — خلاصه‌ی عملیاتیِ واقعی:
// شبکه‌ی آماری (با تونِ هشدار)، گام‌های بعدیِ مجاز برای وضعیتِ جاری، و گزارشِ ممیزیِ اخیر.
// چیدمانِ دو ستونی روی lg. این صفحه فقط بدنه را رندر می‌کند (هدر/تب‌بار در layout است).

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { money, fmt, type Tone, type AdminTournament } from '@/lib/admin';
import { ACTIONS_BY_STATUS, ACTION_LABEL, can, navHref, NAV_ACTIONS, type AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useTournament } from '@/lib/admin/store';
import { participantsFor, matchesFor, disputesFor } from '@/lib/admin/fixtures';

const TONE_TEXT: Record<Tone, string> = {
  accent: 'text-accent',
  gold: 'text-gold',
  bad: 'text-bad',
  good: 'text-good',
  muted: 'text-slate-200',
};

type IconKey = 'users' | 'trophy' | 'lock' | 'play' | 'flag' | 'clipboard' | 'wallet';

function Icon({ name }: { name: IconKey }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'users':
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>;
    case 'trophy':
      return <svg {...common}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case 'play':
      return <svg {...common}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
    case 'flag':
      return <svg {...common}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
    case 'clipboard':
      return <svg {...common}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
    case 'wallet':
      return <svg {...common}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>;
  }
}

const ESCROW_FA: Record<AdminTournament['escrow'], { label: string; tone: Tone }> = {
  none: { label: 'بدونِ امانی', tone: 'muted' },
  locked: { label: 'قفل‌شده', tone: 'gold' },
  released: { label: 'آزادشده', tone: 'good' },
  refunded: { label: 'بازپرداخت', tone: 'accent' },
};

function StatCard({ icon, label, primary, sub, tone, bar }: { icon: IconKey; label: string; primary: string; sub?: string; tone: Tone; bar?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-tile p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg bg-tile2 ${TONE_TEXT[tone]}`}><Icon name={icon} /></span>
        <span className="text-[11px] text-faint">{label}</span>
      </div>
      <p className={`font-display text-2xl font-bold leading-none tnum ${TONE_TEXT[tone]}`}>{primary}</p>
      {sub && <p className="mt-1 text-[11px] text-faint">{sub}</p>}
      {typeof bar === 'number' && (
        <div className="pbar mt-2.5"><span style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} /></div>
      )}
    </div>
  );
}

export default function TournamentOverviewPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  // مشتق‌سازیِ آمارِ منسجم از همان fixtureها (نه عددِ خام).
  const derived = useMemo(() => {
    if (!t) return null;
    const participants = participantsFor(t);
    const matches = matchesFor(t);
    const disputes = disputesFor(t);
    return {
      checkedIn: participants.filter((p) => p.status === 'checked_in' || p.status === 'winner' || p.status === 'eliminated').length,
      disqualified: participants.filter((p) => p.status === 'disqualified').length,
      pendingResultRows: matches.filter((m) => m.status === 'result_submitted' || m.status === 'admin_review').length,
      openDisputeRows: disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length,
      participants,
      matches,
      disputes,
    };
  }, [t]);

  if (!t || !derived) return null;

  const pct = t.maxParticipants ? Math.round((t.participants / t.maxParticipants) * 100) : 0;
  const escrow = ESCROW_FA[t.escrow];

  // فقط اکشن‌هایی که status را عوض می‌کنند تونِ هشدار بگیرند.
  const nextActions = ACTIONS_BY_STATUS[t.status];

  const stats: Array<ComponentProps<typeof StatCard>> = [
    { icon: 'users', label: 'شرکت‌کننده‌ها', primary: `${fmt(t.participants)} / ${fmt(t.maxParticipants)}`, sub: `حداقل ${fmt(t.minParticipants)} · ${fmt(pct)}٪ ظرفیت`, tone: t.participants < t.minParticipants ? 'gold' : 'accent', bar: pct },
    { icon: 'trophy', label: 'جایزه', primary: money(t.prize), sub: `${derived.checkedIn ? `${fmt(derived.checkedIn)} چک‌این‌شده` : 'هنوز چک‌این نشده'}${derived.disqualified ? ` · ${fmt(derived.disqualified)} محروم` : ''}`, tone: 'gold' },
    { icon: 'lock', label: 'امانی (escrow)', primary: escrow.label, sub: t.escrow === 'locked' ? money(t.prize) + ' در امانت' : '—', tone: escrow.tone },
    { icon: 'play', label: 'دورِ جاری', primary: t.currentRound ? `دورِ ${fmt(t.currentRound)}` : '—', sub: derived.matches.length ? `${fmt(derived.matches.length)} مسابقه` : 'براکت ساخته نشده', tone: t.status === 'live' ? 'bad' : 'muted' },
    { icon: 'flag', label: 'اختلاف‌ها', primary: fmt(t.disputes), sub: derived.openDisputeRows ? `${fmt(derived.openDisputeRows)} باز/در بررسی` : 'بدونِ اختلاف', tone: t.disputes > 0 ? 'bad' : 'good' },
    { icon: 'clipboard', label: 'نتایجِ معلق', primary: fmt(t.pendingResults), sub: derived.pendingResultRows ? `${fmt(derived.pendingResultRows)} در صفِ تأیید` : 'چیزی معلق نیست', tone: t.pendingResults > 0 ? 'gold' : 'good' },
    { icon: 'wallet', label: 'پرداختِ معلق', primary: fmt(t.pendingPayouts), sub: t.pendingPayouts > 0 ? 'نیازمندِ آزادسازی' : 'تسویه‌شده', tone: t.pendingPayouts > 0 ? 'gold' : 'good' },
  ];

  // راهنمای متنیِ هر اکشن (بدون اجرا — اجرا در quick-actionsِ هدر/تب‌های مربوط است).
  const navOnly = (a: typeof nextActions[number]) => NAV_ACTIONS.has(a);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">نمای کلیِ عملیات</h2>
        <AdminBadge label={`${fmt(derived.openDisputeRows + t.pendingResults + t.pendingPayouts)} موردِ نیازمندِ اقدام`} tone={derived.openDisputeRows + t.pendingResults + t.pendingPayouts > 0 ? 'gold' : 'good'} />
      </div>

      {/* شبکه‌ی آماری */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* دو ستون روی lg */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* گام‌های بعدی */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </span>
            <h3 className="font-display text-sm font-bold">گام‌های بعدی</h3>
            <span className="ms-auto text-[11px] text-faint">برای وضعیتِ «{t.status}»</span>
          </div>

          {nextActions.length === 0 ? (
            <p className="rounded-xl border border-line bg-tile2 px-3 py-4 text-center text-xs text-faint">در این وضعیت اقدامِ دیگری لازم نیست.</p>
          ) : (
            <ul className="space-y-1.5">
              {nextActions.map((a) => {
                const allowed = can(role, a);
                const isNav = navOnly(a);
                return (
                  <li
                    key={a}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs ${allowed ? 'border-line bg-tile2' : 'border-line bg-tile2 opacity-60'}`}
                    title={allowed ? undefined : 'دسترسی لازم را ندارید'}
                  >
                    <span className={`grid h-6 w-6 flex-none place-items-center rounded-md ${allowed ? 'bg-accent/10 text-accent' : 'bg-tile text-faint'}`}>
                      {allowed ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      )}
                    </span>
                    <span className="font-semibold text-slate-200">{ACTION_LABEL[a]}</span>
                    <span className="ms-auto flex items-center gap-1.5 text-[11px] text-faint">
                      {isNav ? 'پیمایش' : 'اقدامِ وضعیتی'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            این فهرست راهنماست؛ اجرای اقدام‌ها از «اقداماتِ سریعِ» بالای صفحه یا تبِ مربوطه انجام می‌شود.
          </p>
        </section>

        {/* گزارشِ عملیاتِ اخیر */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/10 text-gold">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg>
            </span>
            <h3 className="font-display text-sm font-bold">گزارشِ عملیاتِ اخیر</h3>
            <span className="ms-auto text-[11px] text-faint">۶ موردِ آخر</span>
          </div>
          <AuditLogList entityId={id} limit={6} />
        </section>
      </div>
    </div>
  );
}
