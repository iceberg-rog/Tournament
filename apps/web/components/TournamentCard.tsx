import Link from 'next/link';
import { CoverBanner } from './CoverBanner';
import { TournamentStatusBadge } from './TournamentStatusBadge';
import { FORMAT_FA, PLATFORM_FA, fmt, topPrize, type TournamentRow } from '@/lib/tournaments';

const Ico = ({ children, size = 13 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-tile2 px-2 py-1 text-[11px] text-muted">{children}</span>;
}

function ctaLabel(status: string, guest: boolean): string {
  if (status === 'DRAFT') return guest ? 'ورود برای ثبت‌نام' : 'ثبت‌نام / مشاهده';
  if (status === 'COMPLETED') return 'مشاهده‌ی نتایج';
  return 'مشاهده‌ی جزئیات';
}

export function TournamentCard({ t, guest = true }: { t: TournamentRow; guest?: boolean }) {
  const prize = topPrize(t);
  const open = t.status === 'DRAFT';
  const date = t.startAt ? new Date(t.startAt).toLocaleDateString('fa-IR') : null;

  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-tile transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_14px_32px_-20px_rgba(0,0,0,.75)]"
    >
      {/* کاور با نسبتِ ثابت */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <CoverBanner
          game={t.game}
          coverImage={t.coverImage}
          rounded="rounded-none"
          className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105"
          showName={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />
        <div className="absolute right-3 top-3">
          <TournamentStatusBadge status={t.status} />
        </div>
        <div className="absolute inset-x-3 bottom-2.5">
          <h3 className="truncate text-base font-extrabold text-white drop-shadow" title={t.title}>{t.title}</h3>
          <p className="truncate text-xs text-slate-300">
            {t.game ?? 'بدون بازی'} · {FORMAT_FA[t.format] ?? t.format}
          </p>
        </div>
      </div>

      {/* بدنه */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Chip>
            <Ico><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="16" cy="11" r="1" /></Ico>
            {PLATFORM_FA[t.platform ?? ''] ?? t.platform ?? 'PC'}
          </Chip>
          <Chip>
            <Ico><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></Ico>
            <span className="tnum">{fmt(t.participants.length)}{t.maxParticipants ? ` / ${fmt(t.maxParticipants)}` : ''}</span>
          </Chip>
          {date && (
            <Chip>
              <Ico><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Ico>
              <span className="tnum">{date}</span>
            </Chip>
          )}
        </div>

        {prize ? (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gold"><Ico size={15}><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></Ico></span>
            <span className="text-muted">جایزه:</span>
            <b className="text-gold tnum">{fmt(prize)}</b>
            <span className="text-xs text-faint">تومان</span>
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <span
            className={`block rounded-xl py-2 text-center text-sm font-bold transition ${
              open
                ? 'bg-gradient-to-l from-accent to-accent-dim text-[#06231f] group-hover:brightness-110'
                : 'border border-line text-slate-200 group-hover:border-accent/40'
            }`}
          >
            {ctaLabel(t.status, guest)}
          </span>
          {open && guest && <span className="mt-1.5 block text-center text-[11px] text-faint">یا مشاهده‌ی جزئیات بدونِ ورود</span>}
        </div>
      </div>
    </Link>
  );
}
