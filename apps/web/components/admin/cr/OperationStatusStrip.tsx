'use client';

import { relTime, type ControlRoomState } from '@/lib/admin/controlRoom';

const ICONS = {
  phase: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>',
  block: '<path d="M12 2 2 22h20L12 2z"/><path d="M12 9v5M12 17h.01"/>',
  action: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

function Cell({ icon, label, value, tone, big }: { icon: string; label: string; value: string; tone?: 'good' | 'warning' | 'critical' | 'muted'; big?: boolean }) {
  const t =
    tone === 'critical' ? 'border-bad/30 text-[#fca5a5]' :
    tone === 'warning' ? 'border-gold/30 text-gold' :
    tone === 'good' ? 'border-accent/25 text-[#5eead4]' : 'border-line text-text';
  const ic = tone === 'critical' ? 'bg-bad/15 text-bad' : tone === 'warning' ? 'bg-gold/15 text-gold' : tone === 'good' ? 'bg-accent/15 text-accent' : 'bg-tile2 text-muted';
  return (
    <div className={`flex items-start gap-3 rounded-2xl border bg-tile p-4 ${t.split(' ')[0]}`}>
      <span className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${ic}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: icon }} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-faint">{label}</p>
        <p className={`mt-0.5 font-display font-bold leading-snug ${big ? 'text-base' : 'text-sm'} ${t.split(' ').slice(1).join(' ')}`}>{value}</p>
      </div>
    </div>
  );
}

export function OperationStatusStrip({ cr }: { cr: ControlRoomState }) {
  const blocker = cr.summary.blockers[0];
  const deadline = cr.summary.deadline ?? cr.nextScheduled;
  const idle = cr.phase === 'completed' || cr.phase === 'paid';

  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">وضعیتِ عملیات</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cell icon={ICONS.phase} label="مرحله‌ی فعلی" value={`${cr.roundName} · دورِ ${cr.currentRound.toLocaleString('fa-IR')} از ${cr.totalRounds.toLocaleString('fa-IR')}`} tone="good" big />
        <Cell icon={ICONS.block} label="مانعِ اصلی" value={blocker ?? 'بدونِ مانعِ فعال'} tone={blocker ? 'critical' : 'good'} big />
        <Cell icon={ICONS.action} label="اقدامِ بعدیِ ادمین" value={cr.summary.nextAction ?? (idle ? 'تورنومنت پایان یافته' : '—')} tone={blocker ? 'warning' : 'muted'} big />
        <Cell icon={ICONS.time} label={cr.summary.deadline ? 'تا مهلتِ نتیجه' : 'تا دورِ بعد'} value={deadline ? relTime(deadline) : '—'} tone="muted" big />
      </div>
    </section>
  );
}
