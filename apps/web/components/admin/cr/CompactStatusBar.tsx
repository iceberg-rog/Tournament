'use client';

import { useState } from 'react';
import { FORMAT_FA } from '@/lib/admin';
import { PHASE_FA, relTime, type ControlRoomState } from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';

const TONE: Record<ControlRoomState['statusTone'], { chip: string; dot: string }> = {
  good: { chip: 'border-accent/30 bg-accent/10 text-[#5eead4]', dot: 'bg-accent' },
  warning: { chip: 'border-gold/35 bg-gold/10 text-gold', dot: 'bg-gold' },
  critical: { chip: 'border-bad/40 bg-bad/10 text-[#fca5a5]', dot: 'bg-bad' },
  idle: { chip: 'border-line bg-tile2 text-muted', dot: 'bg-slate-500' },
};

const I = (p: string) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: p }} />
);

function Chip({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-tile2 px-2.5 py-1 text-xs">
      <span className="text-faint">{label}</span>
      <span className={`font-semibold tnum ${tone ?? 'text-text'}`}>{value}</span>
    </span>
  );
}

export function CompactStatusBar({
  cr,
  onRun,
  onOpenChat,
  onReset,
}: {
  cr: ControlRoomState;
  onRun: (a: CRAction, p?: CRPayload) => void;
  onOpenChat: () => void;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const tone = TONE[cr.statusTone];
  const paused = cr.phase === 'admin_review';
  const fa = (n: number) => n.toLocaleString('fa-IR');

  return (
    <div className="sticky top-0 z-30 -mx-1 rounded-2xl border border-line bg-tile/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-tile/80">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* عنوان + متا */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 flex-none rounded-full ${tone.dot} ${cr.statusTone === 'critical' ? 'animate-pulse' : ''}`} />
            <h1 className="truncate font-display text-[15px] font-bold leading-tight">{cr.title}</h1>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-faint">{cr.game} · {FORMAT_FA[cr.format]}</p>
        </div>

        {/* وضعیتِ حیاتی */}
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${tone.chip}`}>{PHASE_FA[cr.phase]}</span>
        <Chip label="دور" value={`${fa(cr.currentRound)}/${fa(cr.totalRounds)}`} />
        {cr.openDisputes > 0 && <Chip label="مانع" value={`${fa(cr.openDisputes)} اختلاف`} tone="text-[#fca5a5]" />}

        {/* اقدام‌های سریع */}
        <div className="ms-auto flex items-center gap-1.5">
          {paused ? (
            <button onClick={() => onRun('resume')} className="btn-ghost px-2.5 py-1.5 text-xs" title="ادامه">{I('<path d="M8 5v14l11-7z"/>')}<span className="hidden sm:inline">ادامه</span></button>
          ) : (
            <button onClick={() => onRun('pause')} className="btn-ghost px-2.5 py-1.5 text-xs" title="توقف">{I('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>')}<span className="hidden sm:inline">توقف</span></button>
          )}
          <button onClick={onOpenChat} className="btn-ghost px-2.5 py-1.5 text-xs" title="اعلان">{I('<path d="M3 11l18-8-8 18-2-7-8-3z"/>')}<span className="hidden sm:inline">اعلان</span></button>
          <button
            onClick={() => { if (window.confirm('تورنومنت پایان یابد؟')) onRun('generate_next_round'); }}
            className="btn-ghost px-2.5 py-1.5 text-xs text-[#fca5a5]"
            title="پایانِ تورنومنت"
          >{I('<path d="M5 5h14v14H5z"/>')}<span className="hidden sm:inline">پایان</span></button>
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-line bg-tile2 px-2.5 py-1.5 text-xs text-muted transition hover:text-text">
            {open ? 'بستن' : 'جزئیات'}
          </button>
        </div>
      </div>

      {/* اقدامِ بعدی — همیشه visible */}
      {cr.summary.nextAction && cr.statusTone !== 'idle' && (
        <div className="mt-2 flex items-center gap-2 border-t border-line pt-2 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          <span className="text-faint">اقدامِ بعدی:</span>
          <span className="font-semibold text-[#5eead4]">{cr.summary.nextAction}</span>
        </div>
      )}

      {/* ردیفِ جزئیات (بازشونده) */}
      {open && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
          <Chip label="شرکت‌کننده" value={`${fa(cr.activeCount)}/${fa(cr.totalCount)}`} />
          <Chip label="مسابقاتِ این دور" value={`${fa(cr.currentRoundCompleted)}/${fa(cr.currentRoundTotal)}`} />
          <Chip label="نتایجِ معلق" value={fa(cr.pendingResults)} tone={cr.pendingResults ? 'text-gold' : undefined} />
          <Chip label="اختلافِ باز" value={fa(cr.openDisputes)} tone={cr.openDisputes ? 'text-[#fca5a5]' : undefined} />
          <Chip label="بعدی" value={relTime(cr.nextScheduled)} />
          <Chip label="پایانِ تخمینی" value={relTime(cr.estimatedFinish)} />
          {onReset && (
            <button onClick={onReset} className="ms-auto rounded-lg border border-dashed border-line px-2.5 py-1 text-[11px] text-faint transition hover:text-text" title="بازگرداندنِ نمونه‌ی نمایشی">
              بازنشانیِ نمونه
            </button>
          )}
        </div>
      )}
    </div>
  );
}
