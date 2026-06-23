'use client';

// صحنه‌ی شناورِ تورنومنت‌ها — قطعه‌ی امضاییِ صفحه‌ی اصلی.
// همه‌ی کارت‌ها از SHOWCASE_TOURNAMENTS map می‌شوند (بدونِ JSXِ hardcoded).

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { SHOWCASE_TOURNAMENTS, STATUS_META, type LandingTournament } from '@/lib/landingShowcase';

// ───────── نگاشتِ tone وضعیت به استایلِ chip و نقطه ─────────
const TONE: Record<
  (typeof STATUS_META)[keyof typeof STATUS_META]['tone'],
  { chip: string; dot: string; pulse: boolean }
> = {
  live: { chip: 'border-bad/40 bg-bad/15 text-[#fca5a5]', dot: 'bg-bad', pulse: true },
  open: { chip: 'border-accent/40 bg-accent/15 text-accent', dot: 'bg-accent', pulse: false },
  soon: { chip: 'border-gold/40 bg-gold/15 text-gold', dot: 'bg-gold', pulse: false },
  done: { chip: 'border-white/10 bg-white/[.05] text-muted', dot: 'bg-faint', pulse: false },
};

function MetaIcon({ kind }: { kind: 'platform' | 'format' }) {
  const common = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'platform')
    return (
      <svg {...common} aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M7 12h2M8 11v2M15.5 11.5h.01M18 13h.01" />
      </svg>
    );
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 5h16M4 12h16M4 19h16" />
    </svg>
  );
}

