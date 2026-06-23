'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TOURNAMENT_STATUS_META, money, fmt, type AdminTournament } from '@/lib/admin';
import type { AdminRole } from '@/lib/admin/ops';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { TournamentRowActions } from '@/components/admin/TournamentRowActions';
import { AuditLogList } from '@/components/admin/AuditLogList';

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-tile2 p-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tnum ${tone ?? ''}`}>{value}</p>
    </div>
  );
}

const TABS: { href: (id: string) => string; label: string }[] = [
  { href: (id) => `/admin/tournaments/${id}`, label: 'نمای کلی' },
  { href: (id) => `/admin/tournaments/${id}/participants`, label: 'شرکت‌کننده‌ها' },
  { href: (id) => `/admin/tournaments/${id}/bracket`, label: 'براکت' },
  { href: (id) => `/admin/tournaments/${id}/matches`, label: 'مسابقات' },
  { href: (id) => `/admin/tournaments/${id}/disputes`, label: 'اختلاف‌ها' },
  { href: (id) => `/admin/tournaments/${id}/finance`, label: 'مالی' },
  { href: (id) => `/admin/tournaments/${id}/control-room`, label: 'اتاقِ کنترل' },
];

export function TournamentDetailDrawer({ t, role, actorName, onClose }: { t: AdminTournament | null; role: AdminRole; actorName: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!t) return null;
  const meta = TOURNAMENT_STATUS_META[t.status];
  const pct = t.maxParticipants ? Math.round((t.participants / t.maxParticipants) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 start-0 flex w-full max-w-[480px] flex-col border-e border-line bg-tile shadow-[30px_0_80px_-30px_rgba(0,0,0,.9)] animate-[fade-up_.2s_ease]">
        {/* header */}
        <div className="flex items-start gap-3 border-b border-line p-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <AdminBadge label={meta.label} tone={meta.tone} dot={t.status === 'live'} />
              <span className="text-[11px] text-faint">{t.platform} · {t.organizer}</span>
            </div>
            <h2 className="font-display text-lg font-bold leading-tight">{t.title}</h2>
            <p className="text-xs text-faint">{t.game}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line text-faint hover:text-text" aria-label="بستن">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {/* quick actions */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">اقدام‌های سریع</p>
            <TournamentRowActions t={t} role={role} actorName={actorName} inline={3} onDone={onClose} />
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="شرکت‌کننده‌ها" value={`${fmt(t.participants)} / ${fmt(t.maxParticipants)}`} />
            <Stat label="جایزه" value={money(t.prize)} tone="text-gold" />
            <Stat label="escrow" value={t.escrow} tone="text-accent" />
            <Stat label="دورِ جاری" value={t.currentRound ? fmt(t.currentRound) : '—'} />
          </div>

          {/* alerts */}
          <div className="grid grid-cols-3 gap-2">
            <Stat label="اختلاف" value={fmt(t.disputes)} tone={t.disputes ? 'text-bad' : ''} />
            <Stat label="نتایجِ معلق" value={fmt(t.pendingResults)} tone={t.pendingResults ? 'text-gold' : ''} />
            <Stat label="پرداختِ معلق" value={fmt(t.pendingPayouts)} tone={t.pendingPayouts ? 'text-gold' : ''} />
          </div>

          {/* capacity bar */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-faint"><span>ظرفیت</span><span className="tnum">{pct}٪</span></div>
            <div className="pbar"><span style={{ width: `${pct}%` }} /></div>
          </div>

          {/* deep links */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">بخش‌ها</p>
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((tab) => (
                <Link key={tab.label} href={tab.href(t.id)} className="rounded-lg border border-line px-2.5 py-1 text-xs text-slate-200 transition hover:border-accent-dim hover:text-white">
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* audit summary */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">گزارشِ عملیات</p>
            <AuditLogList entityId={t.id} limit={6} />
          </div>
        </div>
      </aside>
    </div>
  );
}
