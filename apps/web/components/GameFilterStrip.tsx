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
    <div className="hscroll flex gap-3 pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`grid h-[72px] w-[88px] flex-none place-items-center rounded-2xl border text-xs font-bold transition ${
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
          className={`group relative h-[72px] w-[150px] flex-none overflow-hidden rounded-2xl border transition ${
            selected === g.game ? 'border-accent ring-2 ring-accent/50' : 'border-line hover:border-line2'
          }`}
        >
          <CoverBanner game={g.game} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
          {g.total > 0 && (
            <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 tnum backdrop-blur-sm">{fmt(g.total)}</span>
          )}
          {selected === g.game && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(45,212,191,.25)]" />}
          <span className="absolute inset-x-0 bottom-1.5 truncate px-2.5 text-[12px] font-bold text-white" dir="ltr">{g.game}</span>
        </button>
      ))}

      {sorted.length > max && (
        <Link
          href="/games"
          className="grid h-[72px] w-[100px] flex-none place-items-center rounded-2xl border border-dashed border-line text-center text-xs font-semibold leading-tight text-muted transition hover:border-accent/50 hover:text-accent"
        >
          همه‌ی<br />بازی‌ها →
        </Link>
      )}
    </div>
  );
}
