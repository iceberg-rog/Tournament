'use client';

import { useEffect, useState } from 'react';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Season {
  id: string;
  title: string;
  tournamentIds: string[];
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  trophy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
};

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSeasons(await publicGet<Season[]>('/seasons'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (title.trim().length < 2) return;
    try {
      await authedPost('/seasons', { title });
      setTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-center text-sm text-bad">{error}</p>
      )}

      {isLoggedIn() && (
        <div className="card p-4">
          <div className="tile-head">
            <span className="tile-ic amber">{I.plus}</span>
            <span className="tile-title">فصلِ جدید</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-text placeholder:text-faint outline-none transition focus:border-accent-dim"
              placeholder="عنوان فصل (مثلاً فصل بهار ۱۴۰۵)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={create} className="btn-primary flex-none">
              {I.plus}
              ساخت فصل
            </button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="tile-head">
          <span className="tile-ic">{I.calendar}</span>
          <span className="tile-title">فصل‌ها</span>
        </div>

        <ul className="flex flex-col gap-2">
          {seasons.map((s) => (
            <li key={s.id}>
              <a
                href={`/seasons/${s.id}`}
                className="row-soft flex items-center gap-2.5 px-3 py-3"
              >
                <span className="tile-ic flex-none">{I.calendar}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{s.title}</span>
                  <span className="block text-[11px] text-faint tnum">{fmt(s.tournamentIds.length)} تورنومنت</span>
                </span>
                <span className="chip flex-none bg-accent/15 text-[#5eead4]">
                  {I.trophy}
                  <span className="tnum">{fmt(s.tournamentIds.length)}</span>
                </span>
                <span className="text-faint">{I.arrow}</span>
              </a>
            </li>
          ))}
          {seasons.length === 0 && (
            <li className="grid place-items-center py-10 text-center text-sm text-faint">
              هنوز فصلی ساخته نشده.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