/** کارتِ شیشه‌ایِ تورنومنت — کلیک‌پذیر، با کاور، chip وضعیت، جایزه و progress. */
export function FloatingTournamentCard({ t, featured = false }: { t: LandingTournament; featured?: boolean }) {
  const meta = STATUS_META[t.status];
  const tone = TONE[meta.tone];
  const pct = t.capacity > 0 ? Math.min(100, Math.round((t.participants / t.capacity) * 100)) : 0;

  return (
    <Link
      href={t.href}
      aria-label={`${t.title} — ${t.game}`}
      style={{ '--accent': t.accent } as React.CSSProperties}
      className={`group relative block overflow-hidden rounded-[20px] border border-white/10 bg-white/[.03] backdrop-blur-xl outline-none transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(.2,.7,.3,1)] [box-shadow:0_1px_0_rgba(255,255,255,.05)_inset,0_24px_60px_-30px_rgba(0,0,0,.9)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:[box-shadow:0_1px_0_rgba(255,255,255,.08)_inset,0_40px_90px_-36px_color-mix(in_srgb,var(--accent)_55%,#000)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
        featured ? 'w-[300px] sm:w-[340px]' : 'w-[256px] sm:w-[280px]'
      }`}
    >
      {/* گلوِ شعاعیِ اختصاصی روی لبه‌ی بالا */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-12 z-0 h-40 opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(60% 80% at 50% 0%, ${t.accent}, transparent 70%)` }}
      />

      {/* کاور */}
      <div className={`relative z-[1] w-full overflow-hidden ${featured ? 'h-40 sm:h-44' : 'h-32 sm:h-36'}`}>
        {t.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.cover}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.3,1)] group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${t.accent}33, #0e0f13)` }} />
        )}
        {/* گرادیانِ تیره برای خوانایی */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-50"
          style={{ background: `radial-gradient(70% 60% at 80% 10%, ${t.accent}, transparent 60%)` }}
        />

        {/* chip وضعیت */}
        <div className="absolute end-3 top-3">
          <span className={`chip border ${tone.chip} backdrop-blur-md`}>
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`}>
              {tone.pulse && <span className={`absolute inset-0 rounded-full ${tone.dot} animate-ping`} />}
            </span>
            {meta.label}
          </span>
        </div>
      </div>

      {/* بدنه */}
      <div className={`relative z-[1] flex flex-col ${featured ? 'gap-2.5 p-5' : 'gap-2 p-4'}`}>
        <h3 className={`font-display font-bold leading-snug text-text line-clamp-2 ${featured ? 'text-[17px]' : 'text-[15px]'}`}>
          {t.title}
        </h3>

        {/* بازی · پلتفرم · فرمت */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted">
          <span className="font-medium text-text/80">{t.game}</span>
          <span className="text-faint">·</span>
          <span className="inline-flex items-center gap-1">
            <MetaIcon kind="platform" />
            {t.platform}
          </span>
          <span className="text-faint">·</span>
          <span className="inline-flex items-center gap-1">
            <MetaIcon kind="format" />
            {t.format}
          </span>
        </div>

        {/* جایزه */}
        {t.prize && (
          <div className="mt-1 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 21h8M12 17v4M7 4h10l-1 7a4 4 0 0 1-8 0z" />
              <path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3" />
            </svg>
            <span className="font-display text-[13.5px] font-bold tnum text-gold">{t.prize}</span>
          </div>
        )}

        {/* ظرفیت + progress */}
        <div className="mt-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
              </svg>
              شرکت‌کننده
            </span>
            <span className="font-display tnum text-text/80">
              <span className="text-text">{t.participants}</span>
              <span className="text-faint"> / {t.capacity}</span>
            </span>
          </div>
          <div className="pbar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-2.5 flex items-center justify-between border-t border-white/[.06] pt-2.5">
          <span className="text-[12.5px] font-semibold text-muted transition-colors duration-300 group-hover:text-accent">
            {meta.cta}
          </span>
          <span
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-muted transition-all duration-300 group-hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] group-hover:text-accent group-hover:[transform:translateX(-3px)]"
            aria-hidden="true"
          >
            {/* RTL: فلش به سمتِ چپ یعنی «ادامه» */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ترتیبِ شناورِ دسکتاپ — موقعیت/مقیاس/عمقِ هر کارتِ غیرِ featured حول مرکز.
// تعریفِ دستی برای حسِ «عمدی و premium» (نه random).
const DESKTOP_SLOTS = [
  { top: '4%', start: '0%', scale: 0.82, opacity: 0.82, z: 20, floatDelay: '0s' },
  { top: '0%', end: '0%', scale: 0.86, opacity: 0.86, z: 20, floatDelay: '1.4s' },
  { top: '52%', start: '5%', scale: 0.74, opacity: 0.66, z: 10, floatDelay: '2.1s' },
  { top: '50%', end: '4%', scale: 0.78, opacity: 0.72, z: 10, floatDelay: '0.7s' },
  { top: '70%', start: '32%', scale: 0.7, opacity: 0.58, z: 5, floatDelay: '2.8s' },
] as const;

/** صحنه‌ی عمق‌دار: featured جلو و بزرگ، بقیه دورِ آن شناور. */
export function FloatingTournamentScene() {
  const [featured, ...rest] = SHOWCASE_TOURNAMENTS;

  return (
    <div className="relative" dir="rtl">
      {/* ───────── دسکتاپ: ترکیبِ شناورِ مطلق ───────── */}
      <div className="relative mx-auto hidden h-[560px] max-w-[1100px] lg:block">
        {/* گلوِ مرکزی که نفس می‌کشد */}
        <div
          aria-hidden="true"
          className="glow-breathe pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${featured.accent}26, transparent 72%)` }}
        />

        {/* کارت‌های پیرامونی — wrapperِ مطلق موقعیت می‌دهد، CineReveal ورود، و cine-float شناوری */}
        {rest.map((t, i) => {
          const slot = DESKTOP_SLOTS[i % DESKTOP_SLOTS.length];
          return (
            <div
              key={t.id}
              className="absolute"
              style={{
                top: slot.top,
                ...('start' in slot ? { insetInlineStart: slot.start } : {}),
                ...('end' in slot ? { insetInlineEnd: slot.end } : {}),
                opacity: slot.opacity,
                zIndex: slot.z,
                transform: `scale(${slot.scale})`,
              }}
            >
              <CineReveal delay={(i + 1) * 120}>
                <div className="cine-float" style={{ animationDelay: slot.floatDelay }}>
                  <FloatingTournamentCard t={t} />
                </div>
              </CineReveal>
            </div>
          );
        })}

        {/* کارتِ featured — جلو و مرکز */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <CineReveal delay={0}>
            <div className="cine-float" style={{ animationDelay: '0.3s' }}>
              <FloatingTournamentCard t={featured} featured />
            </div>
          </CineReveal>
        </div>
      </div>

      {/* ───────── موبایل/تبلت: اسکرولِ افقیِ تمیز ───────── */}
      <div className="lg:hidden">
        <div className="hscroll -mx-4 flex snap-x snap-mandatory gap-4 px-4 pb-4">
          {SHOWCASE_TOURNAMENTS.map((t, i) => (
            <CineReveal key={t.id} delay={i * 120} className="snap-start shrink-0">
              <FloatingTournamentCard t={t} featured={i === 0} />
            </CineReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
