'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Ladder {
  id: string;
  title: string;
  queue: string[];
}
interface Rating {
  userId: string;
  rating: number;
  wins: number;
  played: number;
  rank: number;
}

export default function LadderDetailPage() {
  const id = useParams().id as string;
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [standings, setStandings] = useState<Rating[]>([]);
  const [pair, setPair] = useState<{ a: string; b: string } | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLadder(await publicGet<Ladder>(`/ladders/${id}`));
      setStandings(await publicGet<Rating[]>(`/ladders/${id}/standings`));
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

  async function matchmake() {
    setError('');
    try {
      const p = await authedPost<{ a: string; b: string } | null>(`/ladders/${id}/matchmake`);
      setPair(p && p.a ? p : null);
      if (!(p && p.a)) setError('برای جفت‌سازی حداقل ۲ نفر باید در صف باشند.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  async function report(winnerId: string) {
    if (!pair) return;
    await act(async () => {
      await authedPost(`/ladders/${id}/report`, { a: pair.a, b: pair.b, winnerId });
      setPair(null);
    });
  }

  if (!ladder) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  const short = (uid: string) => uid.slice(0, 8);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <a href="/ladders" className="text-sm text-indigo-400">
        ← نردبان‌ها
      </a>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{ladder.title}</h1>
      <p className="mb-6 text-sm text-slate-400">{ladder.queue.length} نفر در صف</p>

      {isLoggedIn() && (
        <div className="mb-6 space-y-3 rounded-lg bg-slate-900 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => act(() => authedPost(`/ladders/${id}/join`))}
              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              پیوستن به صف
            </button>
            <button
              onClick={matchmake}
              className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
            >
              جفت‌سازی
            </button>
          </div>
          {pair && (
            <div className="rounded-lg bg-slate-800 p-3">
              <p className="mb-2 text-sm text-slate-300">
                مسابقه: <b>{short(pair.a)}</b> در برابر <b>{short(pair.b)}</b> — برنده؟
              </p>
              <div className="flex gap-2">
                <button onClick={() => report(pair.a)} className="rounded-lg bg-emerald-600 px-4 py-1.5 hover:bg-emerald-500">
                  {short(pair.a)}
                </button>
                <button onClick={() => report(pair.b)} className="rounded-lg bg-emerald-600 px-4 py-1.5 hover:bg-emerald-500">
                  {short(pair.b)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {error && <p className="mb-3 text-amber-400">{error}</p>}

      <h2 className="mb-3 font-bold">جدول رتبه‌بندی (ELO)</h2>
      <table className="w-full text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="py-2 text-right">#</th>
            <th className="text-right">بازیکن</th>
            <th className="text-left">امتیاز</th>
            <th className="text-left">برد</th>
            <th className="text-left">بازی</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.userId} className="border-t border-slate-800">
              <td className="py-2">{s.rank}</td>
              <td className="font-mono text-slate-300">{short(s.userId)}</td>
              <td className="text-left font-bold text-indigo-300">{s.rating}</td>
              <td className="text-left text-slate-400">{s.wins}</td>
              <td className="text-left text-slate-400">{s.played}</td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-slate-400">
                هنوز کسی به صف نپیوسته.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
