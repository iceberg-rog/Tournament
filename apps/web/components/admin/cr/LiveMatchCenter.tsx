'use client';

import { useMemo, useState } from 'react';
import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';
import type { Tone } from '@/lib/admin';
import { fmt } from '@/lib/admin';
import {
  CRMATCH_FA,
  participantById,
  relTime,
  type CRMatch,
  type CRMatchStatus,
  type ControlRoomState,
} from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';

const fa = (n: number) => n.toLocaleString('fa-IR');

/** نگاشتِ وضعیتِ مسابقه → لحنِ نشانِ وضعیت. */
const STATUS_TONE: Record<CRMatchStatus, Tone> = {
  scheduled: 'muted',
  waiting_for_players: 'muted',
  ready: 'muted',
  live: 'bad',
  result_submitted: 'gold',
  awaiting_opponent_confirmation: 'gold',
  admin_review: 'gold',
  disputed: 'bad',
  completed: 'good',
  no_show: 'bad',
  cancelled: 'muted',
};

const PENDING: CRMatchStatus[] = ['result_submitted', 'awaiting_opponent_confirmation', 'admin_review'];
const NO_SHOWABLE: CRMatchStatus[] = ['ready', 'scheduled'];

/** نشانگرِ شمارشِ کوچک (مدارک / پیام‌های نخوانده). */
function MiniCount({ icon, value, label, tone }: { icon: 'shield' | 'chat'; value: number; label: string; tone: 'muted' | 'gold' }) {
  if (value <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tnum ${
        tone === 'gold' ? 'border-gold/30 bg-gold/10 text-gold' : 'border-line bg-tile2 text-muted'
      }`}
      title={label}
    >
      {icon === 'shield' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
      {fa(value)}
    </span>
  );
}

/** یک ردیفِ طرف (A یا B) داخلِ کارتِ مسابقه. */
function SideRow({
  cr,
  id,
  score,
  isWinner,
  isLoser,
  live,
}: {
  cr: ControlRoomState;
  id: string | null;
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  live: boolean;
}) {
  const p = participantById(cr, id);
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition ${
        isWinner
          ? 'border-accent/40 bg-accent/10'
          : isLoser
            ? 'border-transparent bg-white/[.015] opacity-55'
            : 'border-transparent bg-white/[.02]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar p={p} size={34} />
        <div className="min-w-0">
          <div className={`truncate text-sm ${isWinner ? 'font-extrabold text-text' : isLoser ? 'font-medium text-muted' : 'font-semibold text-text'}`}>
            {p ? p.name : 'TBD'}
          </div>
          {p && <div className="text-[11px] text-faint">سید {fa(p.seed)}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isWinner && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-label="برنده">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        <span
          className={`font-display tnum text-2xl tabular-nums ${
            isWinner ? 'text-accent' : isLoser ? 'text-faint' : live ? 'text-text' : 'text-muted'
          }`}
        >
          {fa(score)}
        </span>
      </div>
    </div>
  );
}

function MatchCard({ cr, m, onOpenMatch, onRun }: { cr: ControlRoomState; m: CRMatch; onOpenMatch: (id: string) => void; onRun: (a: CRAction, p?: CRPayload) => void }) {
  const live = m.status === 'live';
  const disputed = m.status === 'disputed';
  const noShow = m.status === 'no_show';
  const done = m.status === 'completed';
  const pending = PENDING.includes(m.status);

  const winA = !!m.winnerId && m.winnerId === m.aId;
  const winB = !!m.winnerId && m.winnerId === m.bId;
  const submittedBy = participantById(cr, m.submittedById);

  // قابِ کارت بر اساسِ وضعیت: اختلاف/عدمِ حضور = قرمز، زنده = آبی‌فام تپنده، تأیید معلق = طلایی.
  const frame = disputed || noShow
    ? 'border-bad/55 bg-bad/[.04]'
    : live
      ? 'border-bad/40 bg-bad/[.03]'
      : pending
        ? 'border-gold/40 bg-gold/[.03]'
        : done
          ? 'border-line bg-tile'
          : 'border-line bg-tile';

  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border p-4 shadow-[var(--shadow)] ${frame}`}>
      {live && <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-bad/30 animate-pulse" aria-hidden />}

      {/* سرتیتر */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-sm font-bold text-text">
            مسابقه‌ی #{fa(m.number)}
            <span className="text-faint"> · </span>
            <span className="text-muted">{m.roundName}</span>
          </div>
          {m.map && <div className="mt-0.5 text-[11px] text-faint">نقشه: {m.map}</div>}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {live && <span className="dot" aria-hidden />}
          <AdminBadge label={CRMATCH_FA[m.status]} tone={STATUS_TONE[m.status]} dot={live} />
        </div>
      </div>

      {/* طرفین + امتیاز */}
      <div className="relative flex flex-col gap-1.5">
        <SideRow cr={cr} id={m.aId} score={m.scoreA} isWinner={winA} isLoser={winB} live={live} />
        <div className="flex items-center gap-2 px-1">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] font-bold tracking-widest text-faint">VS</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <SideRow cr={cr} id={m.bId} score={m.scoreB} isWinner={winB} isLoser={winA} live={live} />
      </div>

      {/* بلاکر — پررنگ و توضیح‌دار */}
      {m.blockerReason && (
        <div className="relative flex items-start gap-2 rounded-xl border border-bad/50 bg-bad/10 px-3 py-2 text-[12px] font-semibold text-[#fca5a5]">
          <svg className="mt-0.5 flex-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <span className="leading-5">{m.blockerReason}</span>
        </div>
      )}

      {/* فراداده */}
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-faint">
        {m.deadline && (
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            مهلت: <span className={`tnum font-semibold ${live || pending ? 'text-gold' : 'text-muted'}`}>{relTime(m.deadline)}</span>
          </span>
        )}
        {submittedBy && <span className="text-muted">ثبت توسط: <span className="font-semibold text-text">{submittedBy.name}</span></span>}
        <span className="ms-auto flex items-center gap-1.5">
          <MiniCount icon="shield" value={m.evidenceCount} label="مدارک" tone="muted" />
          <MiniCount icon="chat" value={m.chatUnread} label="پیام‌های نخوانده" tone="gold" />
        </span>
      </div>

      {/* اقدامات */}
      <div className="relative flex flex-wrap items-center gap-2 pt-0.5">
        <button onClick={() => onOpenMatch(m.id)} className="btn-ghost !px-3 !py-2 text-[13px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
          بازکردن
        </button>
        {pending && (
          <button onClick={() => onRun('approve_result', { matchId: m.id })} className="btn-primary !px-3 !py-2 text-[13px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            تأییدِ نتیجه
          </button>
        )}
        {NO_SHOWABLE.includes(m.status) && (
          <button onClick={() => onRun('mark_no_show', { matchId: m.id })} className="btn-ghost !border-bad/40 !px-3 !py-2 text-[13px] !text-[#fca5a5] hover:!border-bad/60">
            ثبتِ عدمِ حضور
          </button>
        )}
      </div>
    </div>
  );
}

