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

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>,
  bars: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
};

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

  if (!season) return <div className="card p-8 text-sm text-muted">{error || 'در حال بارگذاری...'}</div>;

  return (
    <div className="space-y-4">
      <a href="/seasons" className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition hover:text-[#5eead4]">
        {I.arrow} فصل‌ها
      </a>

      <header className="card flex flex-wrap items-center gap-3 p-5">
        <span className="tile-ic amber" style={{ width: 38, height: 38 }}>{I.calendar}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{season.title}</h1>
          <p className="mt-0.5 text-sm text-faint">
            <span className="num">{fmt(season.tournamentIds.length)}</span> تورنومنت در این فصل
          </p>
        </div>
      </header>

      {isLoggedIn() && (
        <div className="card flex flex-col gap-2 p-4 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-text placeholder:text-faint focus:border-accent-dim focus:outline-none"
            placeholder="شناسه‌ی تورنومنت (کامل‌شده) برای افزودن به فصل"
            value={tid}
            onChange={(e) => setTid(e.target.value)}
          />
          <button onClick={addTournament} className="btn-primary flex-none">
            {I.plus}
            افزودن
          </button>
        </div>
      )}
      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-center text-sm text-bad">{error}</p>
      )}

      <section className="card p-5">
        <div className="tile-head">
          <span className="tile-ic">{I.bars}</span>
          <span className="tile-title">جدول امتیازات فصل</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-faint">
            <tr className="text-[11px] uppercase tracking-wide">
              <th className="py-2 text-right font-semibold">#</th>
              <th className="text-right font-semibold">بازیکن</th>
              <th className="text-left font-semibold">امتیاز</th>
              <th className="text-left font-semibold">تورنومنت</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.participantId} className="border-t border-line">
                <td className="py-2.5">
                  <span className={`grid h-[26px] w-[26px] place-items-center rounded-md font-display text-[11px] font-bold tnum ${i === 0 ? 'bg-gold/20 text-gold' : i < 3 ? 'bg-white/10 text-slate-100' : 'bg-white/5 text-faint'}`}>{i + 1}</span>
                </td>
                <td className="font-semibold">{s.name}</td>
                <td className="text-left font-bold text-accent num">{fmt(s.points)}</td>
                <td className="text-left text-muted num">{fmt(s.tournamentsPlayed)}</td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-faint">
                  هنوز تورنومنت کامل‌شده‌ای در فصل نیست.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
