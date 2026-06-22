'use client';

import { useEffect, useState } from 'react';
import { publicGet, authedPost, isLoggedIn } from '@/lib/api';

interface Space {
  id: string;
  title: string;
  tournamentId?: string;
  memberIds: string[];
  posts: unknown[];
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>,
  post: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M4 12h16M4 19h10" /></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
};

const CRESTS = ['#2dd4bf', '#fbbf24', '#818cf8', '#34d399', '#f472b6', '#60a5fa', '#fb7185'];
function crestColor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CRESTS[h % CRESTS.length];
}
function Crest({ name, size = 38 }: { name: string; size?: number }) {
  const init = (name || '?').replace(/[^A-Za-z0-9؀-ۿ]/g, '').slice(0, 2).toUpperCase() || '?';
  return (
    <span className="crest flex-none" style={{ width: size, height: size, background: crestColor(name), fontSize: size * 0.4 }}>
      {init}
    </span>
  );
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setSpaces(await publicGet<Space[]>('/spaces'));
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
      await authedPost('/spaces', { title });
      setTitle('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-4">
        <div className="tile-head !mb-0">
          <span className="tile-ic">{I.chat}</span>
          <span className="tile-title">کامیونیتی‌ها</span>
          <span className="ms-auto chip bg-accent/15 text-[#5eead4]">{fmt(spaces.length)} فضا</span>
        </div>
      </div>

      {isLoggedIn() && (
        <div className="card p-3 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 text-sm text-text outline-none transition placeholder:text-faint focus:border-accent-dim"
            placeholder="نام کامیونیتی (مثلاً هواداران Warzone)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button onClick={create} className="btn-primary flex-none">
            {I.plus}
            ساخت
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-center text-sm text-bad">{error}</p>
      )}

      <ul className="space-y-2">
        {spaces.map((s) => (
          <li key={s.id}>
            <a
              href={`/spaces/${s.id}`}
              className="row-soft flex items-center gap-3 px-4 py-3"
            >
              <Crest name={s.title} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{s.title}</span>
                <span className="mt-0.5 flex items-center gap-3 text-[11px] text-faint">
                  <span className="inline-flex items-center gap-1">{I.users} <b className="tnum">{fmt(s.memberIds.length)}</b> عضو</span>
                  <span className="inline-flex items-center gap-1">{I.post} <b className="tnum">{fmt(s.posts.length)}</b> پست</span>
                </span>
              </span>
              <span className="text-faint">{I.arrow}</span>
            </a>
          </li>
        ))}
        {spaces.length === 0 && (
          <li className="card grid place-items-center py-10 text-center text-sm text-faint">
            هنوز کامیونیتی‌ای ساخته نشده.
          </li>
        )}
      </ul>
    </div>
  );
}
