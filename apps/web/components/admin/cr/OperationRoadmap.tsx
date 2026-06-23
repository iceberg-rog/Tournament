'use client';

import type { ControlRoomState, RoadmapStep } from '@/lib/admin/controlRoom';

/* ───────── icons (inline line SVG) ───────── */
function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function WarnIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18.5a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function DotIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

/* ───────── per-state visual config ───────── */
type StateMeta = {
  label: string;
  ring: string; // node border
  fill: string; // node background
  ico: string; // node icon color
  connector: string; // line to the next node
  pill: string; // small status chip classes
};

const STATE_META: Record<RoadmapStep['state'], StateMeta> = {
  completed: {
    label: 'انجام‌شده',
    ring: 'border-accent/70',
    fill: 'bg-accent/15',
    ico: 'text-[#5eead4]',
    connector: 'bg-accent/60',
    pill: 'bg-accent/15 text-[#5eead4] border-accent/30',
  },
  current: {
    label: 'در حالِ اجرا',
    ring: 'border-gold',
    fill: 'bg-gold/15',
    ico: 'text-gold',
    connector: 'bg-gradient-to-l from-gold/60 to-line',
    pill: 'bg-gold/15 text-gold border-gold/30',
  },
  blocked: {
    label: 'مسدود',
    ring: 'border-bad',
    fill: 'bg-bad/15',
    ico: 'text-[#fca5a5]',
    connector: 'bg-bad/40',
    pill: 'bg-bad/15 text-[#fca5a5] border-bad/40',
  },
  pending_admin: {
    label: 'منتظرِ مدیر',
    ring: 'border-amber-400/80',
    fill: 'bg-amber-400/15',
    ico: 'text-amber-300',
    connector: 'bg-amber-400/40',
    pill: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  },
  upcoming: {
    label: 'پیشِ‌رو',
    ring: 'border-dashed border-line',
    fill: 'bg-tile2',
    ico: 'text-faint',
    connector: 'bg-line/70',
    pill: 'bg-tile2 text-faint border-line',
  },
};

function StepIcon({ state }: { state: RoadmapStep['state'] }) {
  if (state === 'completed') return <CheckIcon size={18} />;
  if (state === 'blocked') return <WarnIcon size={18} />;
  if (state === 'pending_admin') return <ClockIcon size={18} />;
  if (state === 'current') return <DotIcon size={12} />;
  return <DotIcon size={9} />;
}

function Node({ step, index, isLast }: { step: RoadmapStep; index: number; isLast: boolean }) {
  const meta = STATE_META[step.state];
  const isCurrent = step.state === 'current';
  const isBlocked = step.state === 'blocked';
  const isPending = step.state === 'pending_admin';
  const faIndex = (index + 1).toLocaleString('fa-IR');

  return (
    <li className="relative flex min-w-[148px] max-w-[200px] flex-none flex-col items-center">
      {/* connector to the NEXT node (RTL → sits on the left side) */}
      {!isLast && (
        <span className={`pointer-events-none absolute end-[-50%] top-[26px] h-[3px] w-full ${meta.connector}`} aria-hidden />
      )}

      {/* node circle */}
      <span className="relative z-10 grid place-items-center" style={{ width: 52, height: 52 }}>
        {isCurrent && <span className="absolute inset-0 animate-ping rounded-full border-2 border-gold/60" aria-hidden />}
        {isCurrent && <span className="absolute inset-[-4px] rounded-full ring-2 ring-gold/40" aria-hidden />}
        {isBlocked && <span className="absolute inset-0 animate-pulse rounded-full bg-bad/20" aria-hidden />}
        <span className={`relative grid h-[52px] w-[52px] place-items-center rounded-full border-2 ${meta.ring} ${meta.fill} ${meta.ico}`}>
          <StepIcon state={step.state} />
        </span>
      </span>

      {/* index + status pill */}
      <span className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tnum ${meta.pill}`}>
        <span className="opacity-70">{faIndex}</span>
        <span>{meta.label}</span>
      </span>

      {/* label */}
      <span
        className={`mt-2 text-center text-[13px] leading-snug ${
          isCurrent ? 'font-display font-bold text-gold' : step.state === 'completed' ? 'font-display font-semibold text-accent' : isBlocked ? 'font-bold text-[#fca5a5]' : isPending ? 'font-semibold text-amber-200' : 'text-muted'
        }`}
      >
        {step.label}
      </span>

      {/* blocker / pending reason */}
      {(isBlocked || isPending) && step.blockerReason && (
        <span
          className={`mt-1.5 flex items-start gap-1 rounded-lg border px-2 py-1 text-center text-[11px] leading-snug ${
            isBlocked ? 'border-bad/30 bg-bad/10 text-[#fca5a5]' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
          }`}
        >
          <span className="mt-0.5 flex-none">
            {isBlocked ? <WarnIcon size={12} /> : <ClockIcon size={12} />}
          </span>
          <span>{step.blockerReason}</span>
        </span>
      )}
    </li>
  );
}

/* ───────── main component ───────── */
export function OperationRoadmap({ cr }: { cr: ControlRoomState }) {
  const steps = cr.roadmap ?? [];

  const counts = steps.reduce(
    (acc, s) => {
      acc[s.state] = (acc[s.state] ?? 0) + 1;
      return acc;
    },
    {} as Record<RoadmapStep['state'], number>,
  );
  const blockedTotal = (counts.blocked ?? 0) + (counts.pending_admin ?? 0);

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 md:p-5" dir="rtl" aria-label="مسیرِ عملیاتِ تورنومنت">
      {/* header */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-tile2 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 18 L9 13 L13 16 L20 8" />
              <circle cx="4" cy="18" r="1.6" fill="currentColor" />
              <circle cx="20" cy="8" r="1.6" fill="currentColor" />
            </svg>
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-white">مسیرِ عملیات</h3>
            <p className="text-[11px] text-faint">خطِ زمانیِ زنده‌ی برگزاری — از ثبت‌نام تا پرداختِ جایزه</p>
          </div>
        </div>

        {/* legend / blocker summary */}
        <div className="flex items-center gap-2">
          {blockedTotal > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/40 bg-bad/10 px-2.5 py-1 text-[11px] font-bold text-[#fca5a5]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              {blockedTotal.toLocaleString('fa-IR')} گام نیازمندِ اقدام
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-[#5eead4]">
              <CheckIcon size={12} />
              مسیر بدونِ انسداد
            </span>
          )}
        </div>
      </header>

      {/* roadmap track */}
      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-tile2 p-6 text-center text-[13px] text-faint">
          هنوز گامی برای این تورنومنت تعریف نشده؛ پس از باز شدنِ ثبت‌نام، مراحلِ برگزاری اینجا به‌ترتیب نمایش داده می‌شوند.
        </div>
      ) : (
        <div className="hscroll -mx-1 px-1 pb-2">
          <ol className="flex items-start gap-2 pt-1">
            {steps.map((s, i) => (
              <Node key={s.key} step={s} index={i} isLast={i === steps.length - 1} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
