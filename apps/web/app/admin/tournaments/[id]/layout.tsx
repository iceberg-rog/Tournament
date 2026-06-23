'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { TournamentRowActions } from '@/components/admin/TournamentRowActions';
import { TOURNAMENT_STATUS_META, money, fmt } from '@/lib/admin';
import { useAdminRole, useEnsureAdminRole, useTournament } from '@/lib/admin/store';

const TABS = [
  { seg: '', label: 'نمای کلی' },
  { seg: 'control-room', label: 'اتاقِ کنترل' },
  { seg: 'schedule', label: 'برنامه‌ی زمان‌بندی' },
  { seg: 'bracket', label: 'براکت' },
  { seg: 'matches', label: 'مسابقات' },
  { seg: 'participants', label: 'شرکت‌کننده‌ها' },
  { seg: 'chat', label: 'چت و اعلان‌ها' },
  { seg: 'disputes', label: 'اختلاف‌ها' },
  { seg: 'stream', label: 'استریمِ زنده' },
  { seg: 'finance', label: 'مالی' },
  { seg: 'audit-log', label: 'گزارشِ عملیات' },
];

function Shell({ children }: { children: ReactNode }) {
  useEnsureAdminRole();
  const role = useAdminRole();
  const params = useParams();
  const pathname = usePathname();
  const id = String(params.id);
  const t = useTournament(id);
  const [actorName, setActorName] = useState('مدیر سیستم');

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  if (!t)
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="text-lg font-bold">تورنومنت پیدا نشد</p>
          <Link href="/admin/tournaments" className="btn-ghost mt-4 px-4 py-2 text-sm">بازگشت به فهرست</Link>
        </div>
      </div>
    );

  const meta = TOURNAMENT_STATUS_META[t.status];
  const base = `/admin/tournaments/${id}`;
  const activeSeg = pathname === base ? '' : pathname.slice(base.length + 1).split('/')[0];

  return (
    <div className="space-y-4">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-faint">
        <Link href="/admin" className="hover:text-text">مدیریت</Link>
        <span>/</span>
        <Link href="/admin/tournaments" className="hover:text-text">تورنومنت‌ها</Link>
        <span>/</span>
        <span className="text-slate-300">{t.title}</span>
      </nav>

      {/* header — در اتاقِ کنترل پنهان می‌شود (کابین هدرِ فشردهٔ خودش را دارد) */}
      {activeSeg !== 'control-room' && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-tile p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-accent/30 to-gold/20 font-display text-sm font-bold text-white">{t.game.slice(0, 2)}</span>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <AdminBadge label={meta.label} tone={meta.tone} dot={t.status === 'live'} />
                <span className="text-[11px] text-faint">{t.game} · {t.platform} · {t.organizer}</span>
              </div>
              <h1 className="font-display text-xl font-bold leading-tight">{t.title}</h1>
              <p className="mt-0.5 text-xs text-faint">
                {fmt(t.participants)}/{fmt(t.maxParticipants)} شرکت‌کننده · جایزه {money(t.prize)}
                {t.currentRound ? ` · دورِ ${fmt(t.currentRound)}` : ''}
              </p>
            </div>
          </div>
          <TournamentRowActions t={t} role={role} actorName={actorName} inline={3} />
        </div>
      )}

      {/* tabs */}
      <div className="hscroll flex gap-1 border-b border-line">
        {TABS.map((tab) => {
          const href = tab.seg ? `${base}/${tab.seg}` : base;
          const active = activeSeg === tab.seg;
          return (
            <Link
              key={tab.seg || 'overview'}
              href={href}
              className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition ${
                active ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}

export default function TournamentLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <Shell>{children}</Shell>
    </AdminGuard>
  );
}
