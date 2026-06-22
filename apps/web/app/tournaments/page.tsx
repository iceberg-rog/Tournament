'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, publicGet } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';

interface TournamentRow {
  id: string;
  title: string;
  game?: string;
  format: string;
  genre: string;
  status: string;
  participants: { id: string }[];
  platform?: string;
  coverImage?: string;
  organizerName?: string;
  startAt?: string;
}
interface GameCard {
  game: string;
  total: number;
}

const STATUS: Record<string, string[]> = {
  upcoming: ['DRAFT'],
  running: ['RUNNING'],
  finished: ['COMPLETED', 'CANCELLED'],
};
const TABS = [
  ['upcoming', 'پیش‌رو'],
  ['running', 'در حال انجام'],
  ['finished', 'اتمام‌یافته'],
] as const;
const fmtFa: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی',
  DOUBLE_ELIM: 'دوحذفی',
  ROUND_ROBIN: 'دوره‌ای',
  SWISS: 'سوئیسی',
  FFA: 'Battle Royale',
};
const stFa: Record<string, string> = { DRAFT: 'پیش‌نویس', RUNNING: 'در حال اجرا', COMPLETED: 'پایان‌یافته', CANCELLED: 'لغوشده' };
const stColor: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300',
  RUNNING: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-violet-500/20 text-violet-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};
const fmt = (n: number) => n.toLocaleString('fa-IR');

export default function TournamentsPage() {
  const [list, setList] = useState<TournamentRow[]>([]);
  const [games, setGames] = useState<GameCard[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'running' | 'finished'>('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setList(await publicGet<TournamentRow[]>('/tournaments'));
        setGames(await publicGet<GameCard[]>('/tournaments/games'));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا');
      }
    })();
  }, []);

  const filtered = list.filter((t) => STATUS[tab].includes(t.status) && (!selectedGame || t.game === selectedGame));

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">تورنومنت‌ها</h1>
        {isLoggedIn() && (
          <Link
            href="/tournaments/new"
            className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-bold shadow-lg shadow-fuchsia-600/25"
          >
            ➕ ساخت تورنومنت
          </Link>
        )}
      </div>
      {error && <p className="mb-4 text-red-400">{error}</p>}

      {/* category chips */}
      {games.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGame(null)}
            className={`rounded-xl px-3 py-2 text-sm transition ${selectedGame === null ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
          >
            همه‌ی بازی‌ها
          </button>
          {games.map((g) => (
            <button
              key={g.game}
              onClick={() => setSelectedGame(g.game)}
              className={`rounded-xl px-3 py-2 text-sm transition ${selectedGame === g.game ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
            >
              {g.game} <span className="opacity-60">({fmt(g.total)})</span>
            </button>
          ))}
        </div>
      )}

      {/* status tabs */}
      <div className="mb-6 inline-flex gap-1 rounded-2xl bg-white/5 p-1">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm transition ${tab === k ? 'bg-white/10 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`} className="card overflow-hidden transition hover:border-fuchsia-500/30 hover:-translate-y-0.5">
            <CoverBanner coverImage={t.coverImage} game={t.game} rounded="rounded-none" className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-bold">{t.title}</h3>
                <span className={`chip shrink-0 ${stColor[t.status] ?? 'bg-slate-500/20 text-slate-300'}`}>{stFa[t.status] ?? t.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {t.game ?? 'بدون بازی'} · {fmtFa[t.format] ?? t.format}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {t.platform && <span className="chip bg-white/5 text-slate-300">🕹️ {t.platform}</span>}
                <span className="chip bg-white/5 text-slate-300">👥 {fmt(t.participants.length)}</span>
                {t.startAt && <span className="chip bg-white/5 text-slate-300">📅 {new Date(t.startAt).toLocaleDateString('fa-IR')}</span>}
              </div>
              {t.organizerName && <p className="mt-2 text-[11px] text-slate-500">سازنده: {t.organizerName}</p>}
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-16 text-center text-slate-500">
          موردی در این بخش نیست.{' '}
          {isLoggedIn() && (
            <Link href="/tournaments/new" className="text-fuchsia-300">
              یکی بساز
            </Link>
          )}
        </p>
      )}
    </main>
  );
}
