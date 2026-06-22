import Link from 'next/link';

export function TournamentHero({ liveCount }: { liveCount?: number }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-tile2 to-tile p-8 md:p-12">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-gold/10 blur-[90px]" />
      <div className="relative max-w-2xl">
        {typeof liveCount === 'number' && liveCount > 0 && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-bad/30 bg-bad/10 px-3 py-1 text-xs font-bold text-[#fca5a5]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />
            هم‌اکنون {liveCount.toLocaleString('fa-IR')} تورنومنت در حال انجام
          </span>
        )}
        <h1 className="font-display text-[clamp(26px,4vw,42px)] font-bold leading-tight">
          تورنومنت‌های گیمینگ را پیدا کن،
          <br />
          <span className="bg-gradient-to-l from-accent to-gold bg-clip-text text-transparent">شرکت کن و رقابت را شروع کن</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted md:text-base">
          صدها تورنومنتِ Valorant، FC، CS2، Dota و… را مرور کن، تیمت را ثبت‌نام کن و برای جایزه بجنگ — همه در یک‌جا، در SHELTER.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary px-6 py-2.5">شروعِ رایگان</Link>
          <Link href="/games" className="btn-ghost px-6 py-2.5">مرورِ بازی‌ها</Link>
        </div>
      </div>
    </section>
  );
}
