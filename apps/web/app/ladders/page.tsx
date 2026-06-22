'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedPost, isLoggedIn } from '@/lib/api';

const I = {
  bars: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
};

export default function LaddersPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [openId, setOpenId] = useState('');
  const [error, setError] = useState('');

  async function create() {
    if (title.trim().length < 2) return;
    try {
      const l = await authedPost<{ id: string }>('/ladders', { title });
      router.push(`/ladders/${l.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <div className="space-y-4">
      <article className="tile c4">
        <div className="tile-head">
          <span className="tile-ic">{I.bars}</span>
          <span className="tile-title">نردبان رتبه‌بندی (Ladder / ELO)</span>
        </div>

        {isLoggedIn() ? (
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
              placeholder="نام نردبان (مثلاً Ranked فصل ۱)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={create} className="btn-primary flex-none">
              {I.plus}
              ساخت نردبان
            </button>
          </div>
        ) : (
          <p className="mt-auto text-sm text-muted">
            برای ساخت نردبان{' '}
            <a href="/login" className="font-semibold text-accent">
              وارد شوید
            </a>
            .
          </p>
        )}
      </article>

      <article className="tile c4">
        <div className="tile-head">
          <span className="tile-ic amber">{I.search}</span>
          <span className="tile-title">باز کردن نردبان موجود</span>
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
            placeholder="باز کردن نردبان با شناسه"
            value={openId}
            onChange={(e) => setOpenId(e.target.value)}
          />
          <button
            onClick={() => openId.trim() && router.push(`/ladders/${openId.trim()}`)}
            className="btn-ghost flex-none"
          >
            باز کن
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      </article>
    </div>
  );
}
