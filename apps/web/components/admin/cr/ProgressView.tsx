'use client';

import { useMemo } from 'react';
import { fmt } from '@/lib/admin';
import {
  CRMATCH_FA,
  participantById,
  type ControlRoomState,
  type CRMatch,
  type LeaderboardRow,
  type StandingRow,
} from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';

const fa = (n: number) => n.toLocaleString('fa-IR');

const ELIM_FORMATS = new Set(['single_elimination', 'double_elimination', 'custom', 'ladder']);

/** نمای پیشرفت — متناسب با فرمتِ تورنومنت: براکت / جدول / لیدربورد. */
export function ProgressView({ cr, onOpenMatch }: { cr: ControlRoomState; onOpenMatch: (id: string) => void }) {
  const mode: 'bracket' | 'table' | 'leaderboard' =
    cr.format === 'battle_royale'
      ? 'leaderboard'
      : cr.format === 'round_robin' || cr.format === 'league' || cr.format === 'swiss'
        ? 'table'
        : ELIM_FORMATS.has(cr.format)
          ? 'bracket'
          : 'bracket';

  const title = mode === 'leaderboard' ? 'لیدربورد' : mode === 'table' ? 'جدول' : 'براکت';
  const sub =
    mode === 'leaderboard'
      ? 'مجموعِ امتیازِ ردهٔ پایانی و کیل'
      : mode === 'table'
        ? 'رده‌بندیِ کلیِ شرکت‌کننده‌ها'
        : 'درختِ مسابقات، دور به دور';

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 md:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-accent/12 text-accent">
            <BracketIcon mode={mode} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold leading-none text-text">{title}</h2>
            <div className="mt-1 text-xs text-faint">{sub}</div>
          </div>
        </div>
        {mode === 'bracket' && cr.currentRoundTotal > 0 && (
          <AdminBadge
            label={`دورِ جاری: ${cr.roundName} · ${fa(cr.currentRoundCompleted)}/${fa(cr.currentRoundTotal)}`}
            tone="accent"
          />
        )}
      </header>

      {mode === 'bracket' && <Bracket cr={cr} onOpenMatch={onOpenMatch} />}
      {mode === 'table' && <StandingsTable rows={cr.standings ?? []} />}
      {mode === 'leaderboard' && <Leaderboard rows={cr.leaderboard ?? []} cr={cr} />}
    </section>
  );
}

/* ───────────────────────── BRACKET ───────────────────────── */

