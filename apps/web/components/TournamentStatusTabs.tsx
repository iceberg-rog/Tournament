'use client';

import { STATUS_FILTERS, type StatusFilter } from '@/lib/tournaments';

export function TournamentStatusTabs({
  status,
  setStatus,
}: {
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-tile2 p-1">
      {STATUS_FILTERS.map((s) => (
        <button
          key={s.k}
          onClick={() => setStatus(s.k)}
          className={`rounded-lg px-3.5 py-1.5 text-sm transition ${
            status === s.k ? 'bg-gradient-to-l from-accent to-accent-dim font-semibold text-[#06231f]' : 'text-muted hover:text-text'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
