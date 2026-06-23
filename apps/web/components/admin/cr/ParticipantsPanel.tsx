'use client';

import { useMemo, useState } from 'react';
import type { Tone } from '@/lib/admin';
import { fmt } from '@/lib/admin';
import {
  CRPART_FA,
  relTime,
  type ControlRoomState,
  type CRParticipant,
  type CRParticipantStatus,
} from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';

/** تُنِ بَجِ وضعیتِ شرکت‌کننده: برنده/فعال سبز، منتظر خاکستری، غایب/محروم قرمز. */
const STATUS_TONE: Record<CRParticipantStatus, Tone> = {
  winner: 'good',
  playing: 'accent',
  checked_in: 'good',
  waiting: 'muted',
  registered: 'muted',
  eliminated: 'muted',
  withdrawn: 'muted',
  no_show: 'bad',
  disqualified: 'bad',
};

const FADED: CRParticipantStatus[] = ['eliminated', 'withdrawn', 'no_show', 'disqualified'];

type FilterKey = 'all' | 'active' | 'checked_in' | 'absent' | 'banned';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'active', label: 'در حالِ بازی' },
  { key: 'checked_in', label: 'چک‌این‌شده' },
  { key: 'absent', label: 'غایب' },
  { key: 'banned', label: 'محروم' },
];

function matchesFilter(p: CRParticipant, f: FilterKey): boolean {
  if (f === 'all') return true;
  if (f === 'active') return p.status === 'playing' || p.status === 'waiting';
  if (f === 'checked_in') return p.status === 'checked_in';
  if (f === 'absent') return p.status === 'no_show';
  if (f === 'banned') return p.status === 'disqualified';
  return true;
}

export function ParticipantsPanel({
  cr,
  onOpenParticipant,
}: {
  cr: ControlRoomState;
  onOpenParticipant: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(() => {
    let checkedIn = 0;
    let absent = 0;
    let banned = 0;
    for (const p of cr.participants) {
      if (p.status === 'checked_in') checkedIn++;
      if (p.status === 'no_show') absent++;
      if (p.status === 'disqualified') banned++;
    }
    return { total: cr.participants.length, checkedIn, absent, banned };
  }, [cr.participants]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cr.participants
      .filter((p) => matchesFilter(p, filter))
      .filter((p) => (needle ? p.name.toLowerCase().includes(needle) : true))
      .slice()
      .sort((a, b) => a.seed - b.seed);
  }, [cr.participants, q, filter]);

  const matchNumberOf = (p: CRParticipant): number | undefined =>
    p.currentMatchId ? cr.matches.find((m) => m.id === p.currentMatchId)?.number : undefined;

  return (
    <section className="rounded-2xl border border-line bg-tile p-4">
      {/* سرتیتر + شمارنده‌ها */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          شرکت‌کننده‌ها
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <span className="chip bg-tile2 text-muted">کل <b className="tnum text-text">{fmt(counts.total)}</b></span>
          <span className="chip bg-good/15 text-good">چک‌این <b className="tnum">{fmt(counts.checkedIn)}</b></span>
          <span className="chip bg-bad/15 text-[#fca5a5]">غایب <b className="tnum">{fmt(counts.absent)}</b></span>
          <span className="chip bg-bad/15 text-[#fca5a5]">محروم <b className="tnum">{fmt(counts.banned)}</b></span>
        </div>
      </div>

      {/* جست‌وجو + فیلتر */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute inset-y-0 end-2.5 my-auto text-faint">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام…"
            className="w-full rounded-lg border border-line bg-tile2 py-1.5 pe-8 ps-3 text-sm text-text placeholder:text-faint outline-none focus:border-accent"
          />
        </div>
        <div className="hscroll flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`chip whitespace-nowrap border transition ${
                filter === f.key ? 'border-accent/40 bg-accent/15 text-[#5eead4]' : 'border-line bg-tile2 text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* لیست */}
      <div className="mt-3 flex flex-col gap-1.5">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-tile2/40 p-6 text-center text-sm text-faint">
            {cr.participants.length === 0
              ? 'هنوز شرکت‌کننده‌ای ثبت نشده؛ با بازشدنِ ثبت‌نام، بازیکنان اینجا فهرست می‌شوند.'
              : 'با این جست‌وجو یا فیلتر شرکت‌کننده‌ای پیدا نشد؛ عبارت یا فیلتر را تغییر دهید.'}
          </div>
        ) : (
          rows.map((p) => {
            const faded = FADED.includes(p.status);
            const mNum = matchNumberOf(p);
            return (
              <button
                key={p.id}
                onClick={() => onOpenParticipant(p.id)}
                className={`group flex items-center gap-3 rounded-xl border border-line bg-tile2 px-3 py-2 text-start transition hover:border-accent/40 hover:bg-tile2/80 ${
                  faded ? 'opacity-60' : ''
                } ${p.status === 'disqualified' || p.status === 'no_show' ? 'border-bad/30' : ''}`}
              >
                <div className="relative flex-none">
                  <Avatar p={p} size={38} />
                  {p.status === 'playing' && (
                    <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-tile bg-good" title="در حالِ بازی" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`truncate font-display text-sm font-bold ${p.status === 'winner' ? 'text-good' : faded ? 'text-muted' : 'text-text'}`}>
                      {p.name}
                    </span>
                    <span className="tnum flex-none rounded-md bg-tile px-1.5 text-[10px] font-bold text-faint" title="سید">
                      #{fmt(p.seed)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {mNum != null && (
                      <span className="tnum chip bg-accent/12 text-[#5eead4]">مسابقه‌ی #{fmt(mNum)}</span>
                    )}
                    <span className={`chip ${p.paid ? 'bg-good/12 text-good' : 'bg-bad/12 text-[#fca5a5]'}`}>
                      {p.paid ? 'پرداخت‌شده' : 'پرداخت‌نشده'}
                    </span>
                    {p.reports > 0 && (
                      <span className="tnum chip bg-bad/15 text-[#fca5a5]" title="گزارش‌ها">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                        </svg>
                        {fmt(p.reports)} گزارش
                      </span>
                    )}
                    <span className="text-faint">{relTime(p.lastActivity)}</span>
                  </div>
                </div>

                <div className="flex-none">
                  <AdminBadge label={CRPART_FA[p.status]} tone={STATUS_TONE[p.status]} dot={p.status === 'winner'} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ParticipantsPanel;
