import type { Tone } from '@/lib/admin';

const TONE: Record<Tone, string> = {
  accent: 'bg-accent/15 text-[#5eead4] border-accent/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
  bad: 'bg-bad/15 text-[#fca5a5] border-bad/30',
  good: 'bg-good/15 text-good border-good/30',
  muted: 'bg-tile2 text-muted border-line',
};

export function AdminBadge({ label, tone, dot }: { label: string; tone: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${TONE[tone]}`}>
      {(dot || tone === 'bad') && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label}
    </span>
  );
}
