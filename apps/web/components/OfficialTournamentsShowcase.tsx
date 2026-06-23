'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CineReveal } from '@/components/CineReveal';
import {
  SHOWCASE_TOURNAMENTS,
  STATUS_META,
  type LandingTournament,
} from '@/lib/landingShowcase';

// ───────── نگاشتِ tone → رنگ‌بندیِ چیپِ وضعیت ─────────
const TONE_CHIP: Record<string, string> = {
  live: 'border-bad/40 bg-bad/15 text-[#fca5a5]',
  open: 'border-accent/40 bg-accent/15 text-accent',
  soon: 'border-gold/40 bg-gold/15 text-gold',
  done: 'border-white/12 bg-white/[.05] text-muted',
};

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-500 group-hover:-translate-x-0.5"
      aria-hidden
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

function TournamentShowcaseCard({ t, i }: { t: LandingTournament; i: number }) {
  const meta = STATUS_META[t.status];
  const pct = Math.min(100, Math.round((t.participants / t.capacity) * 100));
  const full = t.participants >= t.capacity;

  return (
    <CineReveal delay={i * 120} className="h-full">
      <Link
        href={t.href}
        aria-label={`${t.title} — ${meta.label} · ${meta.cta}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white/[.03] shadow-[var(--shadow)] backdrop-blur-md outline-none transition-all duration-500 ease-[var(--ease)] hover:-translate-y-1.5 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {/* گلوِ اختصاصیِ کارت (accent) — تنفسی هنگامِ hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px -z-10 rounded-[20px] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: `radial-gradient(420px 200px at 50% 0%, ${t.accent}, transparent 70%)` }}
        />

        {/* کاور */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {t.cover ? (
            <Image
              src={t.cover}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${t.accent}33, transparent)` }} />
          )}
          {/* ماتِ تیره برای خوانایی */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent" />
          {/* خطِ نوریِ بالای کاور با رنگِ اختصاصی */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }} />

          {/* چیپِ وضعیت */}
          <span className={`chip absolute end-3 top-3 border ${TONE_CHIP[meta.tone]} backdrop-blur-md`}>
            {meta.tone === 'live' && <span className="dot" />}
            {meta.label}
          </span>

          {/* بازی · پلتفرم روی کاور */}
          <div className="absolute bottom-3 start-3 flex items-center gap-1.5 text-[11px] font-medium text-white/85">
            <span className="rounded-md bg-black/45 px-2 py-0.5 backdrop-blur-sm">{t.game}</span>
            <span className="rounded-md bg-black/45 px-2 py-0.5 backdrop-blur-sm">{t.platform}</span>
          </div>
        </div>

        {/* بدنه */}
        <div className="flex flex-1 flex-col gap-3.5 p-4">
          <div>
            <h3 className="font-display text-[15.5px] font-bold leading-snug text-text line-clamp-2">{t.title}</h3>
            <p className="mt-1 text-xs text-muted">{t.format}</p>
          </div>

          {/* جایزه (طلایی) */}
          {t.prize && (
            <div className="flex items-center gap-1.5 text-gold">
              <TrophyIcon />
              <span className="num text-[14px] font-bold tracking-tight tnum">{t.prize}</span>
            </div>
          )}

          {/* ظرفیت + pbar */}
          <div className="mt-auto">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="text-muted">ظرفیت</span>
              <span className="num tnum text-faint">
                <span className={full ? 'text-gold' : 'text-text'}>{t.participants}</span>
                <span className="mx-0.5 text-faint">/</span>
                {t.capacity}
              </span>
            </div>
            <div className="pbar" role="presentation">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* CTAِ مبتنی‌بر وضعیت */}
          <span className="mt-1 inline-flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-text transition-colors duration-300 group-hover:border-accent/40 group-hover:bg-accent/[.06] group-hover:text-accent">
            {meta.cta}
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </CineReveal>
  );
}

export function OfficialTournamentsShowcase() {
  return (
    <section className="relative">
      {/* سرِ بخش */}
      <div className="relative mb-9 max-w-2xl">
        <span className="chip mb-3 border border-accent/30 bg-accent/10 text-accent">تورنومنت‌ها</span>
        <h2 className="font-display text-[clamp(24px,3.4vw,38px)] font-bold leading-tight text-text">
          تورنومنت‌های رسمیِ SHELTER
        </h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          رقابت‌های منتخب روی بازی‌های محبوب؛ ثبت‌نام کن، براکت را دنبال کن و وارد مسابقه شو.
        </p>
      </div>

      {/* شبکه‌ی کارت‌ها */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE_TOURNAMENTS.map((t, i) => (
          <TournamentShowcaseCard key={t.id} t={t} i={i} />
        ))}
      </div>

      {/* اکشنِ پایانی */}
      <CineReveal delay={SHOWCASE_TOURNAMENTS.length * 120} className="mt-9 flex justify-center">
        <Link
          href="/tournaments"
          className="btn-ghost group px-5 py-3 text-sm"
          aria-label="مشاهده‌ی همه‌ی تورنومنت‌ها"
        >
          مشاهده‌ی همه‌ی تورنومنت‌ها
          <ArrowIcon />
        </Link>
      </CineReveal>
    </section>
  );
}
