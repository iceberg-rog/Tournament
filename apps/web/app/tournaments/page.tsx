'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedPost, isLoggedIn, publicGet } from '@/lib/api';

interface TournamentRow {
  id: string;
  title: string;
  format: string;
  genre: string;
  status: string;
  participants: { id: string; name: string }[];
}

const FORMATS = ['SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'FFA'];
const GENRES = ['DUEL', 'TEAM', 'FFA'];

export default function TournamentsPage() {
  const [list, setList] = useState<TournamentRow[]>([]);
  const [form, setForm] = useState({ title: '', format: 'SINGLE_ELIM', genre: 'DUEL' });
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  async function load() {
    try {
      setList(await publicGet<TournamentRow[]>('/tournaments'));
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
      await authedPost('/tournaments', form);
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

      <ul className="flex flex-col gap-2">
        {list.map((t) => (
          <li key={t.id}>
            <Link
              href={`/tournaments/${t.id}`}
              className="flex items-center justify-between rounded-lg bg-slate-800 p-4 hover:bg-slate-700"
            >
              <span className="font-medium">{t.title}</span>
              <span className="text-sm text-slate-400">
                {t.format} · {t.genre} · {t.participants.length} نفر · {t.status}
              </span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="text-slate-500">هنوز تورنومنتی نیست.</li>}
      </ul>
    </main>
  );
}
