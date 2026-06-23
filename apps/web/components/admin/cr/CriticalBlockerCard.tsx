'use client';

import { participantById, type ControlRoomState } from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';

/** کارتِ تمرکز برای مانعِ بحرانی (اختلافِ باز). اگر مانعی نباشد چیزی نمایش نمی‌دهد. */
export function CriticalBlockerCard({ cr, onResolve, onOpenChat }: { cr: ControlRoomState; onResolve: (disputeId: string) => void; onOpenChat: () => void }) {
  const dispute = cr.disputes.find((d) => d.status === 'open' || d.status === 'under_review');
  if (!dispute) return null;
  const m = cr.matches.find((x) => x.id === dispute.matchId);
  const a = participantById(cr, m?.aId);
  const b = participantById(cr, m?.bId);
  const num = m ? `#${m.number.toLocaleString('fa-IR')}` : '';

  return (
    <section className="overflow-hidden rounded-2xl border border-bad/40 bg-bad/[0.06]">
      <div className="flex items-center gap-2 border-b border-bad/25 bg-bad/10 px-4 py-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-bad"><path d="M12 2 2 22h20L12 2z" /><path d="M12 9v5M12 17h.01" /></svg>
        <span className="text-xs font-bold text-[#fca5a5]">مانعِ بحرانی</span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Avatar p={a} size={28} />
          <span className="text-sm font-bold">{a?.name ?? 'TBD'}</span>
          <span className="text-xs text-faint">vs</span>
          <Avatar p={b} size={28} />
          <span className="text-sm font-bold">{b?.name ?? 'TBD'}</span>
          <span className="ms-auto text-xs text-faint">مسابقه‌ی {num}</span>
        </div>

        <div className="space-y-1.5 text-[13px] leading-relaxed">
          <p><span className="text-faint">علت: </span><span className="text-slate-200">{dispute.reason}</span></p>
          <p className="text-[#fca5a5]"><span className="text-faint">اثر: </span>تا حلِ اختلاف، ساختِ دورِ بعد و پرداختِ جایزه قفل است.</p>
          {dispute.suggestedAction && <p><span className="text-faint">پیشنهاد: </span><span className="text-slate-200">{dispute.suggestedAction}</span></p>}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button onClick={() => onResolve(dispute.id)} className="btn-danger px-4 py-2 text-sm">بررسی و حلِ اختلاف</button>
          <button onClick={onOpenChat} className="btn-ghost px-4 py-2 text-sm">پیام به طرفین</button>
        </div>
      </div>
    </section>
  );
}
