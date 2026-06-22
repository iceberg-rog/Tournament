'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, publicGet } from '@/lib/api';
import { GameFilterStrip, type GameCount } from '@/components/GameFilterStrip';
import { TournamentFilters } from '@/components/TournamentFilters';
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
    // اگر از هابِ دیسیپلین‌ها با ?game= آمده‌ایم
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

  const liveCount = useMemo(() => list.filter((t) => t.status === 'RUNNING').length, [list]);

  return (
    <div className="space-y-6">
      {guest && <TournamentHero liveCount={liveCount} />}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-[clamp(18px,2.4vw,24px)] font-bold">مرورِ تورنومنت‌ها</h2>
          <p className="text-sm text-faint">یک بازی یا فیلتر انتخاب کن و رقابتِ مناسبت را پیدا کن.</p>
        </div>

        {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}

        <GameFilterStrip games={games} selected={game} onSelect={setGame} />

        <TournamentFilters
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
            <p className="text-xs text-faint">{filtered.length.toLocaleString('fa-IR')} تورنومنت</p>
            <TournamentGrid items={filtered} />
          </>
        ) : (
          <EmptyState
            title="هنوز تورنومنتی برای این فیلتر وجود ندارد."
            hint="فیلترها را تغییر بده یا یک بازیِ دیگر انتخاب کن."
            action={
              <Link href="/games" className="btn-ghost px-4 py-2 text-sm">
                مرورِ همه‌ی بازی‌ها
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
