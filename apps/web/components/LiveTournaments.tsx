'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicGet } from '@/lib/api';
import { CoverBanner } from './CoverBanner';

interface Row {
  id: string;
  title: string;
  game?: string;
  format: string;
  status: string;
  participants: { id: string }[];
  platform?: string;
  coverImage?: string;
}

const stFa: Record<string, string> = { DRAFT: 'پیش‌رو', RUNNING: 'در حال اجرا', COMPLETED: 'پایان‌یافته', CANCELLED: 'لغوشده' };
const stColor: Record<string, string> = {
  DRAFT: 'bg-accent/15 text-[#5eead4]',
  RUNNING: 'bg-good/15 text-good',
  COMPLETED: 'bg-white/10 text-slate-300',
  CANCELLED: 'bg-bad/15 text-bad',
};
const fmt = (n: number) => n.toLocaleString('fa-IR');

const arrowIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
);
const usersIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>
);

export default function LiveTournaments() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    publicGet<Row[]>('/tournaments')
      .then((list) => {
        const order = (s: string) => (s === 'RUNNING' ? 0 : s === 'DRAFT' ? 1 : 2);
        setRows([...list].sort((a, b) => order(a.status) - order(b.status)).slice(0, 6));
      })
      .catch(() => {});
  }, []);

  if (rows.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-2xl font-bold">
          <span className="live-pill"><span className="dot" />زنده</span>
          تورنومنت‌های در جریان
        </h2>
        <Link href="/tournaments" className="flex items-center gap-1 text-sm font-semibold text-accent hover:text-[#5eead4]">
          مشاهده‌ی همه {arrowIcon}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/30">
            <CoverBanner coverImage={t.coverImage} game={t.game} rounded="rounded-none" className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-bold">{t.title}</h3>
                <span className={`chip shrink-0 ${stColor[t.status] ?? ''}`}>{stFa[t.status] ?? t.status}</span>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span>{t.game ?? 'بدون بازی'}{t.platform ? ` · ${t.platform}` : ''}</span>
                <span className="text-faint">·</span>
                <span className="inline-flex items-center gap-1 text-faint">{usersIcon}<span className="tnum">{fmt(t.participants.length)}</span></span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
