'use client';

import { useEffect, useMemo, useState } from 'react';
import { isLoggedIn, publicGet } from '@/lib/api';
import { GameFilterStrip, type GameCount } from '@/components/GameFilterStrip';
import { TournamentToolbar } from '@/components/TournamentToolbar';
import { TournamentGrid } from '@/components/TournamentGrid';
import { TournamentHero } from '@/components/TournamentHero';
import { EmptyState } from '@/components/EmptyState';
import {
  STATUS_FILTERS,
  availableFormats,
  platformGroup,
  type PlatformGroup,
  type StatusFilter,
  type TournamentRow,
} from '@/lib/tournaments';

export default function TournamentsPage() {
  const [list, setList] = useState<TournamentRow[]>([]);
  const [games, setGames] = useState<GameCount[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<StatusFilter>('all');
  const [game, setGame] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformGroup>('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const guest = mounted && !isLoggedIn();

  useEffect(() => {
    (async () => {
      try {
        const [l, g] = await Promise.all([
          publicGet<TournamentRow[]>('/tournaments'),
          publicGet<GameCount[]>('/tournaments/games'),
        ]);
        setList(l);
        setGames(g);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا');
      } finally {
        setLoading(false);
      }
    })();
    const g = new URLSearchParams(window.location.search).get('game');
    if (g) setGame(g);
  }, []);

  const types = useMemo(() => availableFormats(list), [list]);
  const statusMatch = STATUS_FILTERS.find((s) => s.k === status)!.match;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter(
      (t) =>
        statusMatch(t.status) &&
        (!game || t.game === game) &&
        (platform === 'all' || platformGroup(t.platform) === platform || t.platform === 'CROSS') &&
        (type === 'all' || t.format === type) &&
        (!q || t.title.toLowerCase().includes(q) || (t.game ?? '').toLowerCase().includes(q)),
    );
  }, [list, statusMatch, game, platform, type, search]);

  // آمارِ محاسبه‌شده از داده‌ی واقعی (نه hardcoded)
  const stats = useMemo(
    () => ({
      total: list.length,
      open: list.filter((t) => t.status === 'DRAFT').length,
      live: list.filter((t) => t.status === 'RUNNING').length,
      done: list.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED').length,
    }),
    [list],
  );

  // تورنومنتِ منتخب: اولین در‌حال‌انجام، وگرنه اولین ثبت‌نام‌بازِ جایزه‌دار، وگرنه اولین.
  const featured = useMemo(() => {
    const withPrize = (t: TournamentRow) => (t.prizePool?.length ?? 0) > 0;
    return (
      list.find((t) => t.status === 'RUNNING' && withPrize(t)) ??
      list.find((t) => t.status === 'RUNNING') ??
      list.find((t) => t.status === 'DRAFT' && withPrize(t)) ??
      list[0]
    );
  }, [list]);

  const filtersActive = status !== 'all' || !!game || platform !== 'all' || type !== 'all' || !!search;
  const clearFilters = () => {
    setStatus('all');
    setGame(null);
    setPlatform('all');
    setType('all');
    setSearch('');
  };

  return (
    <div className="space-y-6">
      {guest && <TournamentHero stats={stats} featured={featured} />}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-[clamp(18px,2.4vw,24px)] font-bold">مرورِ تورنومنت‌ها</h2>
          <p className="text-sm text-faint">یک بازی یا فیلتر انتخاب کن و رقابتِ مناسبت را پیدا کن.</p>
        </div>

        {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}

        <GameFilterStrip games={games} selected={game} onSelect={setGame} />

        <TournamentToolbar
          status={status}
          setStatus={setStatus}
          platform={platform}
          setPlatform={setPlatform}
          type={type}
          setType={setType}
          types={types}
          search={search}
          setSearch={setSearch}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-line bg-tile" />
            ))}
          </div>
        ) : filtered.length ? (
          <>
            <p className="text-xs text-faint">{filtered.length.toLocaleString('fa-IR')} تورنومنت یافت شد</p>
            <TournamentGrid items={filtered} guest={guest} />
          </>
        ) : (
          <EmptyState
            title="تورنومنتی با این فیلتر پیدا نشد"
            hint="فیلترها را تغییر بده یا همه را پاک کن تا همه‌ی تورنومنت‌ها را ببینی."
            action={
              filtersActive ? (
                <button onClick={clearFilters} className="btn-primary px-5 py-2 text-sm">پاک کردنِ فیلترها</button>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
