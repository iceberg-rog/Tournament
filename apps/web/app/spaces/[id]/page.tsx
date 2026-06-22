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

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  users: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
};

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

  if (!space)
    return (
      <div className="card grid place-items-center p-10 text-sm text-muted">
        {error || 'در حال بارگذاری...'}
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <a href="/spaces" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        {I.back} کامیونیتی‌ها
      </a>

      <div className="card p-5">
        <div className="flex items-center gap-2.5">
          <span className="tile-ic">{I.chat}</span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{space.title}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <span className="text-faint">{I.users}</span>
              <span className="tnum">{fmt(space.memberIds.length)}</span> عضو
            </p>
          </div>
        </div>
      </div>

      {isLoggedIn() && (
        <div className="card space-y-3 p-4">
          <button
            onClick={() => act(() => authedPost(`/spaces/${id}/join`))}
            className="btn-ghost"
          >
            {I.plus}
            عضویت در کامیونیتی
          </button>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-text placeholder:text-faint focus:border-accent-dim focus:outline-none"
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
              className="btn-primary flex-none"
            >
              {I.send}
              ارسال
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>
      )}

      <div className="card p-4">
        <div className="tile-head">
          <span className="tile-ic amber">{I.chat}</span>
          <span className="tile-title">پست‌ها</span>
        </div>
        <ul className="space-y-2">
          {[...space.posts].reverse().map((p) => (
            <li key={p.id} className="row-soft px-4 py-3">
              <p className="text-[14px] leading-relaxed">{p.text}</p>
              <p className="mt-1.5 text-xs text-faint tnum">{new Date(p.createdAt).toLocaleString('fa-IR')}</p>
            </li>
          ))}
          {space.posts.length === 0 && (
            <li className="grid place-items-center py-8 text-sm text-faint">هنوز پستی نیست.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
