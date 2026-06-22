'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { publicGet } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';
import { GAMES, GAME_CATEGORIES } from '@/lib/games';

interface GameCount {
  game: string;
  total: number;
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

export default function GamesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    publicGet<GameCount[]>('/tournaments/games')
      .then((rows) => {
        const m: Record<string, number> = {};
        for (const r of rows) m[r.game] = r.total;
        setCounts(m);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      GAMES.filter(
        (g) => (!cat || g.category === cat) && (!q || g.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [cat, q],
  );

  // تعدادِ تورنومنت در هر دسته (برای شمارنده‌ی چیپ‌ها)
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

  const chip = (active: boolean) =>
    `chip transition ${active ? 'bg-accent text-[#06231f]' : 'bg-tile2 text-muted hover:text-text'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[clamp(20px,2.6vw,28px)] font-bold">دیسیپلین‌ها</h1>
          <p className="mt-0.5 text-sm text-faint">
            یک بازی را انتخاب کن و تورنومنت‌هایش را ببین — {fmt(GAMES.length)} بازی · {fmt(totalActive)} تورنومنتِ فعال
          </p>
        </div>
        <Link href="/tournaments/new" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          ساخت تورنومنت
        </Link>
      </div>

      {/* search + category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-tile px-3 py-2 text-sm focus-within:border-accent-dim">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-faint"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی بازی…" className="w-32 bg-transparent text-text outline-none placeholder:text-faint" />
        </label>
        <button onClick={() => setCat(null)} className={chip(cat === null)}>همه</button>
        {GAME_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>
            {c}
          </button>
        ))}
      </div>

      {/* games grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((g) => {
          const n = counts[g.name] ?? 0;
          return (
            <Link
              key={g.slug}
              href={`/tournaments?game=${encodeURIComponent(g.name)}`}
              className="group overflow-hidden rounded-2xl border border-line bg-tile transition hover:-translate-y-0.5 hover:border-accent/40"
            >
              <div className="relative">
                <CoverBanner game={g.name} rounded="rounded-none" className="h-36 w-full" />
                {n > 0 && (
                  <span className="absolute right-2 top-2 rounded-md bg-accent/90 px-2 py-0.5 text-[10px] font-bold text-[#06231f]">
                    {fmt(n)} تورنومنت
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" title={g.name}>{g.name}</p>
                  <p className="text-[11px] text-faint">{g.category}</p>
                </div>
                <span className="shrink-0 text-faint transition group-hover:text-accent">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="py-16 text-center text-faint">بازی‌ای با این فیلتر پیدا نشد.</p>}
    </div>
  );
}
