'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedPost, isLoggedIn, publicGet } from '@/lib/api';

interface TournamentRow {
  id: string;
  title: string;
  game?: string;
  format: string;
  genre: string;
  status: string;
  participants: { id: string; name: string }[];
}

interface GameCard {
  game: string;
  total: number;
  upcoming: number;
  running: number;
  finished: number;
}

const FORMATS = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA'];
const GENRES = ['DUEL', 'TEAM', 'FFA'];
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

export default function TournamentsPage() {
  const [list, setList] = useState<TournamentRow[]>([]);
  const [games, setGames] = useState<GameCard[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'running' | 'finished'>('upcoming');
  const [form, setForm] = useState({
    title: '',
    game: '',
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    maxParticipants: '',
    requireCheckIn: false,
  });
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  async function load() {
    try {
      setList(await publicGet<TournamentRow[]>('/tournaments'));
      setGames(await publicGet<GameCard[]>('/tournaments/games'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        format: form.format,
        genre: form.genre,
        requireCheckIn: form.requireCheckIn,
      };
      if (form.game) payload.game = form.game;
      if (form.maxParticipants) payload.maxParticipants = Number(form.maxParticipants);
      await authedPost('/tournaments', payload);
      setForm({ ...form, title: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">تورنومنت‌ها</h1>
        <Link href="/dashboard" className="text-sm text-indigo-400">
          داشبورد
        </Link>
      </div>

      {loggedIn ? (
        <form onSubmit={create} className="mb-8 flex flex-wrap gap-3 rounded-lg bg-slate-900 p-4">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="عنوان تورنومنت"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="w-36 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="بازی (مثلاً FC26)"
            value={form.game}
            onChange={(e) => setForm({ ...form, game: e.target.value })}
          />
          <select
            className="rounded-lg bg-slate-800 px-3 py-2"
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value })}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg bg-slate-800 px-3 py-2"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={2}
            className="w-28 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="ظرفیت"
            value={form.maxParticipants}
            onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.requireCheckIn}
              onChange={(e) => setForm({ ...form, requireCheckIn: e.target.checked })}
            />
            check-in
          </label>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500">
            ساخت
          </button>
        </form>
      ) : (
        <p className="mb-6 text-slate-400">
          برای ساخت تورنومنت{' '}
          <Link href="/login" className="text-indigo-400">
            وارد شوید
          </Link>
          .
        </p>
      )}

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {games.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGame(null)}
            className={`rounded-lg px-3 py-2 text-sm ${selectedGame === null ? 'bg-emerald-600' : 'bg-slate-800'}`}
          >
            همه‌ی بازی‌ها
          </button>
          {games.map((g) => (
            <button
              key={g.game}
              onClick={() => setSelectedGame(g.game)}
              className={`rounded-lg px-3 py-2 text-sm ${selectedGame === g.game ? 'bg-emerald-600' : 'bg-slate-800'}`}
            >
              {g.game} <span className="text-slate-400">({g.total})</span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === k ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {list
          .filter((t) => STATUS[tab].includes(t.status) && (!selectedGame || t.game === selectedGame))
          .map((t) => (
            <li key={t.id}>
              <Link
                href={`/tournaments/${t.id}`}
                className="flex items-center justify-between rounded-lg bg-slate-800 p-4 hover:bg-slate-700"
              >
                <span className="font-medium">{t.title}</span>
                <span className="text-sm text-slate-400">
                  {t.game ? `${t.game} · ` : ''}
                  {t.format} · {t.genre} · {t.participants.length} نفر · {t.status}
                </span>
              </Link>
            </li>
          ))}
        {list.filter((t) => STATUS[tab].includes(t.status) && (!selectedGame || t.game === selectedGame)).length === 0 && (
          <li className="text-slate-500">موردی در این بخش نیست.</li>
        )}
      </ul>
    </main>
  );
}
