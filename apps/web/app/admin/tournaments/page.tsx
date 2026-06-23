'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { TournamentRowActions } from '@/components/admin/TournamentRowActions';
import { TournamentDetailDrawer } from '@/components/admin/TournamentDetailDrawer';
import { TOURNAMENT_STATUS_META, money, fmt, type AdminTournament, type TournamentStatus } from '@/lib/admin';
import { ADMIN_ROLE_FA, type AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useEnsureAdminRole, useTournaments, setRoleOverride } from '@/lib/admin/store';

const uniq = (a: string[]) => Array.from(new Set(a));
const dfa = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
};

function SummaryCards({ list }: { list: AdminTournament[] }) {
  const cards = [
    { label: 'زنده', value: list.filter((t) => t.status === 'live').length, tone: 'text-bad' },
    { label: 'ثبت‌نامِ باز', value: list.filter((t) => t.status === 'registration_open').length, tone: 'text-accent' },
    { label: 'در انتظارِ بررسی', value: list.filter((t) => t.status === 'pending_review').length, tone: 'text-gold' },
    { label: 'در انتظارِ پرداخت', value: list.filter((t) => t.status === 'payout_pending').length, tone: 'text-gold' },
    { label: 'اختلافِ باز', value: list.reduce((s, t) => s + t.disputes, 0), tone: 'text-bad' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-line bg-tile p-3.5">
          <p className="text-[11px] text-faint">{c.label}</p>
          <p className={`mt-1 font-display text-xl font-bold tnum ${c.tone}`}>{fmt(c.value)}</p>
        </div>
      ))}
    </div>
  );
}

function Alerts({ t }: { t: AdminTournament }) {
  const items = [
    t.disputes > 0 && { n: t.disputes, cls: 'border-bad/30 text-[#fca5a5]', title: 'اختلاف' },
    t.pendingResults > 0 && { n: t.pendingResults, cls: 'border-gold/30 text-gold', title: 'نتیجه‌ی معلق' },
    t.pendingPayouts > 0 && { n: t.pendingPayouts, cls: 'border-gold/30 text-gold', title: 'پرداختِ معلق' },
  ].filter(Boolean) as { n: number; cls: string; title: string }[];
  if (!items.length) return <span className="text-faint">—</span>;
  return (
    <div className="flex gap-1">
      {items.map((it, i) => (
        <span key={i} title={it.title} className={`grid h-5 min-w-5 place-items-center rounded-md border px-1 text-[10px] font-bold tnum ${it.cls}`}>
          {fmt(it.n)}
        </span>
      ))}
    </div>
  );
}

