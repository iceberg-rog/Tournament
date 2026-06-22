'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicGet } from '@/lib/api';
import { Reveal } from '@/components/Reveal';
import { TournamentCard } from '@/components/TournamentCard';
import { FeaturedTournamentPreview } from '@/components/FeaturedTournamentPreview';
import { topPrize, type TournamentRow } from '@/lib/tournaments';

const arrowIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

/** منتخب را برمی‌گزیند: اولین زنده‌ی جایزه‌دار، سپس اولین زنده، سپس اولین پیش‌نویسِ جایزه‌دار، در نهایت اولین. */
function pickFeatured(list: TournamentRow[]): TournamentRow {
  return (
    list.find((t) => t.status === 'RUNNING' && topPrize(t) != null) ??
    list.find((t) => t.status === 'RUNNING') ??
    list.find((t) => t.status === 'DRAFT' && topPrize(t) != null) ??
    list[0]
  );
}

function ShowcaseSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
      <div className="aspect-[16/10] w-full animate-pulse rounded-2xl border border-line bg-tile" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-tile">
            <div className="aspect-[16/9] w-full animate-pulse bg-tile2" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-2/3 animate-pulse rounded bg-tile2" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-tile2" />
              <div className="h-8 w-full animate-pulse rounded-xl bg-tile2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveTournamentsShowcase() {
  const [rows, setRows] = useState<TournamentRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    publicGet<TournamentRow[]>('/tournaments')
      .then((list) => {
        if (!alive) return;
        const order = (s: string) => (s === 'RUNNING' ? 0 : s === 'DRAFT' ? 1 : 2);
        setRows([...list].sort((a, b) => order(a.status) - order(b.status)));
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // در حالِ بارگذاری → اسکلتون
  if (rows === null) {
    return (
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="space-y-3">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-tile" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-tile" />
          </div>
        </div>
        <ShowcaseSkeleton />
      </section>
    );
  }

  // لیستِ خالی → چیزی رندر نمی‌شود
  if (rows.length === 0) return null;

  const featured = pickFeatured(rows);
  const others = rows.filter((t) => t.id !== featured.id).slice(0, 6);

  return (
    <Reveal as="section">
      {/* بلوکِ عنوان */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="flex items-center gap-3 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">
            <span className="live-pill"><span className="dot" />زنده</span>
            تورنومنت‌های در جریان
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            رقابت‌هایی که همین حالا در جریان‌اند یا ثبت‌نامشان باز است — منتخبِ امروز را ببین و به مسابقه‌ی بعدی‌ات بپیوند.
          </p>
        </div>
        <Link
          href="/tournaments"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent transition hover:text-[#5eead4]"
        >
          همه‌ی تورنومنت‌ها {arrowIcon}
        </Link>
      </div>

      {/* منتخب کنارِ شبکه‌ی کارت‌ها */}
      <div className="grid items-start gap-5 md:grid-cols-[1fr_1.1fr]">
        <Reveal delay={60}>
          <FeaturedTournamentPreview t={featured} />
        </Reveal>

        {others.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((t, i) => (
              <Reveal key={t.id} delay={120 + i * 70} className="h-full">
                <TournamentCard t={t} guest={true} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
