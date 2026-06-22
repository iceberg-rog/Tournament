'use client';

import {
  FORMAT_FA,
  PLATFORM_FILTERS,
  STATUS_FILTERS,
  type PlatformGroup,
  type StatusFilter,
} from '@/lib/tournaments';

export function TournamentFilters({
  status,
  setStatus,
  platform,
  setPlatform,
  type,
  setType,
  types,
  search,
  setSearch,
}: {
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  platform: PlatformGroup;
  setPlatform: (p: PlatformGroup) => void;
  type: string;
  setType: (t: string) => void;
  types: string[];
  search: string;
  setSearch: (s: string) => void;
}) {
  const select = 'rounded-xl border border-line bg-tile px-3 py-2 text-sm text-text outline-none transition focus:border-accent-dim';
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* تب‌های وضعیت */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-tile p-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.k}
            onClick={() => setStatus(s.k)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              status === s.k ? 'bg-gradient-to-l from-accent to-accent-dim font-semibold text-[#06231f]' : 'text-muted hover:text-text'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="ms-auto flex flex-wrap items-center gap-2">
        {/* پلتفرم */}
        <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformGroup)} className={select} aria-label="پلتفرم">
          {PLATFORM_FILTERS.map((p) => (
            <option key={p.k} value={p.k}>{p.label}</option>
          ))}
        </select>

        {/* نوع تورنومنت */}
        <select value={type} onChange={(e) => setType(e.target.value)} className={select} aria-label="نوع تورنومنت">
          <option value="all">همه‌ی انواع</option>
          {types.map((t) => (
            <option key={t} value={t}>{FORMAT_FA[t] ?? t}</option>
          ))}
        </select>

        {/* سرچ */}
        <label className="flex items-center gap-2 rounded-xl border border-line bg-tile px-3 py-2 text-sm focus-within:border-accent-dim">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-faint">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی تورنومنت یا بازی…"
            className="w-40 bg-transparent text-text outline-none placeholder:text-faint"
          />
        </label>
      </div>
    </div>
  );
}
