'use client';

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';

/** بندِ پایانیِ سینمایی — گلوِ تیل، گریدِ محو، عنوانِ دعوت به رقابت و CTAها. */
export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36" aria-labelledby="final-cta-heading">
      {/* گلوِ تیلِ مرکزی (نفس‌کشنده) */}
      <div
        aria-hidden
        className="glow-breathe pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[820px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, rgba(45,212,191,.28), rgba(45,212,191,.06) 60%, transparent 75%)' }}
      />
      {/* لکه‌ی طلاییِ خیلی محو برای عمق */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[12%] -z-10 h-[260px] w-[360px] rounded-full opacity-50 blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, rgba(251,191,36,.12), transparent 70%)' }}
      />
      {/* گریدِ محوِ متحرک */}
      <div
        aria-hidden
        className="arena-grid pointer-events-none absolute inset-0 -z-10 opacity-[.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(620px 360px at 50% 50%, #000 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(620px 360px at 50% 50%, #000 0%, transparent 80%)',
        }}
      />

      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <CineReveal>
            {/* نشانِ کوچکِ بالای عنوان */}
            <span className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3.5 py-1.5 text-xs font-semibold text-accent shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_8px_24px_-18px_rgba(45,212,191,.7)] backdrop-blur">
              <span className="dot" style={{ background: 'var(--teal)' }} />
              آرنای SHELTER
            </span>
          </CineReveal>

          <CineReveal delay={120}>
            <h2 id="final-cta-heading" className="font-display text-4xl font-bold leading-[1.15] text-white md:text-6xl">
              آماده‌ای وارد رقابت بشی؟
            </h2>
          </CineReveal>

          <CineReveal delay={240}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-8 text-muted md:text-lg">
              تورنومنت‌های رسمی را ببین، ثبت‌نام کن و مسیرت را تا جایزه دنبال کن.
            </p>
          </CineReveal>

          <CineReveal delay={360}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/tournaments"
                aria-label="مشاهده‌ی تورنومنت‌ها"
                className="btn-primary w-full px-7 py-3.5 text-[15px] sm:w-auto"
              >
                مشاهده‌ی تورنومنت‌ها
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </Link>
              <Link
                href="/register"
                aria-label="ثبت‌نام"
                className="btn-ghost w-full px-7 py-3.5 text-[15px] sm:w-auto"
              >
                ثبت‌نام
              </Link>
            </div>
          </CineReveal>

          <CineReveal delay={480}>
            <Link
              href="/register"
              aria-label="برگزارکننده‌ای؟ همکاری کن"
              className="group mt-7 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              برگزارکننده‌ای؟ همکاری کن
              <span className="transition-transform group-hover:-translate-x-1" aria-hidden>←</span>
            </Link>
          </CineReveal>
        </div>
      </div>
    </section>
  );
}
