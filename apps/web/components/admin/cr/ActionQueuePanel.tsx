'use client';

import { useState } from 'react';
import type { ActionQueueItem, ControlRoomState } from '@/lib/admin/controlRoom';
import { participantById } from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';

/**
 * «اقدام‌های لازم» — مهم‌ترین پنلِ اتاقِ کنترل.
 * هر کارت context کامل دارد (بازیکن/مسابقه/دور/حریف/مهلت/یادآوری/اثر/پیشنهاد)،
 * دکمه‌ی اصلی برای اقدام‌های حساس مودالِ تأیید باز می‌کند، و دکمه‌های ثانویه
 * (پیام/بازکردن/رد) واقعی هستند.
 */

const PRIORITY: Record<ActionQueueItem['priority'], { ring: string; dot: string; rail: string; label: string; chipBg: string; chipText: string }> = {
  critical: { ring: 'border-bad/60 bg-bad/[0.06] shadow-[0_0_0_1px_rgba(248,113,113,.25),0_18px_40px_-24px_rgba(248,113,113,.7)]', dot: 'bg-bad', rail: 'bg-bad', label: 'بحرانی', chipBg: 'bg-bad/15 border-bad/40', chipText: 'text-[#fca5a5]' },
  warning: { ring: 'border-gold/45 bg-gold/[0.04]', dot: 'bg-gold', rail: 'bg-gold', label: 'هشدار', chipBg: 'bg-gold/15 border-gold/35', chipText: 'text-gold' },
  normal: { ring: 'border-line bg-tile2', dot: 'bg-accent', rail: 'bg-accent', label: 'عادی', chipBg: 'bg-accent/15 border-accent/30', chipText: 'text-[#5eead4]' },
};

const ACTION_LABEL: Record<ActionQueueItem['action'], string> = {
  resolve_dispute: 'حلِ اختلاف',
  approve_result: 'تأییدِ نتیجه',
  mark_no_show: 'ثبتِ عدمِ حضور',
  generate_next_round: 'ساختِ دورِ بعد',
  release_prize: 'آزادسازیِ جایزه',
  open_match: 'بازکردنِ مسابقه',
  review_evidence: 'بررسیِ مدرک',
  message: 'بازکردن',
  pause: 'بازکردن',
};

const fa = (n: number) => n.toLocaleString('fa-IR');
const clock = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : undefined; } catch { return undefined; } };

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

