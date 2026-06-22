import Link from 'next/link';
import { HeroCommandCenterMockup } from './HeroCommandCenterMockup';
import type { TournamentRow } from '@/lib/tournaments';

export function HeroSection({ featured }: { featured?: TournamentRow }) {
  return (
    <section className="relative overflow-hidden">
      {/* پس‌زمینه‌ی سینماتیک: گرادیانِ شعاعی + گریدِ ظریف + خطِ نوری */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(58%_48%_at_85%_-8%,rgba(45,212,191,.18),transparent_60%),radial-gradient(48%_48%_at_-6%_112%,rgba(251,191,36,.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
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
          <p className="mt-5 max-w-xl text-base leading-8 text-muted">
            SHELTER پلتفرمِ کاملِ برگزاریِ مسابقاتِ بازی‌های ویدیویی است؛ از ثبت‌نام و براکت تا داوری، پرداختِ امن، چتِ زنده و توزیعِ جایزه.
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
