import Link from 'next/link';
import { Reveal } from './Reveal';
import { FeaturedTournamentPreview } from './FeaturedTournamentPreview';
import { TournamentCard } from './TournamentCard';
import { FEATURED_TOURNAMENT, LANDING_TOURNAMENTS } from '@/lib/landingTournaments';

export function LiveTournamentsShowcase() {
  const featured = FEATURED_TOURNAMENT;
  const others = LANDING_TOURNAMENTS.filter((t) => t.id !== featured.id).slice(0, 4);

  return (
    <Reveal as="section">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 font-display text-[clamp(22px,3vw,34px)] font-bold">
            تورنومنت‌های فعالِ SHELTER
            <span className="live-pill"><span className="dot" />زنده</span>
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted">رقابت‌های رسمی و منتخب روی بازی‌های محبوب؛ ثبت‌نام کن، براکت را دنبال کن و وارد رقابت شو.</p>
        </div>
        <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          همه‌ی تورنومنت‌ها
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </Link>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_1.05fr]">
        <FeaturedTournamentPreview t={featured} />
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((t, i) => (
            <Reveal key={t.id} delay={i * 70} className="h-full">
              <TournamentCard t={t} guest />
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
