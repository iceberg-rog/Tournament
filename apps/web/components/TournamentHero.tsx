import Link from 'next/link';
import { FeaturedTournamentPreview } from './FeaturedTournamentPreview';
import { fmt, type TournamentRow } from '@/lib/tournaments';

export function TournamentHero({
  stats,
  featured,
}: {
  stats: { open: number; live: number; done: number };
  featured?: TournamentRow;
}) {
  const Stat = ({ n, label, accent }: { n: number; label: string; accent?: boolean }) => (
    <div className="flex flex-col">
      <span className={`font-display text-2xl font-bold tnum ${accent ? 'text-accent' : ''}`}>{fmt(n)}</span>
      <span className="text-[11px] text-faint">{label}</span>
    </div>
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-tile2 to-tile">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-gold/10 blur-[90px]" />

      <div className="relative grid items-center gap-8 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-10">
        {/* متن */}
        <div>
          {stats.live > 0 && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-bad/30 bg-bad/10 px-3 py-1 text-xs font-bold text-[#fca5a5]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />
              هم‌اکنون {fmt(stats.live)} تورنومنت در حال انجام
            </span>
          )}
          <h1 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight">
            تورنومنت‌های گیمینگ را پیدا کن،
            <br />
            <span className="bg-gradient-to-l from-accent to-gold bg-clip-text text-transparent">شرکت کن و رقابت را شروع کن</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted">
            صدها تورنومنتِ Valorant، FC، CS2، Dota و… را مرور کن، تیمت را ثبت‌نام کن و برای جایزه بجنگ — همه در SHELTER.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-2.5">شروعِ رایگان</Link>
            <Link href="/games" className="btn-ghost px-6 py-2.5">مرورِ بازی‌ها</Link>
          </div>
          <div className="mt-6 flex gap-8 border-t border-line pt-4">
            <Stat n={stats.open} label="در حال ثبت‌نام" accent />
            <Stat n={stats.live} label="در حال انجام" />
            <Stat n={stats.done} label="پایان‌یافته" />
          </div>
        </div>

        {/* ویژوال (فقط دسکتاپ تا هیروِ موبایل کوتاه بماند) */}
        {featured && (
          <div className="hidden md:block">
            <FeaturedTournamentPreview t={featured} />
          </div>
        )}
      </div>
    </section>
  );
}
