'use client';

import { FORMAT_FA, PLATFORM_FILTERS, type PlatformGroup, type StatusFilter } from '@/lib/tournaments';
import { TournamentStatusTabs } from './TournamentStatusTabs';

export function TournamentToolbar({
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
  const select =
    'rounded-lg border border-line bg-tile2 px-3 py-2 text-sm text-text outline-none transition focus:border-accent-dim';
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-tile p-2.5 md:flex-row md:items-center md:gap-3">
      {/* وضعیت — موبایل: آخر، دسکتاپ: ابتدای ردیف (RTL راست) */}
      <div className="order-2 md:order-1">
        <TournamentStatusTabs status={status} setStatus={setStatus} />
      </div>

      {/* سرچ + فیلترها — موبایل: اول */}
      <div className="order-1 flex flex-wrap items-center gap-2 md:order-2 md:ms-auto">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm focus-within:border-accent-dim md:flex-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-faint">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی تورنومنت یا بازی…"
            className="w-full bg-transparent text-text outline-none placeholder:text-faint md:w-44"
          />
        </label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformGroup)} className={select} aria-label="پلتفرم">
          {PLATFORM_FILTERS.map((p) => (
            <option key={p.k} value={p.k}>{p.label}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={select} aria-label="نوع تورنومنت">
          <option value="all">همه‌ی انواع</option>
          {types.map((t) => (
            <option key={t} value={t}>{FORMAT_FA[t] ?? t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
