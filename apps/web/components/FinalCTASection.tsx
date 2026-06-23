import Link from 'next/link';
import { Reveal } from '@/components/Reveal';

const Ico = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

/** پنلِ پایانیِ سینماتیک: دعوت به ساختِ اولین تورنومنت. */
export function FinalCTASection() {
  return (
    <section>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-tile2 to-tile shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
          {/* درخشش‌های رادیالِ ملایم (teal + gold) — تمیز، نه شلوغ */}
          <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-gold/[0.07] blur-3xl" />
          {/* خطِ مرزیِ نرمِ بالا */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
          {/* درخششِ درونیِ ظریف */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,.04)]" />

          <div className="relative flex flex-col items-center px-6 py-16 text-center sm:px-10 md:py-20">
            <span className="chip border border-accent/25 bg-accent/10 text-accent">
              <span className="anim-float-sm inline-flex">
                <Ico size={13}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></Ico>
              </span>
              رقابت‌های رسمیِ SHELTER
            </span>

            <h2 className="mt-5 max-w-3xl font-display text-[clamp(24px,4vw,40px)] font-bold leading-tight">
              آماده‌ای وارد رقابت بشی؟
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
              تورنومنت‌های فعال را ببین، ثبت‌نام کن و مسیرت را تا جایزه دنبال کن.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/tournaments" className="btn-primary px-7 py-3 text-base">
                مشاهده‌ی تورنومنت‌ها
                <Ico size={16}><path d="M19 12H5M11 18l-6-6 6-6" /></Ico>
              </Link>
              <Link href="/register" className="btn-ghost px-7 py-3 text-base">
                ثبت‌نام رایگان
              </Link>
            </div>
            <Link href="/register" className="mt-4 text-sm font-semibold text-muted transition hover:text-accent">
              برگزارکننده‌ای؟ درخواستِ همکاری بده →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
