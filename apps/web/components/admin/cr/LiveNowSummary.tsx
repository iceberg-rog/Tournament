'use client';

import { CRMATCH_FA, participantById, relTime, type CRMatch, type ControlRoomState } from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';

const TONE: Record<string, string> = {
  live: 'border-bad/40 text-[#fca5a5]',
  disputed: 'border-bad/40 text-[#fca5a5]',
  result_submitted: 'border-gold/35 text-gold',
  awaiting_opponent_confirmation: 'border-gold/35 text-gold',
};

function Card({ cr, m, onOpenMatch }: { cr: ControlRoomState; m: CRMatch; onOpenMatch: (id: string) => void }) {
  const a = participantById(cr, m.aId);
  const b = participantById(cr, m.bId);
  return (
    <button onClick={() => onOpenMatch(m.id)} className="w-full rounded-xl border border-line bg-tile2 p-3 text-right transition hover:border-accent-dim">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-faint">مسابقه‌ی #{m.number.toLocaleString('fa-IR')} · {m.roundName}</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TONE[m.status] ?? 'border-line text-faint'}`}>
          {m.status === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
          {CRMATCH_FA[m.status]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar p={a} size={26} />
        <span className={`flex-1 truncate text-[13px] ${m.winnerId === m.aId ? 'font-bold text-accent' : ''}`}>{a?.name ?? 'TBD'}</span>
        <span className="tnum text-sm font-bold">{m.scoreA.toLocaleString('fa-IR')}</span>
        <span className="text-faint">-</span>
        <span className="tnum text-sm font-bold">{m.scoreB.toLocaleString('fa-IR')}</span>
        <span className={`flex-1 truncate text-end text-[13px] ${m.winnerId === m.bId ? 'font-bold text-accent' : ''}`}>{b?.name ?? 'TBD'}</span>
        <Avatar p={b} size={26} />
      </div>
      {m.deadline && <p className="mt-1.5 text-[10px] text-faint">مهلت: {relTime(m.deadline)}</p>}
    </button>
  );
}

export function LiveNowSummary({ cr, onOpenMatch, onViewAll }: { cr: ControlRoomState; onOpenMatch: (id: string) => void; onViewAll: () => void }) {
  const urgent = cr.matches.filter((m) => ['live', 'disputed', 'result_submitted', 'awaiting_opponent_confirmation'].includes(m.status));
  const shown = urgent.slice(0, 3);
  const total = cr.matches.length;

  return (
    <section className="rounded-2xl border border-line bg-tile p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold">
          {urgent.some((m) => m.status === 'live') && <span className="h-2 w-2 animate-pulse rounded-full bg-bad" />}
          هم‌اکنون
        </h2>
        <button onClick={onViewAll} className="text-[11px] font-semibold text-accent hover:underline">مشاهده‌ی همه‌ی مسابقات ({total.toLocaleString('fa-IR')})</button>
      </div>

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((m) => <Card key={m.id} cr={cr} m={m} onOpenMatch={onOpenMatch} />)}
          {urgent.length > shown.length && (
            <button onClick={onViewAll} className="w-full rounded-xl border border-line bg-tile2 py-2 text-xs font-semibold text-muted transition hover:text-text">
              {(urgent.length - shown.length).toLocaleString('fa-IR')} موردِ فوریِ دیگر
            </button>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-tile2 p-5 text-center text-xs leading-relaxed text-faint">
          مسابقه‌ی زنده یا فوری‌ای در جریان نیست. وقتی مسابقه‌ای شروع شود یا نتیجه‌ای ثبت گردد، اینجا نمایش داده می‌شود.
        </p>
      )}
    </section>
  );
}
