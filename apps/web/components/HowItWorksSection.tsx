import { Reveal } from '@/components/Reveal';
import Link from 'next/link';
import { HOW_STEPS, ORGANIZER_STEPS, type HowStep } from '@/lib/landing';

const Ico = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

/** ویژوالِ کوچکِ تشریحیِ هر مرحله (خطوطِ ظریف، هم‌خانواده با کاورهای پلتفرم). */
function StepVisual({ n }: { n: number }) {
  if (n === 1) {
    // انتخابِ تورنومنت: جستجو / مرور
    return (
      <Ico className="h-7 w-7">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </Ico>
    );
  }
  if (n === 2) {
    // ثبت‌نامِ بازیکن‌ها: گروه
    return (
      <Ico className="h-7 w-7">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 6.2a3 3 0 0 1 0 5.6" />
        <path d="M17.5 13.4A5.5 5.5 0 0 1 20.5 18" />
      </Ico>
    );
  }
  // ثبتِ نتیجه و جایزه: جام
  return (
    <Ico className="h-7 w-7">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 3 2.4M17 6h2.5a2.5 2.5 0 0 1-3 2.4" />
      <path d="M9.5 20h5M12 13.5V20" />
    </Ico>
  );
}

function StepCard({ step, last }: { step: HowStep; last: boolean }) {
  return (
    <div className="group relative h-full">
      {/* ── دسکتاپ: نودِ گرد روی خطِ افقی ── */}
      <div className="hidden md:flex md:flex-col md:items-center">
        <div className="relative z-10 grid h-16 w-16 place-items-center rounded-full border border-line2 bg-tile shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)] transition duration-200 group-hover:border-accent/50">
          <span className="absolute inset-0 rounded-full bg-accent/5 opacity-0 blur-md transition duration-200 group-hover:opacity-100" />
          <span className="font-display text-2xl font-bold text-accent tnum">
            {step.n.toLocaleString('fa-IR')}
          </span>
        </div>
        <div className="mt-8 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-tile2 text-accent transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/40">
            <StepVisual n={step.n} />
          </span>
          <h3 className="mt-5 font-display text-lg font-bold leading-7">{step.title}</h3>
          <p className="mt-2.5 max-w-xs text-sm leading-7 text-muted">{step.desc}</p>
        </div>
      </div>

      {/* ── موبایل: تایم‌لاینِ عمودی با خطِ سمتِ راست (RTL) ── */}
      <div className="relative flex gap-4 pe-2 md:hidden">
        {/* ستونِ نود + خطِ اتصال */}
        <div className="relative flex flex-none flex-col items-center">
          <div className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-line2 bg-tile">
            <span className="font-display text-lg font-bold text-accent tnum">
              {step.n.toLocaleString('fa-IR')}
            </span>
          </div>
          {!last && <span className="w-px flex-1 bg-gradient-to-b from-line2 to-transparent" />}
        </div>
        {/* محتوا */}
        <div className={`flex-1 ${last ? '' : 'pb-9'}`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-line bg-tile2 text-accent">
              <StepVisual n={step.n} />
            </span>
            <h3 className="font-display text-base font-bold leading-7">{step.title}</h3>
          </div>
          <p className="mt-2.5 text-sm leading-7 text-muted">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-24">
      {/* بلاکِ عنوان */}
      <Reveal className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-tile/60 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          سادهٔ سه‌مرحله‌ای
        </span>
        <h2 className="mt-4 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">
          از ثبت‌نام تا جایزه، مسیرِ رقابت روشن است
        </h2>
        <p className="mt-3 text-base leading-8 text-muted">
          پیدا کردنِ رقابت تا دریافتِ جایزه در سه مرحله؛ بقیه‌ی کار — براکت، داوری و پرداختِ امن — با SHELTER است.
        </p>
      </Reveal>

      {/* تایم‌لاین */}
      <div className="relative mt-12">
        {/* خطِ افقیِ اتصال (فقط دسکتاپ) — از مرکزِ نودِ اول تا مرکزِ نودِ آخر */}
        <div className="pointer-events-none absolute inset-x-0 top-8 hidden md:block">
          <div className="mx-[16.666%] h-px -translate-y-1/2 bg-gradient-to-l from-line via-line2 to-line" />
        </div>

        <ol className="grid gap-y-2 md:grid-cols-3 md:gap-x-8">
          {HOW_STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 80} className="h-full">
              <StepCard step={step} last={i === HOW_STEPS.length - 1} />
            </Reveal>
          ))}
        </ol>
      </div>

      {/* مسیرِ جدا برای برگزارکننده‌ها (همکاریِ تأییدشده) */}
      <Reveal className="mt-14">
        <div className="rounded-2xl border border-line bg-tile/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold">برگزارکننده‌ای؟ با SHELTER همکاری کن</h3>
            <Link href="/register" className="btn-ghost px-4 py-2 text-sm">درخواستِ همکاری</Link>
          </div>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">
            {ORGANIZER_STEPS.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line2 bg-tile2 font-display text-sm font-bold text-accent tnum">
                  {s.n.toLocaleString('fa-IR')}
                </span>
                <div>
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-6 text-faint">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
