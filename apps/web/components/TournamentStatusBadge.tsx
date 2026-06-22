import { STATUS_FA } from '@/lib/tournaments';

const STYLE: Record<string, string> = {
  DRAFT: 'bg-accent/20 text-[#5eead4] border-accent/30',
  RUNNING: 'bg-bad/20 text-[#fca5a5] border-bad/30',
  COMPLETED: 'bg-white/10 text-slate-300 border-white/10',
  CANCELLED: 'bg-bad/15 text-bad border-bad/20',
};

export function TournamentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur ${STYLE[status] ?? STYLE.COMPLETED}`}
    >
      {status === 'RUNNING' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />}
      {STATUS_FA[status] ?? status}
    </span>
  );
}