function MetaRow({ label, value, tone }: { label: string; value?: string | number; tone?: string }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex items-center justify-between gap-2 text-[11.5px]">
      <span className="text-faint">{label}</span>
      <span className={`tnum truncate ${tone ?? 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function Counts({ critical, warning, normal }: { critical: number; warning: number; normal: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {critical > 0 && <span className="chip bg-bad/15 border border-bad/40 text-[#fca5a5] tnum">{fa(critical)} بحرانی</span>}
      {warning > 0 && <span className="chip bg-gold/15 border border-gold/35 text-gold tnum">{fa(warning)} هشدار</span>}
      {normal > 0 && <span className="chip bg-accent/15 border border-accent/30 text-[#5eead4] tnum">{fa(normal)} عادی</span>}
    </div>
  );
}

type Secondary = 'message' | 'open' | 'dismiss';

function Row({ cr, item, onPrimary, onSecondary }: { cr: ControlRoomState; item: ActionQueueItem; onPrimary: (i: ActionQueueItem) => void; onSecondary?: (i: ActionQueueItem, k: Secondary) => void }) {
  const [open, setOpen] = useState(false);
  const P = PRIORITY[item.priority];
  const critical = item.priority === 'critical';
  const meta = item.meta;
  const subject =
    participantById(cr, item.participantId) ??
    (() => {
      const m = item.matchId ? cr.matches.find((x) => x.id === item.matchId) : undefined;
      return participantById(cr, m?.submittedById) ?? participantById(cr, m?.aId);
    })();
  const hasDetail = !!meta && !!(meta.opponent || meta.reminders || meta.impact || meta.noShows !== undefined || meta.gameId);

  return (
    <li className={`relative overflow-hidden rounded-2xl border p-4 transition ${P.ring}`}>
      <span className={`absolute inset-y-2 start-0 w-1 rounded-full ${P.rail}`} aria-hidden />
      <div className="flex items-start gap-3 ps-2">
        {subject ? <Avatar p={subject} size={38} /> : <span className={`grid h-[38px] w-[38px] flex-none place-items-center rounded-lg ${P.chipBg} border ${P.chipText}`}><ActionIcon action={item.action} /></span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2 w-2 flex-none rounded-full ${P.dot} ${critical ? 'animate-pulse' : ''}`} aria-hidden />
            <span className={`chip border px-2 py-0.5 text-[10px] ${P.chipBg} ${P.chipText}`}>{P.label}</span>
            {meta?.matchLabel && <span className="chip border border-line bg-tile px-2 py-0.5 text-[10px] text-muted">مسابقه {meta.matchLabel}</span>}
            {meta?.round && <span className="chip border border-line bg-tile px-2 py-0.5 text-[10px] text-muted">{meta.round}</span>}
          </div>
          <h4 className="mt-1.5 font-display text-[15px] font-bold leading-snug text-text">{item.title}</h4>
          <p className={`mt-1 text-[13px] leading-relaxed ${critical ? 'text-[#fca5a5]' : 'text-muted'}`}>{item.detail}</p>
          {meta?.impact && <p className="mt-1 text-[12px] text-[#fca5a5]"><span className="text-faint">اثر: </span>{meta.impact}</p>}
        </div>
        <button type="button" onClick={() => onPrimary(item)} className={`flex-none whitespace-nowrap ${critical ? 'btn-danger' : 'btn-primary'}`}>
          <ActionIcon action={item.action} />
          {ACTION_LABEL[item.action]}
        </button>
      </div>

      {hasDetail && (
        <div className="ps-2">
          <button onClick={() => setOpen((v) => !v)} className="mt-2 text-[11px] font-semibold text-accent">{open ? 'بستنِ جزئیات' : 'جزئیات و گزینه‌ها'}</button>
          {open && (
            <div className="mt-2 grid gap-x-6 gap-y-1 rounded-xl border border-line bg-tile2 p-3 sm:grid-cols-2">
              <MetaRow label="بازیکن" value={meta?.player} />
              <MetaRow label="Game ID" value={meta?.gameId} />
              <MetaRow label="حریف" value={meta?.opponent} />
              <MetaRow label="مهلت" value={clock(meta?.deadline)} tone="text-[#fdba74]" />
              <MetaRow label="یادآوری‌های ارسال‌شده" value={meta?.reminders} />
              <MetaRow label="وضعیتِ پاسخ" value={meta?.response} tone="text-[#fca5a5]" />
              <MetaRow label="عدمِ حضور" value={meta?.noShows !== undefined ? fa(meta.noShows) : undefined} />
              <MetaRow label="اخطارها" value={meta?.warnings !== undefined ? fa(meta.warnings) : undefined} />
              {meta?.suggested && <div className="mt-1 text-[12px] text-[#5eead4] sm:col-span-2"><span className="text-faint">پیشنهاد: </span>{meta.suggested}</div>}
              <div className="mt-2 flex flex-wrap gap-1.5 sm:col-span-2">
                <button onClick={() => onSecondary?.(item, 'message')} className="btn-ghost px-3 py-1.5 text-[11px]">پیام به بازیکن</button>
                <button onClick={() => onSecondary?.(item, 'open')} className="btn-ghost px-3 py-1.5 text-[11px]">{item.matchId ? 'بازکردنِ مسابقه' : 'مشاهده‌ی پروفایل'}</button>
                <button onClick={() => onSecondary?.(item, 'dismiss')} className="rounded-lg border border-line px-3 py-1.5 text-[11px] text-faint hover:text-text">رد کردنِ اقدام</button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function ConfirmModal({ item, onConfirm, onCancel }: { item: ActionQueueItem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-tile p-5 shadow-2xl">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
          </span>
          <h3 className="font-display text-base font-bold">{item.title}</h3>
        </div>
        <p className="rounded-xl border border-line bg-tile2 p-3 text-[13px] leading-6 text-slate-200">{item.meta?.consequence ?? 'این اقدام وضعیتِ مسابقه/بازیکن را تغییر می‌دهد و در فعالیت و ممیزی ثبت می‌شود.'}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">انصراف</button>
          <button onClick={onConfirm} className="btn-danger px-4 py-2 text-sm">تأیید و اجرا</button>
        </div>
      </div>
    </div>
  );
}

export function ActionQueuePanel({ cr, onAct, onSecondary }: { cr: ControlRoomState; onAct: (item: ActionQueueItem) => void; onSecondary?: (item: ActionQueueItem, kind: Secondary) => void }) {
  const [showAll, setShowAll] = useState(false);
  const [confirming, setConfirming] = useState<ActionQueueItem | null>(null);
  const queue = cr.actionQueue;
  const critical = queue.filter((q) => q.priority === 'critical').length;
  const warning = queue.filter((q) => q.priority === 'warning').length;
  const normal = queue.filter((q) => q.priority === 'normal').length;
  const primary = queue.filter((q) => q.priority !== 'normal');
  const secondary = queue.filter((q) => q.priority === 'normal');
  const visible = showAll ? queue : primary;

  function handlePrimary(item: ActionQueueItem) {
    if (item.meta?.confirm) setConfirming(item);
    else onAct(item);
  }

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${critical ? 'bg-bad/15 text-bad' : queue.length ? 'bg-gold/15 text-gold' : 'bg-accent/15 text-accent'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-text">اقدام‌های لازم</h2>
            <p className="text-xs text-faint">{queue.length ? <span className="tnum">{fa(queue.length)} موردِ نیازمندِ تصمیم</span> : 'صفِ اقدامات خالی است'}</p>
          </div>
        </div>
        {queue.length > 0 && <Counts critical={critical} warning={warning} normal={normal} />}
      </header>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-tile2 px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-good/15 text-good"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2L16 9" /></svg></span>
          <p className="font-display text-sm font-bold text-text">اقدامِ فوری‌ای لازم نیست؛ همه‌چیز در جریان است.</p>
          <p className="max-w-[34ch] text-xs leading-relaxed text-faint">هر زمان نتیجه‌ای در انتظارِ تأیید بماند، اختلافی باز شود، بازیکنی غایب شود یا دورِ بعد آماده‌ی ساخت شود، اینجا به‌صورتِ یک اقدامِ مستقیم ظاهر می‌شود.</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((item) => (<Row key={item.id} cr={cr} item={item} onPrimary={handlePrimary} onSecondary={onSecondary} />))}
          </ul>
          {secondary.length > 0 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 w-full rounded-xl border border-line bg-tile2 py-2 text-xs font-semibold text-muted transition hover:text-text">
              {showAll ? 'نمایشِ کمتر' : `نمایشِ ${fa(secondary.length)} موردِ عادیِ دیگر`}
            </button>
          )}
        </>
      )}

      {confirming && <ConfirmModal item={confirming} onConfirm={() => { onAct(confirming); setConfirming(null); }} onCancel={() => setConfirming(null)} />}
    </section>
  );
}

export default ActionQueuePanel;
