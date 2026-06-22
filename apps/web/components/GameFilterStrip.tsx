'use client';

import Link from 'next/link';
import { CoverBanner } from './CoverBanner';
import { fmt } from '@/lib/tournaments';

export interface GameCount {
  game: string;
  total: number;
}

export function GameFilterStrip({
  games,
  selected,
  onSelect,
  max = 12,
}: {
  games: GameCount[];
  selected: string | null;
  onSelect: (game: string | null) => void;
  max?: number;
}) {
  if (games.length === 0) return null;
  const sorted = [...games].sort((a, b) => b.total - a.total);
  const shown = sorted.slice(0, max);

  return (
    <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-color:#262a35_transparent] [scrollbar-width:thin]">
      <button
        onClick={() => onSelect(null)}
        className={`grid h-[64px] w-20 flex-none place-items-center rounded-xl border text-xs font-bold transition ${
          selected === null ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-tile2 text-muted hover:text-text'
        }`}
      >
        همه
      </button>

      {shown.map((g) => (
        <button
          key={g.game}
          onClick={() => onSelect(g.game === selected ? null : g.game)}
          title={g.game}
          className={`group relative h-[64px] w-[132px] flex-none overflow-hidden rounded-xl border transition ${
            selected === g.game ? 'border-accent ring-2 ring-accent/40' : 'border-line hover:border-line2'
          }`}
        >
          <CoverBanner game={g.game} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
          <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 text-[10px] font-semibold text-white/85 tnum backdrop-blur-sm">{fmt(g.total)}</span>
          <span className="absolute inset-x-0 bottom-1 truncate px-2 text-[11px] font-bold text-white" dir="ltr">{g.game}</span>
        </button>
      ))}

      {sorted.length > max && (
        <Link
          href="/games"
          className="grid h-[64px] w-24 flex-none place-items-center rounded-xl border border-dashed border-line text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-accent"
        >
          همه‌ی بازی‌ها →
        </Link>
      )}
    </div>
  );
}
