'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedPost, isLoggedIn } from '@/lib/api';

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
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">نردبان رتبه‌بندی (Ladder / ELO)</h1>

      {isLoggedIn() ? (
        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="نام نردبان (مثلاً Ranked فصل ۱)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button onClick={create} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
            ساخت نردبان
          </button>
        </div>
      ) : (
        <p className="mb-6 text-slate-400">
          برای ساخت نردبان{' '}
          <a href="/login" className="text-indigo-400">
            وارد شوید
          </a>
          .
        </p>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
          placeholder="باز کردن نردبان با شناسه"
          value={openId}
          onChange={(e) => setOpenId(e.target.value)}
        />
        <button
          onClick={() => openId.trim() && router.push(`/ladders/${openId.trim()}`)}
          className="rounded-lg border border-slate-700 px-5 py-2 hover:bg-slate-800"
        >
          باز کن
        </button>
      </div>
      {error && <p className="mt-3 text-red-400">{error}</p>}
    </main>
  );
}
