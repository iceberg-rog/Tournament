'use client';

import { useEffect, useState } from 'react';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Season {
  id: string;
  title: string;
  tournamentIds: string[];
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSeasons(await publicGet<Season[]>('/seasons'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (title.trim().length < 2) return;
    try {
      await authedPost('/seasons', { title });
      setTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">فصل‌ها</h1>

      {isLoggedIn() && (
        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="عنوان فصل (مثلاً فصل بهار ۱۴۰۵)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button onClick={create} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
            ساخت فصل
          </button>
        </div>
      )}
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <ul className="space-y-2">
        {seasons.map((s) => (
          <li key={s.id}>
            <a
              href={`/seasons/${s.id}`}
              className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 hover:bg-slate-800"
            >
              <span className="font-medium">{s.title}</span>
              <span className="text-sm text-slate-400">{s.tournamentIds.length} تورنومنت</span>
            </a>
          </li>
        ))}
        {seasons.length === 0 && <li className="text-slate-400">هنوز فصلی ساخته نشده.</li>}
      </ul>
    </main>
  );
}
