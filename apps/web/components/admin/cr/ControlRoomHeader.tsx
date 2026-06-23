'use client';

import { FORMAT_FA, fmt, type Tone } from '@/lib/admin';
import { PHASE_FA, relTime, type ControlRoomState, type StatusTone } from '@/lib/admin/controlRoom';

/** نگاشتِ تنِ وضعیت به رنگ‌ها و برچسبِ فارسی. */
const TONE_META: Record<StatusTone, { strip: string; phaseBg: string; phaseText: string; phaseBorder: string; badge: Tone; dotLabel: string; pulse: boolean }> = {
  good: { strip: 'bg-accent', phaseBg: 'bg-accent/15', phaseText: 'text-[#5eead4]', phaseBorder: 'border-accent/35', badge: 'accent', dotLabel: 'در جریان', pulse: true },
  warning: { strip: 'bg-gold', phaseBg: 'bg-gold/15', phaseText: 'text-gold', phaseBorder: 'border-gold/35', badge: 'gold', dotLabel: 'نیازمندِ توجه', pulse: true },
  critical: { strip: 'bg-bad', phaseBg: 'bg-bad/15', phaseText: 'text-[#fca5a5]', phaseBorder: 'border-bad/40', badge: 'bad', dotLabel: 'بحرانی', pulse: true },
  idle: { strip: 'bg-line2', phaseBg: 'bg-tile2', phaseText: 'text-muted', phaseBorder: 'border-line', badge: 'muted', dotLabel: 'پایان‌یافته', pulse: false },
};

function StatChip({
  label,
  children,
  tone = 'muted',
  hint,
}: {
  label: string;
  children: React.ReactNode;
  tone?: 'muted' | 'gold' | 'bad' | 'good';
  hint?: React.ReactNode;
}) {
  const ring =
    tone === 'gold'
      ? 'border-gold/40 bg-gold/10'
      : tone === 'bad'
        ? 'border-bad/45 bg-bad/10'
        : tone === 'good'
          ? 'border-good/40 bg-good/10'
          : 'border-line bg-tile2';
  const valColor = tone === 'gold' ? 'text-gold' : tone === 'bad' ? 'text-[#fca5a5]' : tone === 'good' ? 'text-good' : 'text-text';
  return (
    <div className={`flex min-w-[7.5rem] flex-col gap-1 rounded-xl border px-3 py-2 ${ring}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-faint">{label}</span>
      <span className={`font-display tnum text-sm font-bold leading-none ${valColor}`}>{children}</span>
      {hint}
    </div>
  );
}

/** هدرِ چسبانِ وضعیت — یک نگاه: تورنومنت کجاست و ادمین چه باید بکند. */
export function ControlRoomHeader({ cr }: { cr: ControlRoomState }) {
  const meta = TONE_META[cr.statusTone];
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const roundPct = cr.currentRoundTotal > 0 ? Math.round((cr.currentRoundCompleted / cr.currentRoundTotal) * 100) : 0;
  const nextAction = cr.summary.nextAction;
  const blockers = cr.summary.blockers ?? [];
  const isLive = cr.statusTone === 'good' || cr.statusTone === 'warning' || cr.statusTone === 'critical';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-tile/85 backdrop-blur-md supports-[backdrop-filter]:bg-tile/70">
      <div className="relative overflow-hidden">
        {/* نوارِ تنِ وضعیت در لبه‌ی شروع (RTL: راست) */}
        <span className={`absolute inset-y-0 start-0 w-1 ${meta.strip}`} aria-hidden />

        <div className="flex flex-wrap items-stretch gap-x-5 gap-y-3 px-5 py-3.5 ps-6">
          {/* ── هویتِ تورنومنت + فاز ── */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {/* بَجِ بزرگِ فاز */}
            <div className={`flex flex-none flex-col items-center justify-center rounded-2xl border px-4 py-2.5 ${meta.phaseBg} ${meta.phaseBorder}`}>
              <span className="flex items-center gap-1.5">
                {isLive && <span className={`h-2 w-2 rounded-full bg-current ${meta.pulse ? 'animate-pulse' : ''} ${meta.phaseText}`} aria-hidden />}
                <span className={`font-display text-lg font-bold leading-none ${meta.phaseText}`}>{PHASE_FA[cr.phase]}</span>
              </span>
              <span className="mt-1 text-[10px] font-bold text-faint">{meta.dotLabel}</span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-base font-bold text-text">{cr.title}</h1>
                <span className="chip border border-line bg-tile2 text-accent">{FORMAT_FA[cr.format]}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span className="text-faint">{cr.game}</span>
                <span className="text-faint" aria-hidden>·</span>
                <span className="font-medium text-text">{cr.roundName}</span>
                <span className="text-faint">
                  · دورِ {fa(cr.currentRound)} از {fa(cr.totalRounds)}
                </span>
              </div>
            </div>
          </div>

          {/* ── چیپ‌های آماری ── */}
          <div className="hscroll flex items-stretch gap-2">
            <StatChip label="شرکت‌کننده">
              <span className="text-good">{fa(cr.activeCount)}</span>
              <span className="text-faint"> / {fa(cr.totalCount)}</span>
            </StatChip>

            <StatChip
              label="مسابقاتِ این دور"
              hint={
                <span className="pbar mt-0.5 w-full" aria-label={`${fa(roundPct)} درصد کامل`}>
                  <span style={{ width: `${roundPct}%` }} />
                </span>
              }
            >
              {fa(cr.currentRoundCompleted)} / {fa(cr.currentRoundTotal)}
            </StatChip>

            <StatChip label="نتایجِ معلق" tone={cr.pendingResults > 0 ? 'gold' : 'muted'}>
              {fa(cr.pendingResults)}
            </StatChip>

            <StatChip label="اختلافِ باز" tone={cr.openDisputes > 0 ? 'bad' : 'muted'}>
              {fa(cr.openDisputes)}
            </StatChip>

            <StatChip label="بعدی">{relTime(cr.nextScheduled)}</StatChip>

            <StatChip label="پایانِ تخمینی">{relTime(cr.estimatedFinish)}</StatChip>
          </div>
        </div>

        {/* ── اقدامِ بعدیِ ادمین ── */}
        {nextAction && (
          <div className={`flex flex-wrap items-center gap-2 border-t px-5 py-2 ps-6 text-sm ${cr.openDisputes > 0 ? 'border-bad/30 bg-bad/[0.07]' : cr.pendingResults > 0 ? 'border-gold/25 bg-gold/[0.06]' : 'border-line bg-tile2/40'}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${cr.openDisputes > 0 ? 'text-[#fca5a5]' : cr.pendingResults > 0 ? 'text-gold' : 'text-accent'}`} aria-hidden>
              <path d="m13 2-3 7h6l-3 7" />
              <circle cx="12" cy="20" r="0.5" />
            </svg>
            <span className="font-bold text-faint">اقدامِ بعدیِ ادمین:</span>
            <span className="font-bold text-text">{nextAction}</span>
            {blockers.length > 0 && (
              <span className="ms-1 flex flex-wrap items-center gap-1.5">
                {blockers.slice(0, 3).map((b, i) => (
                  <span key={i} className="chip border border-bad/40 bg-bad/10 text-[#fca5a5]">
                    {b}
                  </span>
                ))}
                {blockers.length > 3 && <span className="text-xs text-faint">+{fmt(blockers.length - 3)} مورد دیگر</span>}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default ControlRoomHeader;
