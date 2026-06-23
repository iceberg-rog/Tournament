import { STATUS_FA, STATUS_TONE, type IntegrationStatus } from '@/lib/integrations/types';

const TONE: Record<string, string> = {
  good: 'border-good/40 bg-good/15 text-good',
  gold: 'border-gold/40 bg-gold/15 text-gold',
  bad: 'border-bad/40 bg-bad/15 text-[#fca5a5]',
  muted: 'border-line bg-tile2 text-muted',
  accent: 'border-accent/30 bg-accent/15 text-[#5eead4]',
};

export function StatusBadge({ status }: { status: IntegrationStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${TONE[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'error' ? 'bg-bad animate-pulse' : 'bg-current'}`} />
      {STATUS_FA[status]}
    </span>
  );
}
