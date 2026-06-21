'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn, publicGet } from '@/lib/api';

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
  waitlist?: Participant[];
  requireCheckIn?: boolean;
  maxParticipants?: number;
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
  const router = useRouter();
  const id = String(params.id);
  const [rec, setRec] = useState<TournamentRecord | null>(null);
  const [ready, setReady] = useState<ReadyMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [myScore, setMyScore] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  const load = useCallback(async () => {
    try {
      const t = await publicGet<TournamentRecord>(`/tournaments/${id}`);
      setRec(t);
      if (t.status === 'RUNNING') setReady(await publicGet<ReadyMatch[]>(`/tournaments/${id}/ready`));
      else setReady([]);
      if (t.status !== 'DRAFT') setStandings(await publicGet<Standing[]>(`/tournaments/${id}/standings`));
      if (t.status === 'COMPLETED') {
        setRating(await publicGet(`/tournaments/${id}/rating`));
        if (isLoggedIn()) {
          const mine = await authedGet<{ score: number } | null>(`/tournaments/${id}/my-rating`).catch(
            () => null,
          );
          setMyScore(mine?.score ?? 0);
        }
      }
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

      {loggedIn && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() =>
              act(async () => {
                const copy = await authedPost<{ id: string }>(`/tournaments/${id}/copy`, {});
                router.push(`/tournaments/${copy.id}`);
              })
            }
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
          >
            کپی
          </button>
          {rec.status === 'DRAFT' && (
            <>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="عنوان جدید"
                className="rounded-lg bg-slate-800 px-3 py-1.5"
              />
              <button
                onClick={() => editTitle.trim() && act(() => authedPost(`/tournaments/${id}/update`, { title: editTitle }))}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              >
                ذخیره‌ی عنوان
              </button>
            </>
          )}
          <a href="/report" className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800">
            اعتراض / گزارش
          </a>
        </div>
      )}

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
            onClick={() => act(() => authedPost(`/tournaments/${id}/withdraw`, {}))}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            انصراف
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
        {(rec.waitlist?.length ?? 0) > 0 && (
          <div className="mt-3 text-sm">
            <span className="text-slate-400">لیست انتظار: </span>
            {rec.waitlist!.map((p) => (
              <span key={p.id} className="ml-1 rounded bg-slate-700 px-2 py-1 text-xs">
                {p.name}
              </span>
            ))}
          </div>
        )}
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
                      {rec.requireCheckIn && (
                        <button
                          onClick={() =>
                            act(() => authedPost(`/tournaments/${id}/matches/${m.id}/checkin`, {}))
                          }
                          className="rounded bg-sky-600 px-3 py-1 text-sm hover:bg-sky-500"
                        >
                          check-in
                        </button>
                      )}
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

      {rec.status === 'COMPLETED' && (
        <section className="mt-6 rounded-lg bg-slate-900 p-5">
          <h2 className="mb-2 font-bold">امتیاز به این مسابقه</h2>
          <p className="mb-3 text-sm text-slate-400">
            میانگین: <b className="text-amber-400">{rating.average || '—'}</b> از ۵ ({rating.count} رأی)
          </p>
          {loggedIn && (
            <div className="flex gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => act(async () => { await authedPost(`/tournaments/${id}/rate`, { score: s }); setMyScore(s); })}
                  className={`text-2xl ${s <= myScore ? 'text-amber-400' : 'text-slate-600'} hover:text-amber-300`}
                  aria-label={`${s} ستاره`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
