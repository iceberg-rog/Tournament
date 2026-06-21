'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Season {
  id: string;
  title: string;
  tournamentIds: string[];
}
interface Standing {
  participantId: string;
  name: string;
  points: number;
  tournamentsPlayed: number;
}

export default function SeasonDetailPage() {
  const id = useParams().id as string;
  const [season, setSeason] = useState<Season | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [tid, setTid] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSeason(await publicGet<Season>(`/seasons/${id}`));
      setStandings(await publicGet<Standing[]>(`/seasons/${id}/standings`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }
  useEffect(() => {
    if (id) load();
  }, [id]);

  async function addTournament() {
    if (!tid.trim()) return;
    try {
      await authedPost(`/seasons/${id}/tournaments`, { tournamentId: tid });
      setTid('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!season) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <a href="/seasons" className="text-sm text-indigo-400">
        ← فصل‌ها
      </a>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{season.title}</h1>
      <p className="mb-6 text-sm text-slate-400">{season.tournamentIds.length} تورنومنت در این فصل</p>

      {isLoggedIn() && (
        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            placeholder="شناسه‌ی تورنومنت (کامل‌شده) برای افزودن به فصل"
            value={tid}
            onChange={(e) => setTid(e.target.value)}
          />
          <button onClick={addTournament} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
            افزودن
          </button>
        </div>
      )}
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <h2 className="mb-3 font-bold">جدول امتیازات فصل</h2>
      <table className="w-full text-sm">
        <thead className="text-slate-400">
          <tr>
            <th className="py-2 text-right">#</th>
            <th className="text-right">بازیکن</th>
            <th className="text-left">امتیاز</th>
            <th className="text-left">تورنومنت</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.participantId} className="border-t border-slate-800">
              <td className="py-2">{i + 1}</td>
              <td>{s.name}</td>
              <td className="text-left font-bold text-indigo-300">{s.points}</td>
              <td className="text-left text-slate-400">{s.tournamentsPlayed}</td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-slate-400">
                هنوز تورنومنت کامل‌شده‌ای در فصل نیست.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
