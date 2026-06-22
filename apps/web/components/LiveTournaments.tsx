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
  DRAFT: 'bg-slate-500/20 text-slate-300',
  RUNNING: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-violet-500/20 text-violet-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};
const fmt = (n: number) => n.toLocaleString('fa-IR');

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔴 تورنومنت‌های در جریان</h2>
        <Link href="/tournaments" className="text-sm text-fuchsia-300 hover:underline">
          مشاهده‌ی همه ←
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-fuchsia-500/30">
            <CoverBanner coverImage={t.coverImage} game={t.game} rounded="rounded-none" className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-bold">{t.title}</h3>
                <span className={`chip shrink-0 ${stColor[t.status] ?? ''}`}>{stFa[t.status] ?? t.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {t.game ?? 'بدون بازی'}
                {t.platform ? ` · ${t.platform}` : ''} · 👥 {fmt(t.participants.length)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
