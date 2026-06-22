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

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  back: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
  users: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>,
  swords: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /><path d="M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-2-2M8 16l-4 4M5 21l-2-2" /></svg>,
  list: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
};

const TileHead = ({ icon, title, amber, action }: { icon: React.ReactNode; title: string; amber?: boolean; action?: React.ReactNode }) => (
  <div className="tile-head">
    <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
    <span className="tile-title">{title}</span>
    {action && <span className="ms-auto">{action}</span>}
  </div>
);

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

  if (!ladder) return <div className="card p-8 text-sm text-muted">{error || 'در حال بارگذاری...'}</div>;

  const short = (uid: string) => uid.slice(0, 8);

  return (
    <div className="space-y-4">
      <a href="/ladders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        {I.back} نردبان‌ها
      </a>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{ladder.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-faint">
              <span className="text-muted">{I.users}</span>
              {fmt(ladder.queue.length)} نفر در صف
            </p>
          </div>
          <span className="chip bg-accent/15 text-[#5eead4]">نردبان ELO</span>
        </div>

        {isLoggedIn() && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => act(() => authedPost(`/ladders/${id}/join`))} className="btn-ghost">
                پیوستن به صف
              </button>
              <button onClick={matchmake} className="btn-primary">
                {I.swords}
                جفت‌سازی
              </button>
            </div>
            {pair && (
              <div className="rounded-[14px] border border-line bg-tile2 p-4">
                <p className="mb-3 text-sm text-muted">
                  مسابقه: <b className="num text-text">{short(pair.a)}</b> در برابر <b className="num text-text">{short(pair.b)}</b> — برنده؟
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => report(pair.a)} className="btn-primary num">
                    {short(pair.a)}
                  </button>
                  <button onClick={() => report(pair.b)} className="btn-primary num">
                    {short(pair.b)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-gold/30 bg-gold/15 px-4 py-2 text-center text-sm text-gold">{error}</p>
      )}

      <div className="card p-5">
        <TileHead icon={I.list} title="جدول رتبه‌بندی (ELO)" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-faint">
                <th className="py-2 text-right font-semibold">#</th>
                <th className="text-right font-semibold">بازیکن</th>
                <th className="text-left font-semibold">امتیاز</th>
                <th className="text-left font-semibold">برد</th>
                <th className="text-left font-semibold">بازی</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.userId} className="border-t border-line">
                  <td className="py-2.5">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-md font-display text-[12px] font-bold tnum ${
                        s.rank === 1
                          ? 'bg-accent/20 text-accent'
                          : s.rank <= 3
                            ? 'bg-accent/10 text-[#5eead4]'
                            : 'bg-white/5 text-faint'
                      }`}
                    >
                      {fmt(s.rank)}
                    </span>
                  </td>
                  <td className="font-mono text-muted">{short(s.userId)}</td>
                  <td className="text-left font-bold text-accent num">{fmt(s.rating)}</td>
                  <td className="text-left text-muted num">{fmt(s.wins)}</td>
                  <td className="text-left text-muted num">{fmt(s.played)}</td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-faint">
                    هنوز کسی به صف نپیوسته.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