function Bracket({ cr, onOpenMatch }: { cr: ControlRoomState; onOpenMatch: (id: string) => void }) {
  const rounds = useMemo(() => {
    const byRound = new Map<number, CRMatch[]>();
    for (const m of cr.matches) {
      const arr = byRound.get(m.round) ?? [];
      arr.push(m);
      byRound.set(m.round, arr);
    }
    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({
        round,
        name: matches[0]?.roundName ?? `دور ${fa(round)}`,
        matches: matches.slice().sort((a, b) => a.number - b.number),
      }));
  }, [cr.matches]);

  if (rounds.length === 0) {
    return (
      <EmptyState text="هنوز براکتی ساخته نشده؛ پس از سیدبندی و ساختِ دورِ اول، مسابقاتِ هر دور به‌صورتِ ستون اینجا نمایش داده می‌شود." />
    );
  }

  return (
    <div className="hscroll -mx-1 px-1 pb-2">
      <div className="flex min-w-max items-stretch gap-4">
        {rounds.map((col) => {
          const isCurrent = col.round === cr.currentRound;
          return (
            <div key={col.round} className="flex w-[252px] flex-none flex-col">
              <div
                className={`mb-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 ${
                  isCurrent ? 'border-accent/40 bg-accent/10' : 'border-line bg-tile2'
                }`}
              >
                <span className={`text-xs font-bold ${isCurrent ? 'text-accent' : 'text-muted'}`}>{col.name}</span>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                    دورِ جاری
                  </span>
                ) : (
                  <span className="text-[10px] text-faint">{fa(col.matches.length)} مسابقه</span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {col.matches.map((m) => (
                  <BracketNode key={m.id} m={m} cr={cr} onOpenMatch={onOpenMatch} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketNode({ m, cr, onOpenMatch }: { m: CRMatch; cr: ControlRoomState; onOpenMatch: (id: string) => void }) {
  const a = participantById(cr, m.aId);
  const b = participantById(cr, m.bId);
  const disputed = m.status === 'disputed' || !!m.disputeId;
  const live = m.status === 'live';
  const completed = m.status === 'completed';
  const blocked = !!m.blockerReason && !disputed;

  const border = disputed
    ? 'border-bad/60 ring-1 ring-bad/30'
    : live
      ? 'border-accent/55'
      : blocked
        ? 'border-bad/40'
        : 'border-line hover:border-line2';

  return (
    <button
      type="button"
      onClick={() => onOpenMatch(m.id)}
      className={`group relative w-full rounded-xl border bg-tile2 p-2.5 text-start transition ${border} ${
        completed ? 'opacity-80' : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-faint tnum">مسابقه #{fa(m.number)}</span>
        <StatusTag m={m} />
      </div>

      <Side p={a} score={m.scoreA} isWinner={completed && m.winnerId === m.aId} isLoser={completed && !!m.winnerId && m.winnerId !== m.aId} live={live} />
      <div className="my-1 h-px bg-line" />
      <Side p={b} score={m.scoreB} isWinner={completed && m.winnerId === m.bId} isLoser={completed && !!m.winnerId && m.winnerId !== m.bId} live={live} />

      {disputed && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-bad/40 bg-bad/10 px-2 py-1 text-[11px] font-semibold leading-snug text-[#fca5a5]">
          <WarnIcon />
          <span>{m.blockerReason ?? 'این مسابقه اختلافِ باز دارد و نیاز به داوری دارد.'}</span>
        </p>
      )}
      {blocked && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-bad/40 bg-bad/10 px-2 py-1 text-[11px] font-semibold leading-snug text-[#fca5a5]">
          <WarnIcon />
          <span>{m.blockerReason}</span>
        </p>
      )}
    </button>
  );
}

function Side({
  p,
  score,
  isWinner,
  isLoser,
  live,
}: {
  p: ReturnType<typeof participantById>;
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  live: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-1.5 py-1 ${
        isWinner ? 'bg-accent/12' : ''
      } ${isLoser ? 'opacity-50' : ''}`}
    >
      <Avatar p={p ?? null} size={26} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${
          isWinner ? 'font-bold text-text' : isLoser ? 'text-muted' : 'text-text'
        }`}
      >
        {p ? p.name : <span className="text-faint">در انتظارِ مشخص‌شدن</span>}
      </span>
      {isWinner && <WinTick />}
      <span
        className={`font-display text-sm tnum ${
          isWinner ? 'font-bold text-accent' : isLoser ? 'text-faint' : live ? 'font-bold text-text' : 'text-muted'
        }`}
      >
        {p ? fa(score) : '—'}
      </span>
    </div>
  );
}

function StatusTag({ m }: { m: CRMatch }) {
  if (m.status === 'disputed' || m.disputeId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-bad/40 bg-bad/15 px-1.5 py-0.5 text-[10px] font-bold text-[#fca5a5]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        {CRMATCH_FA.disputed}
      </span>
    );
  }
  if (m.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        {CRMATCH_FA.live}
      </span>
    );
  }
  const tone =
    m.status === 'completed'
      ? 'border-line bg-tile text-faint'
      : m.status === 'result_submitted' || m.status === 'awaiting_opponent_confirmation' || m.status === 'admin_review'
        ? 'border-gold/40 bg-gold/12 text-gold'
        : m.status === 'no_show' || m.status === 'cancelled'
          ? 'border-bad/40 bg-bad/12 text-[#fca5a5]'
          : 'border-line bg-tile2 text-muted';
  return <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>{CRMATCH_FA[m.status]}</span>;
}

/* ───────────────────────── STANDINGS TABLE ───────────────────────── */

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState text="جدولی برای نمایش نیست؛ پس از برگزاری و تأییدِ نخستین مسابقات، رده‌بندیِ شرکت‌کننده‌ها بر اساسِ امتیاز اینجا ساخته می‌شود." />
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-tile2 text-[11px] font-bold text-muted">
            <th className="px-3 py-2.5 text-start">#</th>
            <th className="px-3 py-2.5 text-start">شرکت‌کننده</th>
            <th className="px-2 py-2.5 text-center" title="بازی‌ها">ب</th>
            <th className="px-2 py-2.5 text-center text-good" title="برد">و</th>
            <th className="px-2 py-2.5 text-center text-muted" title="مساوی">م</th>
            <th className="px-2 py-2.5 text-center text-bad" title="باخت">ش</th>
            <th className="px-2 py-2.5 text-center" title="تفاضل">±</th>
            <th className="px-3 py-2.5 text-center">امتیاز</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const leader = i === 0;
            return (
              <tr
                key={r.id}
                className={`border-t border-line ${leader ? 'bg-accent/8' : 'hover:bg-white/[.02]'}`}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-md font-display text-xs font-bold tnum ${
                      leader ? 'bg-accent text-[#06231f]' : 'bg-tile2 text-muted'
                    }`}
                  >
                    {fa(i + 1)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar p={{ name: r.name, color: r.color, initials: initials(r.name) }} size={28} />
                    <span className={`truncate ${leader ? 'font-bold text-text' : 'text-text'}`}>{r.name}</span>
                    {leader && <AdminBadge label="صدرنشین" tone="accent" />}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-muted tnum">{fa(r.played)}</td>
                <td className="px-2 py-2.5 text-center font-bold text-good tnum">{fa(r.win)}</td>
                <td className="px-2 py-2.5 text-center text-muted tnum">{fa(r.draw)}</td>
                <td className="px-2 py-2.5 text-center text-bad tnum">{fa(r.loss)}</td>
                <td className={`px-2 py-2.5 text-center tnum ${r.diff > 0 ? 'text-good' : r.diff < 0 ? 'text-bad' : 'text-muted'}`}>
                  {r.diff > 0 ? '+' : ''}
                  {fa(r.diff)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`font-display text-base font-bold tnum ${leader ? 'text-accent' : 'text-text'}`}>{fa(r.points)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── BATTLE ROYALE LEADERBOARD ───────────────────────── */

function Leaderboard({ rows, cr }: { rows: LeaderboardRow[]; cr: ControlRoomState }) {
  if (rows.length === 0) {
    return (
      <EmptyState text="لیدربوردی برای نمایش نیست؛ پس از ثبتِ امتیازِ ردهٔ پایانی و کیلِ هر مَچ، رتبه‌بندیِ کلی اینجا محاسبه می‌شود." />
    );
  }
  const max = Math.max(...rows.map((r) => r.total), 1);
  const championId = cr.summary.championId;
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const top1 = i === 0;
        const top3 = i < 3;
        const isChamp = championId === r.id;
        const rankTone = top1 ? 'bg-gold text-[#1a1407]' : i === 1 ? 'bg-[#cbd5e1] text-[#0b0c10]' : i === 2 ? 'bg-[#b45309] text-white' : 'bg-tile2 text-muted';
        return (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              top1
                ? 'border-gold/45 bg-gold/10'
                : top3
                  ? 'border-accent/35 bg-accent/8'
                  : 'border-line bg-tile2'
            }`}
          >
            <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg font-display text-xs font-bold tnum ${rankTone}`}>
              {fa(i + 1)}
            </span>
            <Avatar p={{ name: r.name, color: r.color, initials: initials(r.name) }} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`truncate text-sm ${top3 ? 'font-bold text-text' : 'text-text'}`}>{r.name}</span>
                {isChamp && <AdminBadge label="قهرمان" tone="gold" />}
              </div>
              <div className="pbar mt-1.5">
                <span style={{ width: `${Math.max(6, (r.total / max) * 100)}%` }} />
              </div>
            </div>
            <div className="flex flex-none items-center gap-3 text-end">
              <Stat label="رده" value={fa(r.placementPts)} />
              <Stat label="کیل" value={fa(r.killPts)} />
              <div className="ps-1">
                <div className="text-[10px] text-faint">مجموع</div>
                <div className={`font-display text-base font-bold tnum ${top1 ? 'text-gold' : top3 ? 'text-accent' : 'text-text'}`}>{fa(r.total)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden text-center sm:block">
      <div className="text-[10px] text-faint">{label}</div>
      <div className="font-display text-sm text-muted tnum">{value}</div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-tile2 px-6 py-10 text-center">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-tile text-faint">
        <BracketIcon mode="bracket" />
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}

const initials = (name: string) =>
  name.replace(/[#\d]/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '؟';

function BracketIcon({ mode }: { mode: 'bracket' | 'table' | 'leaderboard' }) {
  if (mode === 'table') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16" />
      </svg>
    );
  }
  if (mode === 'leaderboard') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v4a2 2 0 0 0 2 2h4M6 19v-4a2 2 0 0 1 2-2h4M12 8h6M12 16h6" />
    </svg>
  );
}

function WinTick() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="flex-none text-accent">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />
    </svg>
  );
}