function TournamentsConsole() {
  useEnsureAdminRole();
  const role = useAdminRole();
  const tournaments = useTournaments();
  const [actorName, setActorName] = useState('مدیر سیستم');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TournamentStatus>('all');
  const [game, setGame] = useState('all');
  const [organizer, setOrganizer] = useState('all');
  const [special, setSpecial] = useState<'all' | 'disputes' | 'payout' | 'reg_open' | 'live'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 300);
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
    return () => clearTimeout(id);
  }, []);

  const games = useMemo(() => uniq(tournaments.map((t) => t.game)), [tournaments]);
  const organizers = useMemo(() => uniq(tournaments.map((t) => t.organizer)), [tournaments]);

  const filtered = useMemo(
    () =>
      tournaments.filter((t) => {
        if (status !== 'all' && t.status !== status) return false;
        if (game !== 'all' && t.game !== game) return false;
        if (organizer !== 'all' && t.organizer !== organizer) return false;
        if (special === 'disputes' && t.disputes === 0) return false;
        if (special === 'payout' && t.status !== 'payout_pending' && t.pendingPayouts === 0) return false;
        if (special === 'reg_open' && t.status !== 'registration_open') return false;
        if (special === 'live' && t.status !== 'live') return false;
        const q = search.trim().toLowerCase();
        if (q && !`${t.title} ${t.game} ${t.organizer} ${TOURNAMENT_STATUS_META[t.status].label}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [tournaments, status, game, organizer, special, search],
  );

  const hasFilter = !!search || status !== 'all' || game !== 'all' || organizer !== 'all' || special !== 'all';
  function resetFilters() {
    setSearch(''); setStatus('all'); setGame('all'); setOrganizer('all'); setSpecial('all');
  }

  function exportCsv() {
    const head = ['عنوان', 'بازی', 'وضعیت', 'شرکت‌کننده', 'ظرفیت', 'جایزه', 'برگزارکننده'];
    const rows = filtered.map((t) => [t.title, t.game, TOURNAMENT_STATUS_META[t.status].label, t.participants, t.maxParticipants, t.prize, t.organizer]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournaments.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls = 'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';
  const selectedT = tournaments.find((t) => t.id === selected) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="مدیریتِ تورنومنت‌ها"
        subtitle="کنترلِ ساخت، تأیید، انتشار، اجرای زنده و پرداختِ جوایز."
        actions={
          <>
            <Link href="/admin/queue" className="btn-ghost px-3 py-2 text-sm">درخواست‌های بررسی</Link>
            <Link href="/admin/finance" className="btn-ghost px-3 py-2 text-sm">پرداخت‌های معلق</Link>
            <button onClick={exportCsv} className="btn-ghost px-3 py-2 text-sm">خروجیِ CSV</button>
            <Link href="/tournaments/new" className="btn-primary px-4 py-2 text-sm">ساختِ تورنومنت</Link>
          </>
        }
      />

      <SummaryCards list={tournaments} />

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-faint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجو: عنوان، بازی، برگزارکننده…" className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as TournamentStatus | 'all')} className={selectCls}>
          <option value="all">همه‌ی وضعیت‌ها</option>
          {(Object.keys(TOURNAMENT_STATUS_META) as TournamentStatus[]).map((s) => (
            <option key={s} value={s}>{TOURNAMENT_STATUS_META[s].label}</option>
          ))}
        </select>
        <select value={game} onChange={(e) => setGame(e.target.value)} className={selectCls}>
          <option value="all">همه‌ی بازی‌ها</option>
          {games.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={organizer} onChange={(e) => setOrganizer(e.target.value)} className={selectCls}>
          <option value="all">همه‌ی برگزارکننده‌ها</option>
          {organizers.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={special} onChange={(e) => setSpecial(e.target.value as typeof special)} className={selectCls}>
          <option value="all">همه</option>
          <option value="live">زنده</option>
          <option value="reg_open">ثبت‌نامِ باز</option>
          <option value="disputes">دارای اختلاف</option>
          <option value="payout">در انتظارِ پرداخت</option>
        </select>
        {hasFilter && <button onClick={resetFilters} className="rounded-lg border border-line px-3 py-2 text-xs text-faint hover:text-text">پاک‌کردنِ فیلترها</button>}
        <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>

        {/* role switcher (ابزارِ آزمایشِ دسترسی) */}
        <label className="flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2 py-1.5 text-[11px] text-faint">
          نقشِ آزمایشی
          <select value={role} onChange={(e) => setRoleOverride(e.target.value as AdminRole)} className="bg-transparent text-[11px] text-accent outline-none">
            {(Object.keys(ADMIN_ROLE_FA) as AdminRole[]).map((r) => <option key={r} value={r} className="bg-tile2 text-text">{ADMIN_ROLE_FA[r]}</option>)}
          </select>
        </label>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-tile">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
              <th className="p-3 font-medium">تورنومنت</th>
              <th className="p-3 font-medium">برگزارکننده</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">شرکت‌کننده‌ها</th>
              <th className="p-3 font-medium">جایزه / escrow</th>
              <th className="p-3 font-medium">زمان‌بندی</th>
              <th className="p-3 font-medium">هشدارها</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-line">
                  <td colSpan={8} className="p-3"><div className="h-8 w-full animate-pulse rounded bg-white/[.04]" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <p className="text-sm text-muted">تورنومنتی با این فیلتر پیدا نشد</p>
                  {hasFilter && <button onClick={resetFilters} className="btn-ghost mt-3 px-4 py-2 text-xs">پاک‌کردنِ فیلترها</button>}
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const meta = TOURNAMENT_STATUS_META[t.status];
                const pct = t.maxParticipants ? Math.round((t.participants / t.maxParticipants) * 100) : 0;
                return (
                  <tr key={t.id} onClick={() => setSelected(t.id)} className="cursor-pointer border-b border-line transition hover:bg-white/[.025]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-gradient-to-br from-accent/30 to-gold/20 font-display text-xs font-bold text-white">{t.game.slice(0, 2)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{t.title}</p>
                          <p className="text-[11px] text-faint">{t.game} · {t.platform}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted">{t.organizer}</td>
                    <td className="p-3"><AdminBadge label={meta.label} tone={meta.tone} dot={t.status === 'live'} /></td>
                    <td className="p-3">
                      <p className="text-xs tnum text-muted">{fmt(t.participants)} / {fmt(t.maxParticipants)}</p>
                      <div className="pbar mt-1 w-28"><span style={{ width: `${pct}%` }} /></div>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-semibold tnum text-gold">{money(t.prize)}</p>
                      <p className="text-[11px] text-faint">escrow: {t.escrow}</p>
                    </td>
                    <td className="p-3 text-[11px] text-muted">
                      <p>ثبت‌نام تا {dfa(t.registrationEnd)}</p>
                      <p className="text-faint">شروع {dfa(t.startAt)}</p>
                    </td>
                    <td className="p-3"><Alerts t={t} /></td>
                    <td className="p-3"><TournamentRowActions t={t} role={role} actorName={actorName} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TournamentDetailDrawer t={selectedT} role={role} actorName={actorName} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function AdminTournamentsPage() {
  return (
    <AdminGuard>
      <TournamentsConsole />
    </AdminGuard>
  );
}
