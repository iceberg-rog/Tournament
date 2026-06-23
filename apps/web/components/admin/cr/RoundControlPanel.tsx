'use client';

import { fmt } from '@/lib/admin';
import type { ControlRoomState } from '@/lib/admin/controlRoom';

/** پنلِ موتورِ دور: وضعیتِ دورِ جاری + دروازه‌ی ساختِ دورِ بعد و موانعِ آن. */
export function RoundControlPanel({ cr, onGenerateNext }: { cr: ControlRoomState; onGenerateNext: () => void }) {
  const { currentRound, totalRounds, roundName, currentRoundCompleted, currentRoundTotal, nextRound } = cr;
  const pct = currentRoundTotal > 0 ? Math.round((currentRoundCompleted / currentRoundTotal) * 100) : 0;
  const allDone = currentRoundTotal > 0 && currentRoundCompleted >= currentRoundTotal;

  return (
    <section className="rounded-2xl border border-line bg-tile p-5">
      {/* سرتیترِ موتورِ دور */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-faint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9" />
              <path d="M21 3v6h-6" />
            </svg>
            موتورِ دور
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-text">
            {roundName}
          </h3>
          <div className="mt-0.5 text-xs text-muted">
            دورِ <span className="tnum text-text">{currentRound.toLocaleString('fa-IR')}</span> از{' '}
            <span className="tnum text-text">{totalRounds.toLocaleString('fa-IR')}</span>
          </div>
        </div>
        <span
          className={`inline-flex flex-none items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
            nextRound.ready
              ? 'border-good/30 bg-good/15 text-good'
              : 'border-bad/30 bg-bad/15 text-[#fca5a5]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full bg-current ${nextRound.ready ? '' : 'animate-pulse'}`} />
          {nextRound.ready ? 'آماده‌ی پیشروی' : 'مسدود'}
        </span>
      </div>

      {/* پیشرفتِ مسابقاتِ دورِ جاری */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="font-bold text-muted">مسابقاتِ کامل‌شده</span>
          <span className="tnum font-bold text-text">
            {currentRoundCompleted.toLocaleString('fa-IR')}
            <span className="text-faint"> / {currentRoundTotal.toLocaleString('fa-IR')}</span>
          </span>
        </div>
        <div className="pbar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-left text-[11px] tnum text-faint">٪{pct.toLocaleString('fa-IR')}</div>
      </div>

      {/* دروازه‌ی دورِ بعد */}
      <div className="mt-4 border-t border-line pt-4">
        {nextRound.ready ? (
          <div>
            <button onClick={onGenerateNext} className="btn-primary w-full justify-center py-3 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m13 19 6-7-6-7" />
                <path d="M5 19l6-7-6-7" />
              </svg>
              {nextRound.label}
            </button>
            <p className="mt-2 text-center text-[11px] text-faint">
              {allDone
                ? 'همه‌ی مسابقاتِ این دور نهایی شد؛ دورِ بعد آماده‌ی ساخت است.'
                : 'هیچ مانعی باز نیست؛ می‌توانید دورِ بعد را بسازید.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-bad/40 bg-bad/[0.07] p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-bad/20 text-[#fca5a5]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#fca5a5]">دورِ بعدی آماده نیست</div>
                <div className="text-[11px] text-muted">
                  {fmt(nextRound.reasons.length)} مانع باید رفع شود تا «{nextRound.label}» باز شود.
                </div>
              </div>
            </div>

            <ul className="mt-3 space-y-1.5">
              {nextRound.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-bad/25 bg-bad/[0.06] px-3 py-2">
                  <svg className="mt-0.5 flex-none text-[#fca5a5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                  <span className="text-[13px] leading-5 text-text">{reason}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-xl border border-line bg-tile2 py-2.5 text-center text-xs font-bold text-faint"
              title="ابتدا موانعِ بالا را رفع کنید"
            >
              {nextRound.label} (قفل)
            </button>
            <p className="mt-2 text-center text-[11px] text-faint">
              با رفعِ هر مانع، این دکمه آزاد می‌شود و می‌توانید دورِ بعد را بسازید.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default RoundControlPanel;
