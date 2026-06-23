'use client';

// نمای براکتِ تورنومنت — state-driven (نه تصویر). دورها به‌صورتِ ستون‌های افقی،
// هر مسابقه یک کارت (a در برابر b + امتیاز + وضعیت). دورِ جاری برجسته می‌شود.
// اکشن‌های سطحِ تورنومنت (ساختِ براکت) از runAction می‌گذرند؛ اکشن‌های سطحِ
// براکت (قفل/بازسازی) محلی‌اند و toast + audit ثبت می‌کنند. امتیازها فقط‌خواندنی.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { fmt, type Tone } from '@/lib/admin';
import { matchesFor, MATCH_FA, type Match, type MatchStatus } from '@/lib/admin/fixtures';
import { can } from '@/lib/admin/ops';
import { useAdminRole, useTournament, runAction, pushToast, appendAudit } from '@/lib/admin/store';

const MATCH_TONE: Record<MatchStatus, Tone> = {
  scheduled: 'muted',
  ready: 'accent',
  live: 'bad',
  result_submitted: 'gold',
  disputed: 'bad',
  admin_review: 'gold',
  completed: 'good',
  no_show: 'muted',
};

// نشانه‌ها (legend) — تنها وضعیت‌هایی که در براکت دیده می‌شوند.
const LEGEND: { status: MatchStatus; tone: Tone }[] = [
  { status: 'completed', tone: 'good' },
  { status: 'live', tone: 'bad' },
  { status: 'result_submitted', tone: 'gold' },
  { status: 'disputed', tone: 'bad' },
  { status: 'ready', tone: 'accent' },
  { status: 'scheduled', tone: 'muted' },
];

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function MatchCard({ m, winner }: { m: Match; winner: 'a' | 'b' | null }) {
  const meta = MATCH_FA[m.status];
  const tone = MATCH_TONE[m.status];
  const Side = ({ name, score, isWinner }: { name: string; score: number; isWinner: boolean }) => (
    <div className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${isWinner ? 'bg-good/10' : ''}`}>
      <span className={`flex min-w-0 items-center gap-1.5 ${isWinner ? 'text-white' : 'text-slate-300'}`}>
        {isWinner && <span className="flex-none text-good"><Icon d="M20 6 9 17l-5-5" size={12} /></span>}
        <span className="truncate text-xs font-semibold">{name || '—'}</span>
      </span>
      <span className={`flex-none tnum text-sm font-bold ${isWinner ? 'text-good' : 'text-faint'}`}>{fmt(score)}</span>
    </div>
  );
  return (
    <div className="rounded-xl border border-line bg-tile2 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] text-faint tnum">مسابقه‌ی {fmt(m.slot + 1)}</span>
        <AdminBadge label={meta} tone={tone} dot={m.status === 'live'} />
      </div>
      <div className="space-y-0.5">
        <Side name={m.a} score={m.scoreA} isWinner={winner === 'a'} />
        <div className="h-px bg-line/70" />
        <Side name={m.b} score={m.scoreB} isWinner={winner === 'b'} />
      </div>
    </div>
  );
}

export default function BracketPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');
  const [locked, setLocked] = useState(false);
  const [confirmRebuild, setConfirmRebuild] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  const matches = useMemo(() => (t ? matchesFor(t) : []), [t]);

  if (!t) return null;

  const mayManage = can(role, 'generate_bracket'); // قفل/بازسازی/ساخت همگی tournament:update می‌خواهند
  const currentRound = t.currentRound ?? 0;
  const rounds = matches.length
    ? Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b)
    : [];
  const lastRound = rounds.length ? rounds[rounds.length - 1] : 0;

  function roundLabel(r: number): string {
    const remaining = lastRound - r;
    if (remaining === 0) return 'فینال';
    if (remaining === 1) return 'نیمه‌نهایی';
    if (remaining === 2) return 'یک‌چهارمِ نهایی';
    return `دورِ ${fmt(r)}`;
  }

  // برنده‌ی هر مسابقه‌ی پایان‌یافته (فقط‌خواندنی) برای برجسته‌سازی.
  function winnerOf(m: Match): 'a' | 'b' | null {
    if (m.status !== 'completed') return null;
    if (m.scoreA === m.scoreB) return null;
    return m.scoreA > m.scoreB ? 'a' : 'b';
  }

  function generate() {
    runAction('generate_bracket', t!, { role, actorName });
  }

  function toggleLock() {
    if (!mayManage) return;
    const next = !locked;
    setLocked(next);
    pushToast({ kind: next ? 'success' : 'info', msg: next ? 'براکت قفل شد؛ بازسازی غیرفعال است' : 'قفلِ براکت برداشته شد' });
    appendAudit({
      actor: actorName,
      actorRole: role,
      action: next ? 'قفلِ براکت' : 'بازکردنِ قفلِ براکت',
      entityType: 'tournament',
      entityId: t!.id,
    });
  }

  function rebuild() {
    if (!mayManage || locked) return;
    setConfirmRebuild(false);
    pushToast({ kind: 'success', msg: 'براکت بازسازی شد (جفت‌بندی از نو)' });
    appendAudit({
      actor: actorName,
      actorRole: role,
      action: 'بازسازیِ براکت',
      entityType: 'tournament',
      entityId: t!.id,
      reason: 'جفت‌بندیِ مجدد بر اساسِ seedها',
    });
  }

  const noAccessTitle = mayManage ? undefined : 'دسترسی لازم را ندارید';

  return (
    <div className="space-y-4">
      {/* عنوانِ بخش */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">براکتِ تورنومنت</h2>
          <p className="mt-0.5 text-xs text-faint">
            {matches.length
              ? `${fmt(rounds.length)} دور · دورِ جاری ${fmt(currentRound)} · ${fmt(matches.length)} مسابقه`
              : 'هنوز دوری برای این تورنومنت ساخته نشده است.'}
          </p>
        </div>

        {matches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLock}
              disabled={!mayManage}
              title={noAccessTitle}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                locked ? 'border-gold/40 bg-gold/10 text-gold' : 'border-line text-slate-200 hover:border-accent-dim hover:text-white'
              }`}
            >
              <Icon d={locked ? 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z' : 'M7 11V7a5 5 0 0 1 9.9-1M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z'} size={13} />
              {locked ? 'بازکردنِ قفل' : 'قفلِ براکت'}
            </button>

            <button
              onClick={() => mayManage && !locked && setConfirmRebuild(true)}
              disabled={!mayManage || locked}
              title={locked ? 'براکت قفل است؛ ابتدا قفل را بردارید' : noAccessTitle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" size={13} />
              بازسازی
            </button>
          </div>
        )}
      </div>

      {/* تأییدِ درون‌خطیِ بازسازی */}
      {confirmRebuild && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/30 bg-bad/5 p-3">
          <p className="text-xs text-[#fca5a5]">
            بازسازیِ براکت جفت‌بندیِ فعلی را بازنشانی می‌کند. ادامه می‌دهید؟
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmRebuild(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-faint hover:text-text">انصراف</button>
            <button onClick={rebuild} className="btn-danger px-3 py-1.5 text-xs">بله، بازسازی کن</button>
          </div>
        </div>
      )}

      {matches.length === 0 ? (
        /* وضعیتِ خالی */
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-tile p-12 text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Icon d="M6 3v6a3 3 0 0 0 3 3h0M6 21v-6M18 3v6a3 3 0 0 1-3 3h0M18 21v-6M9 12h6M12 12v3" size={26} />
          </span>
          <p className="text-base font-bold">براکت هنوز ساخته نشده</p>
          <p className="mt-1 max-w-md text-xs text-faint">
            برای آغازِ مرحله‌ی حذفی، براکت را بسازید. حداقل {fmt(t.minParticipants)} شرکت‌کننده لازم است
            (اکنون {fmt(t.participants)}).
          </p>
          <button
            onClick={generate}
            disabled={!mayManage}
            title={noAccessTitle}
            className="btn-primary mt-5 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            ساختِ براکت
          </button>
        </div>
      ) : (
        <>
          {/* legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-tile px-4 py-2.5">
            <span className="text-[11px] font-semibold text-faint">راهنما:</span>
            {LEGEND.map((l) => (
              <span key={l.status} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                <span className={`h-2 w-2 rounded-full ${
                  l.tone === 'good' ? 'bg-good' : l.tone === 'bad' ? 'bg-bad' : l.tone === 'gold' ? 'bg-gold' : l.tone === 'accent' ? 'bg-accent' : 'bg-muted'
                }`} />
                {MATCH_FA[l.status]}
              </span>
            ))}
            {locked && (
              <span className="ms-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold">
                <Icon d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" size={12} />
                قفل‌شده
              </span>
            )}
          </div>

          {/* ستون‌های دورها */}
          <div className="hscroll flex gap-4 rounded-2xl border border-line bg-tile p-4">
            {rounds.map((r) => {
              const isCurrent = r === currentRound;
              const colMatches = matches.filter((m) => m.round === r);
              return (
                <div
                  key={r}
                  className={`flex w-60 flex-none flex-col gap-2.5 rounded-xl p-2.5 ${
                    isCurrent ? 'bg-accent/[.06] ring-1 ring-accent/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-accent' : 'text-slate-300'}`}>{roundLabel(r)}</span>
                    {isCurrent ? (
                      <span className="chip bg-accent/15 text-[#5eead4]">دورِ جاری</span>
                    ) : (
                      <span className="text-[10px] text-faint tnum">{fmt(colMatches.length)} مسابقه</span>
                    )}
                  </div>
                  {colMatches.map((m) => (
                    <MatchCard key={m.id} m={m} winner={winnerOf(m)} />
                  ))}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-faint">
            امتیازها در این نما فقط‌خواندنی است؛ ویرایش و تأییدِ نتایج در زبانه‌ی «مسابقات» انجام می‌شود.
          </p>
        </>
      )}

      {/* گزارشِ عملیاتِ همین تورنومنت */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 text-sm font-bold">گزارشِ عملیاتِ براکت</h3>
        <AuditLogList entityId={t.id} limit={8} />
      </div>
    </div>
  );
}
