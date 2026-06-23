'use client';

// صحنه‌ی شناورِ تورنومنت‌ها — قطعه‌ی امضاییِ صفحه‌ی اصلی.
// ترکیب‌بندیِ عمدی: یک کارتِ featuredِ بزرگ و کاملاً خوانا در مرکز/جلو،
// و چند کارتِ compactِ خوانا در قاب اطرافش با عمق (scale/opacity/rotate).
// همه از SHOWCASE_TOURNAMENTS؛ همه کلیک‌پذیر و accessible.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { SHOWCASE_TOURNAMENTS, STATUS_META, type LandingTournament } from '@/lib/landingShowcase';

const TONE: Record<(typeof STATUS_META)[keyof typeof STATUS_META]['tone'], { chip: string; dot: string; pulse: boolean }> = {
  live: { chip: 'border-bad/40 bg-bad/15 text-[#fca5a5]', dot: 'bg-bad', pulse: true },
  open: { chip: 'border-accent/40 bg-accent/15 text-accent', dot: 'bg-accent', pulse: false },
  soon: { chip: 'border-gold/40 bg-gold/15 text-gold', dot: 'bg-gold', pulse: false },
  done: { chip: 'border-white/10 bg-white/[.05] text-muted', dot: 'bg-faint', pulse: false },
};

/** هدرِ برندِ بازی (وقتی عکسِ خوب نداریم) — استایلِ زمینِ FC26. */
function BrandedHeader({ t, tall }: { t: LandingTournament; tall?: boolean }) {
  return (
    <div className={`relative w-full overflow-hidden ${tall ? 'h-40' : 'h-24'}`} style={{ background: `linear-gradient(135deg, #07140d, #0c2a1a 55%, #1a2d10)` }}>
      {/* نورِ استادیوم */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(80% 60% at 50% -10%, ${t.accent}55, transparent 65%)` }} />
      {/* خطوطِ زمین */}
      <div className="absolute inset-0 opacity-[.18]" style={{ backgroundImage: 'repeating-linear-gradient(180deg, #ffffff 0 1px, transparent 1px 22px)' }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style={{ width: tall ? 96 : 60, height: tall ? 96 : 60 }} />
      {/* تایپوگرافی */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display font-bold tracking-[.2em] text-white/70 ${tall ? 'text-[11px]' : 'text-[9px]'}`}>EA SPORTS</span>
        <span className={`font-display font-extrabold leading-none text-white ${tall ? 'text-4xl' : 'text-2xl'}`}>FC&nbsp;26</span>
      </div>
    </div>
  );
}

function Cover({ t, tall }: { t: LandingTournament; tall?: boolean }) {
  const h = tall ? 'h-40' : 'h-24';
  if (t.branded) return <BrandedHeader t={t} tall={tall} />;
  if (t.cover)
    return (
      <div className={`relative w-full overflow-hidden ${h}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.cover} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.3,1)] group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 80% 0%, ${t.accent}44, transparent 60%)` }} />
      </div>
    );
  return <div className={`w-full ${h}`} style={{ background: `linear-gradient(135deg, ${t.accent}33, #0e0f13)` }} />;
}

function StatusChip({ t, sm }: { t: LandingTournament; sm?: boolean }) {
  const meta = STATUS_META[t.status];
  const tone = TONE[meta.tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${tone.chip} backdrop-blur-md ${sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]'} font-bold`}>
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`}>{tone.pulse && <span className={`absolute inset-0 rounded-full ${tone.dot} animate-ping`} />}</span>
      {meta.label}
    </span>
  );
}

const cardBase =
  'group relative block overflow-hidden rounded-[20px] border border-white/10 bg-[#0f1217]/80 backdrop-blur-xl outline-none transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(.2,.7,.3,1)] [box-shadow:0_1px_0_rgba(255,255,255,.05)_inset,0_24px_60px_-30px_rgba(0,0,0,.9)] hover:-translate-y-2 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] hover:[box-shadow:0_1px_0_rgba(255,255,255,.08)_inset,0_44px_90px_-34px_color-mix(in_srgb,var(--accent)_60%,#000)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

/** کارتِ کاملِ تورنومنت — featured در صحنه + گریدِ «تورنومنت‌های رسمی». کلیک‌پذیر. */
export function FloatingTournamentCard({ t, featured = false }: { t: LandingTournament; featured?: boolean }) {
  const meta = STATUS_META[t.status];
  const pct = t.capacity > 0 ? Math.min(100, Math.round((t.participants / t.capacity) * 100)) : 0;
  return (
    <Link href={t.href} aria-label={`${t.title} — ${t.game}`} style={{ '--accent': t.accent } as CSSProperties} className={`${cardBase} ${featured ? 'w-[320px]' : 'w-full'}`}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-16 z-0 h-44 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-90" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${t.accent}, transparent 70%)` }} />
      <div className="relative z-[1]">
        <Cover t={t} tall />
        <div className="absolute end-3 top-3"><StatusChip t={t} /></div>
      </div>
      <div className="relative z-[1] flex flex-col gap-2.5 p-5">
        <h3 className="font-display text-[18px] font-bold leading-snug text-text line-clamp-2">{t.title}</h3>
        <p className="text-[12.5px] text-muted"><span className="font-medium text-text/85">{t.game}</span> · {t.platform} · {t.format}</p>
        <div className="flex items-center justify-between">
          {t.prize && <span className="font-display text-[15px] font-bold tnum text-gold">{t.prize}</span>}
          <span className="text-[12px] tnum text-muted"><span className="text-text">{t.participants}</span> / {t.capacity} نفر</span>
        </div>
        <div className="pbar"><span style={{ width: `${pct}%` }} /></div>
        <span className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] py-2.5 text-[13px] font-bold text-[color-mix(in_srgb,var(--accent)_85%,#fff)] transition group-hover:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]">
          {meta.cta}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-1"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </span>
      </div>
    </Link>
  );
}