export function LiveMatchCenter({ cr, onOpenMatch, onRun }: { cr: ControlRoomState; onOpenMatch: (id: string) => void; onRun: (a: CRAction, p?: CRPayload) => void }) {
  const [scope, setScope] = useState<'current' | 'all'>('current');

  const currentMatches = useMemo(() => cr.matches.filter((m) => m.round === cr.currentRound), [cr.matches, cr.currentRound]);
  const shown = scope === 'current' ? currentMatches : cr.matches;

  const liveCount = shown.filter((m) => m.status === 'live').length;
  const pendingCount = shown.filter((m) => PENDING.includes(m.status)).length;

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 sm:p-5">
      {/* سرتیتر + سوییچِ دامنه */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-accent/12 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 3 14 9-14 9V3z" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-text">مرکزِ مسابقاتِ زنده</h2>
            <div className="flex items-center gap-2 text-[11px] text-faint">
              <span className="tnum">{fa(shown.length)} مسابقه</span>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[#fca5a5]"><span className="dot" />{fa(liveCount)} زنده</span>
              )}
              {pendingCount > 0 && <span className="text-gold tnum">{fa(pendingCount)} در انتظارِ تأیید</span>}
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-line bg-tile2 p-1">
          <button
            onClick={() => setScope('current')}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${scope === 'current' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'}`}
          >
            دورِ جاری
            <span className="ms-1.5 text-[11px] opacity-70 tnum">({fa(currentMatches.length)})</span>
          </button>
          <button
            onClick={() => setScope('all')}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${scope === 'all' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'}`}
          >
            همه‌ی مسابقات
            <span className="ms-1.5 text-[11px] opacity-70 tnum">({fa(cr.matches.length)})</span>
          </button>
        </div>
      </div>

      {/* شبکه‌ی کارت‌ها */}
      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => (
            <MatchCard key={m.id} cr={cr} m={m} onOpenMatch={onOpenMatch} onRun={onRun} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-tile2/40 px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tile2 text-faint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 3 14 9-14 9V3z" />
            </svg>
          </span>
          <div className="text-sm font-bold text-muted">
            {scope === 'current' ? 'در دورِ جاری مسابقه‌ای وجود ندارد' : 'هنوز هیچ مسابقه‌ای ساخته نشده'}
          </div>
          <p className="max-w-sm text-[12px] leading-6 text-faint">
            {scope === 'current'
              ? 'وقتی دورِ جاری ساخته شود، مسابقاتِ آن همراه با امتیاز، وضعیت و دکمه‌های اقدام اینجا نمایش داده می‌شوند. برای دیدنِ دورهای دیگر «همه‌ی مسابقات» را بزنید.'
              : 'پس از ساختِ براکت و شروعِ بازی‌ها، هر مسابقه به‌صورتِ یک کارتِ زنده در این بخش ظاهر می‌شود.'}
          </p>
          {scope === 'current' && cr.matches.length > 0 && (
            <button onClick={() => setScope('all')} className="btn-ghost mt-1 !px-3 !py-2 text-[13px]">
              نمایشِ همه‌ی {fmt(cr.matches.length)} مسابقه
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default LiveMatchCenter;
