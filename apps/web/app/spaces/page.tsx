'use client';

import { useEffect, useState } from 'react';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Space {
  id: string;
  title: string;
  tournamentId?: string;
  memberIds: string[];
  posts: unknown[];
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSpaces(await publicGet<Space[]>('/spaces'));
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
      await authedPost('/spaces', { title });
      setTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">کامیونیتی‌ها</h1>

      {isLoggedIn() && (
        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="نام کامیونیتی (مثلاً هواداران Warzone)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button onClick={create} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
            ساخت
          </button>
        </div>
      )}
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <ul className="space-y-2">
        {spaces.map((s) => (
          <li key={s.id}>
            <a
              href={`/spaces/${s.id}`}
              className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 hover:bg-slate-800"
            >
              <span className="font-medium">{s.title}</span>
              <span className="text-sm text-slate-400">
                {s.memberIds.length} عضو · {s.posts.length} پست
              </span>
            </a>
          </li>
        ))}
        {spaces.length === 0 && <li className="text-slate-400">هنوز کامیونیتی‌ای ساخته نشده.</li>}
      </ul>
    </main>
  );
}
