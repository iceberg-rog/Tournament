'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Post {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}
interface Space {
  id: string;
  title: string;
  memberIds: string[];
  posts: Post[];
}

export default function SpaceDetailPage() {
  const id = useParams().id as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSpace(await publicGet<Space>(`/spaces/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }
  useEffect(() => {
    if (id) load();
  }, [id]);

  async function act(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!space) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <a href="/spaces" className="text-sm text-indigo-400">
        ← کامیونیتی‌ها
      </a>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{space.title}</h1>
      <p className="mb-6 text-sm text-slate-400">{space.memberIds.length} عضو</p>

      {isLoggedIn() && (
        <div className="mb-6 space-y-3 rounded-lg bg-slate-900 p-4">
          <button
            onClick={() => act(() => authedPost(`/spaces/${id}/join`))}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            عضویت در کامیونیتی
          </button>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
              placeholder="یک پست بنویس... (فقط اعضا)"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={() =>
                text.trim() &&
                act(async () => {
                  await authedPost(`/spaces/${id}/post`, { text });
                  setText('');
                })
              }
              className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500"
            >
              ارسال
            </button>
          </div>
        </div>
      )}
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <h2 className="mb-3 font-bold">پست‌ها</h2>
      <ul className="space-y-2">
        {[...space.posts].reverse().map((p) => (
          <li key={p.id} className="rounded-lg bg-slate-900 px-4 py-3">
            <p>{p.text}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString('fa-IR')}</p>
          </li>
        ))}
        {space.posts.length === 0 && <li className="text-slate-400">هنوز پستی نیست.</li>}
      </ul>
    </main>
  );
}
