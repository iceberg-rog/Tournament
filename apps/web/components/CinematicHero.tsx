'use client';

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { FloatingTournamentScene } from '@/components/FloatingTournamentScene';
import { Hero3DGate } from '@/components/Hero3DGate';

/** نویزِ بسیار ظریف به‌صورتِ data-uri (SVG fractal noise) برای بافتِ سینمایی. */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * CinematicHero — قهرمانِ سینماییِ صفحه‌ی اصلیِ SHELTER.
 * پس‌زمینه‌ی لایه‌ایِ تاریک (گلوِ teal، گلوِ طلاییِ ظریف، شبکه‌ی آرنا، خطوطِ براکت،
 * نویز، vignette، حباب‌های تنفسی) + فورگراندِ دوستونی با صحنه‌ی شناورِ تورنومنت‌ها.
 */
export function CinematicHero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="معرفیِ آرنای رقابتیِ SHELTER"
    >
      {/* ───────── لایه‌های پس‌زمینه (تزئینی، بدونِ تعاملِ موس) ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {/* گلوِ teal/cyan رادیالِ بالا */}
        <div className="absolute -top-40 start-1/2 h-[680px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,.20),transparent_72%)] blur-[2px] rtl:translate-x-1/2" />
        {/* گلوِ طلاییِ کوچک و کم‌رنگ (فقط برای عمق) */}
        <div className="absolute bottom-[-6rem] end-[8%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(251,191,36,.10),transparent_70%)]" />

        {/* شبکه‌ی متحرکِ آرنا — خطوطِ نازک، با محوشدگیِ شعاعی به سمتِ لبه‌ها */}
        <div
          className="arena-grid absolute inset-0 opacity-[.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.07) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            WebkitMaskImage:
              'radial-gradient(120% 90% at 50% 0%, #000 35%, transparent 78%)',
            maskImage: 'radial-gradient(120% 90% at 50% 0%, #000 35%, transparent 78%)',
          }}
        />

        {/* خطوطِ مسیرِ براکت — SVG با شفافیتِ پایین */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[.22]"
          viewBox="0 0 1280 720"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="hb-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity=".0" />
              <stop offset="45%" stopColor="#2dd4bf" stopOpacity=".55" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g stroke="url(#hb-stroke)" strokeWidth="1.2">
            <path d="M-20 150 H180 V300 H360" />
            <path d="M-20 470 H180 V300" />
            <path d="M360 300 H560 V410 H760" />
            <path d="M1300 120 H1120 V250 H940" />
            <path d="M1300 560 H1120 V410 H760" />
            <path d="M940 250 V410 H760" />
          </g>
          <g fill="#2dd4bf" fillOpacity=".5">
            <circle cx="180" cy="300" r="2.5" />
            <circle cx="560" cy="410" r="2.5" />
            <circle cx="760" cy="410" r="3" />
            <circle cx="1120" cy="410" r="2.5" />
          </g>
        </svg>

        {/* حباب‌های تنفسیِ گلو برای عمقِ زنده */}
        <div className="glow-breathe absolute start-[12%] top-[28%] h-44 w-44 rounded-full bg-accent/15 blur-[70px]" />
        <div
          className="glow-breathe absolute end-[18%] top-[14%] h-56 w-56 rounded-full bg-accent/10 blur-[80px]"
          style={{ animationDelay: '1.4s' }}
        />
        <div
          className="glow-breathe absolute bottom-[10%] start-[30%] h-40 w-40 rounded-full bg-gold/[.07] blur-[70px]"
          style={{ animationDelay: '2.6s' }}
        />

        {/* پوششِ نویزِ ظریف */}
        <div
          className="absolute inset-0 opacity-[.035] mix-blend-soft-light"
          style={{ backgroundImage: NOISE, backgroundSize: '160px 160px' }}
        />

        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_55%,rgba(0,0,0,.55))]" />
        {/* محوشدگیِ پایین به سمتِ بخشِ بعدی */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      {/* ───────── فورگراند ───────── */}
      <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-20 md:px-6 lg:pb-32 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.12fr] lg:gap-8">
          {/* ستونِ متن — شروعِ RTL (سمتِ راست) */}
          <div className="relative text-center lg:text-start">
            <CineReveal>
              <span className="chip border border-accent/25 bg-accent/[.08] text-accent">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                آرنای رسمیِ esports
              </span>
            </CineReveal>

            <CineReveal delay={120}>
              <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.3rem)] font-bold leading-[1.05] tracking-tight text-text">
                رقابت کن، صعود کن،{' '}
                <span className="bg-gradient-to-l from-accent via-accent to-gold bg-clip-text text-transparent">
                  جایزه بگیر
                </span>
              </h1>
            </CineReveal>

            <CineReveal delay={240}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-muted lg:mx-0 lg:text-lg">
                در SHELTER تورنومنت‌های رسمیِ بازی‌های محبوب را پیدا کن، ثبت‌نام کن،
                براکت را دنبال کن، نتیجه را ثبت کن و جایزه‌ات را امن دریافت کن.
              </p>
            </CineReveal>

            <CineReveal delay={360}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/tournaments"
                  className="btn-primary px-5 py-3 text-[15px]"
                  aria-label="مشاهده‌ی تورنومنت‌ها"
                >
                  مشاهده‌ی تورنومنت‌ها
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                </Link>
                <Link
                  href="/register"
                  className="btn-ghost px-5 py-3 text-[15px]"
                  aria-label="ثبت‌نام"
                >
                  ثبت‌نام
                </Link>
              </div>
            </CineReveal>

            <CineReveal delay={460}>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                همکاری با ما
                <span aria-hidden="true">←</span>
              </Link>
            </CineReveal>
          </div>

          {/* ستونِ صحنه‌ی شناورِ تورنومنت‌ها (کارت‌ها خودشان pop-in دارند) */}
          <div className="relative">
            {/* هسته‌ی سه‌بعدیِ درخشان پشتِ کارت‌ها (دسکتاپ، بدونِ reduced-motion) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] hidden lg:block motion-reduce:hidden">
              <Hero3DGate />
            </div>
            <FloatingTournamentScene />
          </div>
        </div>
      </div>
    </section>
  );
}
