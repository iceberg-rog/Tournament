import Link from 'next/link';
import { CoverBanner } from './CoverBanner';
import { TournamentStatusBadge } from './TournamentStatusBadge';
import { FORMAT_FA, fmt, topPrize, type TournamentRow } from '@/lib/tournaments';

export function FeaturedTournamentPreview({ t }: { t: TournamentRow }) {
  const prize = topPrize(t);
  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-line shadow-[0_22px_50px_-26px_rgba(0,0,0,.9)] transition hover:border-accent/40"
    >
      <div className="relative aspect-[16/10] w-full">
        <CoverBanner game={t.game} coverImage={t.coverImage} rounded="rounded-none" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.03]" showName={false} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/10" />
        <span className="absolute right-3 top-3"><TournamentStatusBadge status={t.status} /></span>
        <span className="absolute left-3 top-3 rounded-full border border-gold/40 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-gold backdrop-blur">منتخب</span>
        <div className="absolute inset-x-4 bottom-4">
          <p className="text-xs text-slate-300">{t.game ?? 'بدون بازی'} · {FORMAT_FA[t.format] ?? t.format}</p>
          <h3 className="mt-0.5 truncate text-xl font-extrabold text-white drop-shadow">{t.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <span className="tnum">{fmt(t.participants.length)}{t.maxParticipants ? ` / ${fmt(t.maxParticipants)}` : ''} شرکت‌کننده</span>
            {prize ? <span className="font-semibold text-gold tnum">جایزه {fmt(prize)} تومان</span> : null}
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur transition group-hover:bg-accent group-hover:text-[#06231f]">
            مشاهده‌ی تورنومنت
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
