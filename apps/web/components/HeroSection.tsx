import Link from 'next/link';
import { HeroCommandCenterMockup } from './HeroCommandCenterMockup';
import type { TournamentRow } from '@/lib/tournaments';

export function HeroSection({ featured }: { featured?: TournamentRow }) {
  return (
    <section className="relative overflow-hidden">
      {/* پس‌زمینه‌ی سینماتیک: گرادیانِ شعاعی + گریدِ آرنا + مسیرهای محوِ براکت + noise + vignette */}
      <div className="pointer-events-none absolute inset-0">
        {/* درخششِ teal (بالا-راست) + درخششِ طلاییِ ملایم (پایین، نزدیکِ جایزه) */}
        <div className="absolute inset-0 bg-[radial-gradient(56%_46%_at_84%_-8%,rgba(45,212,191,.2),transparent_60%),radial-gradient(44%_44%_at_-6%_112%,rgba(251,191,36,.1),transparent_55%)]" />
        {/* گریدِ آرنا */}
        <div className="absolute inset-0 opacity-[.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(72%_62%_at_50%_28%,#000,transparent)]" />
        {/* مسیرهای محوِ براکت در پس‌زمینه */}
        <svg className="absolute inset-0 h-full w-full opacity-[.07]" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#2dd4bf" strokeWidth="1.5">
            <path d="M120 120 H220 V200 H320" /><path d="M120 280 H220 V200" />
            <path d="M120 380 H220 V460 H320" /><path d="M120 540 H220 V460" />
            <path d="M320 200 H420 V330 H520" /><path d="M320 460 H420 V330" />
            <path d="M1080 120 H980 V210 H880" /><path d="M1080 300 H980 V210" />
          </g>
          <g fill="#2dd4bf"><circle cx="320" cy="200" r="3" /><circle cx="320" cy="460" r="3" /><circle cx="520" cy="330" r="3.5" /></g>
        </svg>
        {/* بافتِ noise بسیار ظریف */}
        <div className="absolute inset-0 opacity-[.04] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
        {/* vignette */}
        <div className="absolute inset-0 [background:radial-gradient(120%_90%_at_50%_0%,transparent_55%,rgba(0,0,0,.45))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:px-6 md:py-20">
        {/* متن */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-tile/60 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            پلتفرمِ نسلِ بعدیِ برگزاریِ مسابقات
          </span>
          <h1 className="mt-5 font-display text-[clamp(34px,6vw,64px)] font-bold leading-[1.08]">
            تورنومنت بساز،
            <br />
            بازی کن،{' '}
            <span className="anim-gradient bg-gradient-to-l from-accent via-gold to-accent bg-clip-text text-transparent">جایزه بگیر</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-muted">
            براکت بساز، نتیجه بگیر، جایزه آزاد کن. هر مسابقه — از ثبت‌نام تا فینال — یک‌جا، زنده و امن.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-7 py-3 text-base">شروعِ رایگان</Link>
            <Link href="/tournaments" className="btn-ghost px-7 py-3 text-base">مشاهده‌ی تورنومنت‌ها</Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6 9 17l-5-5" /></svg> بدونِ نیاز به کارتِ بانکی برای شروع</span>
            <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6 9 17l-5-5" /></svg> ۱۰۰٪ فارسی و RTL</span>
          </div>
        </div>

        {/* ویژوالِ اتاقِ کنترل */}
        <div className="relative">
          <HeroCommandCenterMockup featured={featured} />
        </div>
      </div>
    </section>
  );
}
