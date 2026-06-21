'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { authedPost, isLoggedIn, publicGet } from '@/lib/api';

interface Participant {
  id: string;
  name: string;
}
interface TournamentRecord {
  id: string;
  title: string;
  format: string;
  genre: string;
  status: string;
  participants: Participant[];
}
interface ReadyMatch {
  id: string;
  kind: 'DUEL' | 'LOBBY';
  participantIds: string[];
}
interface Standing {
  participantId: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
}

export default function TournamentDetail() {
  const params = useParams();
  const id = String(params.id);
  const [rec, setRec] = useState<TournamentRecord | null>(null);
  const [ready, setReady] = useState<ReadyMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  const load = useCallback(async () => {
    try {
      const t = await publicGet<TournamentRecord>(`/tournaments/${id}`);
      setRec(t);
      if (t.status === 'RUNNING') setReady(await publicGet<ReadyMatch[]>(`/tournaments/${id}/ready`));
      else setReady([]);
      if (t.status !== 'DRAFT') setStandings(await publicGet<Standing[]>(`/tournaments/${id}/standings`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = (pid: string) => rec?.participants.find((p) => p.id === pid)?.name ?? pid;

  async function act(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!rec) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/tournaments" className="text-sm text-indigo-400">
        ← همه‌ی تورنومنت‌ها
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold">{rec.title}</h1>
      <p className="mb-4 text-slate-400">
        {rec.format} · {rec.genre} · وضعیت: <b>{rec.status}</b>
      </p>

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {loggedIn && rec.status === 'DRAFT' && (
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/register`, {}))}
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
          >
            ثبت‌نام من
          </button>
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/start`, {}))}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            شروع تورنومنت
          </button>
        </div>
      )}

      <section className="mb-6">
        <h2 className="mb-2 font-bold">شرکت‌کنندگان ({rec.participants.length})</h2>
        <div className="flex flex-wrap gap-2">
          {rec.participants.map((p) => (
            <span key={p.id} className="rounded bg-slate-800 px-3 py-1 text-sm">
              {p.name}
            </span>
          ))}
          {rec.participants.length === 0 && <span className="text-slate-500">هنوز کسی ثبت‌نام نکرده.</span>}
        </div>
      </section>

      {rec.status === 'RUNNING' && (
        <section className="mb-6">
          <h2 className="mb-2 font-bold">مسابقات آماده</h2>
          {ready.length === 0 && <p className="text-slate-500">مسابقه‌ی آماده‌ای نیست.</p>}
          <div className="flex flex-col gap-2">
            {ready.map((m) =>
              m.kind === 'DUEL' ? (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
                  <span>
                    {nameOf(m.participantIds[0])} <span className="text-slate-500">vs</span>{' '}
                    {nameOf(m.participantIds[1])}
                  </span>
                  {loggedIn && (
                    <span className="flex gap-2">
                      {m.participantIds.map((pid) => (
                        <button
                          key={pid}
                          onClick={() =>
                            act(() =>
                              authedPost(`/tournaments/${id}/matches/${m.id}/report`, { winnerId: pid }),
                            )
                          }
                          className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500"
                        >
                          برنده: {nameOf(pid)}
                        </button>
                      ))}
                    </span>
                  )}
                </div>
              ) : (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
                  <span>لابی ({m.participantIds.length} نفر)</span>
                  {loggedIn && (
                    <button
                      onClick={() =>
                        act(() =>
                          authedPost(`/tournaments/${id}/matches/${m.id}/report`, {
                            rankedIds: m.participantIds,
                          }),
                        )
                      }
                      className="rounded bg-emerald-600 px-3 py-1 text-sm hover:bg-emerald-500"
                    >
                      ثبت رتبه‌بندی (ترتیب فعلی)
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {standings.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">رده‌بندی</h2>
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="p-2 text-right">#</th>
                <th className="p-2 text-right">بازیکن</th>
                <th className="p-2 text-right">برد</th>
                <th className="p-2 text-right">باخت</th>
                <th className="p-2 text-right">امتیاز</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s) => (
                <tr key={s.participantId} className="border-t border-slate-800">
                  <td className="p-2">{s.rank}</td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.wins}</td>
                  <td className="p-2">{s.losses}</td>
                  <td className="p-2">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
