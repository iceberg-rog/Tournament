'use client';

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
}: {
  games: GameCount[];
  selected: string | null;
  onSelect: (game: string | null) => void;
}) {
  if (games.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={() => onSelect(null)}
        className={`grid h-[60px] w-20 flex-none place-items-center rounded-xl border text-xs font-bold transition ${
          selected === null ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-tile2 text-muted hover:text-text'
        }`}
      >
        <span className="text-center leading-tight">همه‌ی<br />بازی‌ها</span>
      </button>
      {games.map((g) => (
        <button
          key={g.game}
          onClick={() => onSelect(g.game === selected ? null : g.game)}
          title={g.game}
          className={`group relative h-[60px] w-28 flex-none overflow-hidden rounded-xl border transition hover:-translate-y-0.5 ${
            selected === g.game ? 'border-accent ring-2 ring-accent/40' : 'border-line hover:border-line2'
          }`}
        >
          <CoverBanner game={g.game} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
          <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/10" />
          <span className="absolute left-1 top-1 rounded bg-accent px-1.5 text-[10px] font-bold text-[#06231f] tnum">{fmt(g.total)}</span>
          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-bold text-white" dir="ltr">
            {g.game}
          </span>
        </button>
      ))}
    </div>
  );
}