/** کارتِ compactِ خوانا برای لایه‌های عمقِ صحنه. */
function SceneCard({ t }: { t: LandingTournament }) {
  return (
    <Link href={t.href} aria-label={`${t.title} — ${t.game}`} style={{ '--accent': t.accent } as CSSProperties} className={`${cardBase} w-[208px]`}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-10 z-0 h-28 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-80" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${t.accent}, transparent 70%)` }} />
      <div className="relative z-[1]">
        <Cover t={t} />
        <div className="absolute end-2.5 top-2.5"><StatusChip t={t} sm /></div>
      </div>
      <div className="relative z-[1] flex flex-col gap-1 p-3.5">
        <h3 className="font-display text-[13.5px] font-bold leading-snug text-text line-clamp-1">{t.title}</h3>
        <p className="text-[11px] text-muted line-clamp-1">{t.game} · {t.platform}</p>
        <div className="mt-1 flex items-center justify-between">
          {t.prize && <span className="font-display text-[12.5px] font-bold tnum text-gold">{t.prize}</span>}
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors group-hover:text-accent">
            مشاهده
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// چهار لایه‌ی عمق در قابِ اطرافِ featured — موقعیتِ عمدی، بدونِ دفنِ متنِ کارتِ اصلی.
type Slot = { pos: CSSProperties; scale: number; opacity: number; z: number; rot: number; float: string; dim?: boolean };
const SLOTS: Slot[] = [
  { pos: { top: '1%', insetInlineStart: '0%' }, scale: 0.92, opacity: 0.96, z: 20, rot: -6, float: '0s' },
  { pos: { top: '6%', insetInlineEnd: '0%' }, scale: 0.92, opacity: 0.96, z: 20, rot: 6, float: '1.4s' },
  { pos: { bottom: '1%', insetInlineStart: '3%' }, scale: 0.84, opacity: 0.82, z: 10, rot: -4, float: '2.2s' },
  { pos: { bottom: '0%', insetInlineEnd: '2%' }, scale: 0.84, opacity: 0.82, z: 10, rot: 4, float: '0.7s' },
];

export function FloatingTournamentScene() {
  const featured = SHOWCASE_TOURNAMENTS[0];
  const secondary = SHOWCASE_TOURNAMENTS.slice(1, 5); // ۴ کارتِ عمق

  return (
    <div dir="rtl">
      {/* ───────── دسکتاپ: قابِ عمق‌دار ───────── */}
      <div className="relative mx-auto hidden h-[600px] w-full max-w-[660px] [perspective:1600px] lg:block">
        <div aria-hidden="true" className="glow-breathe pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(closest-side, ${featured.accent}26, transparent 72%)` }} />

        {secondary.map((t, i) => {
          const s = SLOTS[i];
          return (
            <div key={t.id} className="absolute" style={{ ...s.pos, zIndex: s.z, opacity: s.opacity, transform: `scale(${s.scale}) rotate(${s.rot}deg)`, filter: s.dim ? 'blur(.6px)' : undefined }}>
              <CineReveal delay={(i + 1) * 130}>
                <div className="cine-float" style={{ animationDelay: s.float }}>
                  <SceneCard t={t} />
                </div>
              </CineReveal>
            </div>
          );
        })}

        {/* featured — جلو، مرکز، z بالا (همیشه خوانا) */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <CineReveal delay={0}>
            <div className="cine-float" style={{ animationDelay: '0.4s' }}>
              <FloatingTournamentCard t={featured} featured />
            </div>
          </CineReveal>
        </div>
      </div>

      {/* ───────── موبایل/تبلت: اسکرولِ افقیِ تمیز ───────── */}
      <div className="lg:hidden">
        <div className="hscroll -mx-4 flex snap-x snap-mandatory gap-4 px-4 pb-4">
          {SHOWCASE_TOURNAMENTS.map((t, i) => (
            <CineReveal key={t.id} delay={i * 110} className="w-[280px] shrink-0 snap-start">
              <FloatingTournamentCard t={t} />
            </CineReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
