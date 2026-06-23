'use client';

import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmt } from '@/lib/admin';
import {
  participantById,
  relTime,
  type ControlRoomState,
  type CRDispute,
  type CRDisputeStatus,
} from '@/lib/admin/controlRoom';

const STATUS_FA: Record<CRDisputeStatus, string> = {
  open: 'باز',
  under_review: 'در حالِ بررسی',
  resolved: 'حل‌شده',
  rejected: 'رد‌شده',
};

const STATUS_TONE: Record<CRDisputeStatus, 'bad' | 'gold' | 'good' | 'muted'> = {
  open: 'bad',
  under_review: 'gold',
  resolved: 'good',
  rejected: 'muted',
};

const ACTIVE: CRDisputeStatus[] = ['open', 'under_review'];

function PartChip({ p, label }: { p?: ReturnType<typeof participantById>; label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar p={p} size={26} />
      <div className="min-w-0">
        <div className="text-[10px] text-faint leading-none">{label}</div>
        <div className="truncate text-[13px] font-bold text-text leading-tight">{p?.name ?? '—'}</div>
      </div>
    </div>
  );
}

function DisputeCard({
  cr,
  d,
  onOpenDispute,
}: {
  cr: ControlRoomState;
  d: CRDispute;
  onOpenDispute: (id: string) => void;
}) {
  const active = ACTIVE.includes(d.status);
  const match = cr.matches.find((m) => m.id === d.matchId);
  const reporter = participantById(cr, d.reporterId);
  const accused = participantById(cr, d.accusedId);

  const matchNo = match ? `#${match.number.toLocaleString('fa-IR')}` : '—';

  // open = loud red, under_review = loud gold, resolved/rejected = muted
  const frame =
    d.status === 'open'
      ? 'border-bad/60 bg-bad/[0.06] shadow-[0_0_0_1px_rgba(239,68,68,.25)]'
      : d.status === 'under_review'
        ? 'border-gold/60 bg-gold/[0.05]'
        : 'border-line bg-tile opacity-70';

  return (
    <div className={`rounded-2xl border p-4 ${frame}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {active && <span className="h-2 w-2 flex-none animate-pulse rounded-full bg-current" style={{ color: d.status === 'open' ? '#f87171' : '#fbbf24' }} />}
          <div>
            <div className="text-[11px] text-faint leading-none">مسابقه‌ی</div>
            <div className="font-display text-lg font-bold tnum text-text leading-tight">{matchNo}</div>
          </div>
          {match && (
            <span className="rounded-md border border-line bg-tile2 px-2 py-0.5 text-[11px] text-muted">{match.roundName}</span>
          )}
        </div>
        <AdminBadge label={STATUS_FA[d.status]} tone={STATUS_TONE[d.status]} />
      </div>

      {/* طرفینِ اختلاف */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-tile2/60 px-3 py-2.5">
        <PartChip p={reporter} label="گزارش‌دهنده" />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-none text-faint">
          <path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
        </svg>
        <PartChip p={accused} label="طرفِ مقابل" />
      </div>

      {/* دلیل */}
      <div className="mt-3">
        <div className="text-[11px] text-faint">دلیلِ اختلاف</div>
        <p className="mt-1 text-[13px] leading-6 text-text">{d.reason}</p>
      </div>

      {/* اقدامِ پیشنهادی */}
      {d.suggestedAction && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/25 bg-accent/[0.06] px-3 py-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-accent">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
          </svg>
          <div>
            <div className="text-[10px] text-accent/80">اقدامِ پیشنهادی</div>
            <div className="text-[12.5px] leading-5 text-text">{d.suggestedAction}</div>
          </div>
        </div>
      )}

      {/* فوتر: مدرک، مهلت، رسیدگی */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V7a2 2 0 0 0-2-2H9L7 3H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" /><path d="m14 12 7 7-3 3-7-7v-3h3Z" /></svg>
            {fmt(d.evidenceCount)} مدرک
          </span>
          {d.assignedTo && (
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
              داور: {d.assignedTo}
            </span>
          )}
          {d.deadline && (
            <span className={`inline-flex items-center gap-1 ${active ? 'text-gold' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              مهلت: {relTime(d.deadline)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenDispute(d.id)}
          className={active ? 'btn-danger' : 'btn-ghost'}
        >
          {active ? 'رسیدگی' : 'مشاهده'}
        </button>
      </div>
    </div>
  );
}

/** پنلِ اختلاف‌ها — تا وقتی اختلافِ باز هست، دورِ بعد/پایان/پرداخت قفل است. */
export function DisputesPanel({
  cr,
  onOpenDispute,
}: {
  cr: ControlRoomState;
  onOpenDispute: (id: string) => void;
}) {
  const disputes = [...cr.disputes].sort((a, b) => {
    const rank = (s: CRDisputeStatus) => (s === 'open' ? 0 : s === 'under_review' ? 1 : s === 'resolved' ? 2 : 3);
    return rank(a.status) - rank(b.status);
  });
  const activeCount = disputes.filter((d) => ACTIVE.includes(d.status)).length;

  return (
    <section className="rounded-2xl border border-line bg-tile p-4 sm:p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={activeCount ? 'text-bad' : 'text-faint'}>
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          <h2 className="font-display text-base font-bold text-text">اختلاف‌ها</h2>
          {activeCount > 0 && <AdminBadge label={`${fmt(activeCount)} فعال`} tone="bad" />}
        </div>
      </header>

      {/* یادداشتِ قفل‌شدن */}
      {activeCount > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-bad/40 bg-bad/[0.07] px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-bad">
            <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[13px] leading-6 text-[#fca5a5]">
            تا زمانی که {fmt(activeCount)} اختلافِ باز رسیدگی نشود، ساختِ دورِ بعد، پایانِ تورنومنت و پرداختِ جایزه قفل است.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {disputes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-tile2/40 px-4 py-10 text-center">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-good">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
            </svg>
            <p className="mt-3 text-[13px] font-bold text-text">اختلافی ثبت نشده است</p>
            <p className="mt-1 text-[12px] leading-6 text-muted">
              همه‌ی نتایج موردِ تأییدِ طرفین بوده. اگر بازیکنی نتیجه‌ای را به‌چالش بکشد، کارتِ رسیدگی‌اش اینجا ظاهر می‌شود.
            </p>
          </div>
        ) : (
          disputes.map((d) => <DisputeCard key={d.id} cr={cr} d={d} onOpenDispute={onOpenDispute} />)
        )}
      </div>
    </section>
  );
}

export default DisputesPanel;
