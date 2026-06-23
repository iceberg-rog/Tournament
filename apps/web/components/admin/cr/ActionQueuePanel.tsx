'use client';

import type { ActionQueueItem, ControlRoomState } from '@/lib/admin/controlRoom';
import { participantById } from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';

/**
 * «اقدام‌های لازم» — مهم‌ترین پنلِ اتاقِ کنترل.
 * صفِ ازپیش‌مرتب‌شده‌ی cr.actionQueue را نشان می‌دهد؛ هر ردیف یک دکمه‌ی
 * مستقیم دارد که onAct(item) را صدا می‌زند. ردیف‌های بحرانی بلندترین صدا را دارند.
 */

const PRIORITY: Record<
  ActionQueueItem['priority'],
  { ring: string; dot: string; rail: string; label: string; chipBg: string; chipText: string }
> = {
  critical: {
    ring: 'border-bad/60 bg-bad/[0.06] shadow-[0_0_0_1px_rgba(248,113,113,.25),0_18px_40px_-24px_rgba(248,113,113,.7)]',
    dot: 'bg-bad',
    rail: 'bg-bad',
    label: 'بحرانی',
    chipBg: 'bg-bad/15 border-bad/40',
    chipText: 'text-[#fca5a5]',
  },
  warning: {
    ring: 'border-gold/45 bg-gold/[0.04]',
    dot: 'bg-gold',
    rail: 'bg-gold',
    label: 'هشدار',
    chipBg: 'bg-gold/15 border-gold/35',
    chipText: 'text-gold',
  },
  normal: {
    ring: 'border-line bg-tile2',
    dot: 'bg-accent',
    rail: 'bg-accent',
    label: 'عادی',
    chipBg: 'bg-accent/15 border-accent/30',
    chipText: 'text-[#5eead4]',
  },
};

const ACTION_LABEL: Record<ActionQueueItem['action'], string> = {
  resolve_dispute: 'حلِ اختلاف',
  approve_result: 'تأییدِ نتیجه',
  mark_no_show: 'ثبتِ عدمِ حضور',
  generate_next_round: 'ساختِ دورِ بعد',
  release_prize: 'آزادسازیِ جایزه',
  open_match: 'بازکردن',
  review_evidence: 'بازکردن',
  message: 'بازکردن',
  pause: 'بازکردن',
};

function ActionIcon({ action }: { action: ActionQueueItem['action'] }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (action) {
    case 'resolve_dispute':
    case 'review_evidence':
      return (<svg {...common}><path d="M12 3 4 7v5c0 4.5 3.2 7.3 8 9 4.8-1.7 8-4.5 8-9V7l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>);
    case 'approve_result':
      return (<svg {...common}><path d="M20 6 9 17l-5-5" /></svg>);
    case 'mark_no_show':
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></svg>);
    case 'generate_next_round':
      return (<svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
    case 'release_prize':
      return (<svg {...common}><path d="M6 9h12l-1 11H7L6 9Z" /><path d="M9 9a3 3 0 1 1 6 0" /><path d="M12 13v3" /></svg>);
    default:
      return (<svg {...common}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>);
  }
}

function Counts({ critical, warning, normal }: { critical: number; warning: number; normal: number }) {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  return (
    <div className="flex items-center gap-1.5">
      {critical > 0 && <span className="chip bg-bad/15 border border-bad/40 text-[#fca5a5] tnum">{fa(critical)} بحرانی</span>}
      {warning > 0 && <span className="chip bg-gold/15 border border-gold/35 text-gold tnum">{fa(warning)} هشدار</span>}
      {normal > 0 && <span className="chip bg-accent/15 border border-accent/30 text-[#5eead4] tnum">{fa(normal)} عادی</span>}
    </div>
  );
}

function Row({ cr, item, onAct }: { cr: ControlRoomState; item: ActionQueueItem; onAct: (i: ActionQueueItem) => void }) {
  const P = PRIORITY[item.priority];
  const critical = item.priority === 'critical';
  const subject =
    participantById(cr, item.participantId) ??
    (() => {
      const m = item.matchId ? cr.matches.find((x) => x.id === item.matchId) : undefined;
      return participantById(cr, m?.submittedById) ?? participantById(cr, m?.aId);
    })();

  return (
    <li className={`relative overflow-hidden rounded-2xl border p-4 transition ${P.ring} ${critical ? 'animate-pulse' : ''}`}>
      {/* ریلِ رنگیِ کنارِ ردیف — نشانه‌ی فوریت */}
      <span className={`absolute inset-y-2 start-0 w-1 rounded-full ${P.rail}`} aria-hidden />

      <div className="flex items-start gap-3 ps-2">
        {subject ? (
          <Avatar p={subject} size={38} />
        ) : (
          <span className={`grid h-[38px] w-[38px] flex-none place-items-center rounded-lg ${P.chipBg} border ${P.chipText}`}>
            <ActionIcon action={item.action} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 flex-none rounded-full ${P.dot} ${critical ? 'animate-pulse' : ''}`} aria-hidden />
            <span className={`chip border px-2 py-0.5 text-[10px] ${P.chipBg} ${P.chipText}`}>{P.label}</span>
          </div>
          <h4 className="mt-1.5 font-display text-[15px] font-bold leading-snug text-text">{item.title}</h4>
          <p className={`mt-1 text-[13px] leading-relaxed ${critical ? 'text-[#fca5a5]' : 'text-muted'}`}>{item.detail}</p>
        </div>

        <button
          type="button"
          onClick={() => onAct(item)}
          className={`flex-none whitespace-nowrap ${critical ? 'btn-danger' : 'btn-primary'}`}
        >
          <ActionIcon action={item.action} />
          {ACTION_LABEL[item.action]}
        </button>
      </div>
    </li>
  );
}

export function ActionQueuePanel({
  cr,
  onAct,
}: {
  cr: ControlRoomState;
  onAct: (item: ActionQueueItem) => void;
}) {
  const queue = cr.actionQueue;
  const critical = queue.filter((q) => q.priority === 'critical').length;
  const warning = queue.filter((q) => q.priority === 'warning').length;
  const normal = queue.filter((q) => q.priority === 'normal').length;

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${critical ? 'bg-bad/15 text-bad' : queue.length ? 'bg-gold/15 text-gold' : 'bg-accent/15 text-accent'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-text">اقدام‌های لازم</h2>
            <p className="text-xs text-faint">
              {queue.length
                ? <span className="tnum">{queue.length.toLocaleString('fa-IR')} موردِ نیازمندِ تصمیم</span>
                : 'صفِ اقدامات خالی است'}
            </p>
          </div>
        </div>
        {queue.length > 0 && <Counts critical={critical} warning={warning} normal={normal} />}
      </header>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-tile2 px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-good/15 text-good">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2L16 9" />
            </svg>
          </span>
          <p className="font-display text-sm font-bold text-text">اقدامِ فوری‌ای لازم نیست؛ همه‌چیز در جریان است.</p>
          <p className="max-w-[34ch] text-xs leading-relaxed text-faint">
            هر زمان نتیجه‌ای در انتظارِ تأیید بماند، اختلافی باز شود، بازیکنی غایب شود یا دورِ بعد آماده‌ی ساخت شود، اینجا به‌صورتِ یک اقدامِ مستقیم ظاهر می‌شود.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((item) => (
            <Row key={item.id} cr={cr} item={item} onAct={onAct} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ActionQueuePanel;
