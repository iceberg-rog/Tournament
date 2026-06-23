'use client';

import { CineReveal } from '@/components/CineReveal';

/** آیکونِ خطیِ ظریف (هم‌خانواده با ناوبری/بقیه‌ی سکشن‌ها). */
const Ico = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

interface JourneyStep {
  n: number;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

/** هفت‌گامِ مسیرِ بازیکن — داده‌محور، در همین فایل. */
const JOURNEY_STEPS: JourneyStep[] = [
  {
    n: 1,
    label: 'انتخابِ تورنومنت',
    hint: 'دیسیپلینِ خودت را پیدا کن',
    icon: (
      <Ico className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </Ico>
    ),
  },
  {
    n: 2,
    label: 'ثبت‌نام',
    hint: 'یک کلیک تا ورود',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3.2" />
        <path d="M19 8v6M22 11h-6" />
      </Ico>
    ),
  },
  {
    n: 3,
    label: 'چک‌این',
    hint: 'حضورت را تأیید کن',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M9 11.5l2.2 2.2L15.5 9.5" />
        <path d="M12 3l7.5 3.3v5.2c0 4.6-3.2 7.4-7.5 8.9-4.3-1.5-7.5-4.3-7.5-8.9V6.3L12 3Z" />
      </Ico>
    ),
  },
  {
    n: 4,
    label: 'مسابقه',
    hint: 'وارد آرنا شو',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M6.5 6.5 4 4M4 4v3M4 4h3" />
        <rect x="8" y="8" width="8" height="8" rx="2" />
        <path d="M17.5 17.5 20 20M20 20v-3M20 20h-3" />
      </Ico>
    ),
  },
  {
    n: 5,
    label: 'ثبتِ نتیجه',
    hint: 'اسکور را آپلود کن',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M8.5 12.5l2 2 4-4" />
      </Ico>
    ),
  },
  {
    n: 6,
    label: 'دنبال‌کردنِ براکت',
    hint: 'صعودت را ببین',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M6 5v4a2 2 0 0 0 2 2h6a2 2 0 0 1 2 2v4" />
        <circle cx="5" cy="5" r="1.6" />
        <circle cx="5" cy="19" r="1.6" />
        <path d="M6 19h2a2 2 0 0 0 2-2v-2" />
        <circle cx="18.5" cy="11" r="1.6" />
      </Ico>
    ),
  },
  {
    n: 7,
    label: 'دریافتِ جایزه',
    hint: 'پرداختِ امن از escrow',
    icon: (
      <Ico className="h-6 w-6">
        <path d="M7 4h10v3.5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 5.5H4.5a2.5 2.5 0 0 0 3 2.4M17 5.5h2.5a2.5 2.5 0 0 1-3 2.4" />
        <path d="M9.5 20h5M12 12.5V20" />
      </Ico>
    ),
  },
];

function JourneyNode({ step, first, last }: { step: JourneyStep; first: boolean; last: boolean }) {
  const accent = first; // اولین نود فعال/درخشان

  return (
    <div className="group relative h-full">
      {/* ── دسکتاپ/تبلت: نودِ افقی روی خطِ تایم‌لاین ── */}
      <div className="hidden flex-col items-center text-center md:flex">
        <div className="relative">
          {/* هاله‌ی تنفسیِ نودِ فعال */}
          {accent && (
            <span className="glow-breathe pointer-events-none absolute -inset-3 -z-10 rounded-full bg-accent/25 blur-xl" aria-hidden="true" />
          )}
          <div
            className={`relative z-10 grid h-[68px] w-[68px] place-items-center rounded-full border bg-tile shadow-[0_18px_44px_-22px_rgba(0,0,0,.85)] transition duration-300 ease-out group-hover:-translate-y-1.5 ${
              accent
                ? 'border-accent/60 text-accent shadow-[0_0_0_1px_rgba(45,212,191,.18),0_18px_44px_-20px_rgba(45,212,191,.6)]'
                : 'border-line2 text-muted group-hover:border-accent/45 group-hover:text-accent'
            }`}
          >
            {/* روشناییِ داخلیِ نرم هنگامِ هاور */}
            <span className="absolute inset-0 rounded-full bg-accent/5 opacity-0 blur-md transition duration-300 group-hover:opacity-100" aria-hidden="true" />
            {step.icon}
            {/* شماره‌ی کوچک روی نود */}
            <span
              className={`absolute -top-1 -left-1 grid h-6 w-6 place-items-center rounded-full border bg-bg text-[11px] font-bold tnum ${
                accent ? 'border-accent/50 text-accent' : 'border-line2 text-faint'
              }`}
            >
              {step.n.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>

        <h3 className="mt-6 font-display text-[15px] font-bold leading-6">{step.label}</h3>
        <p className="mt-1.5 text-xs leading-6 text-faint">{step.hint}</p>
      </div>

      {/* ── موبایل: تایم‌لاینِ عمودی با خطِ اتصالِ سمتِ راست (RTL) ── */}
      <div className="relative flex gap-4 pe-1 md:hidden">
        <div className="relative flex flex-none flex-col items-center">
          {accent && (
            <span className="glow-breathe pointer-events-none absolute top-0 -inset-x-1 h-12 -z-10 rounded-full bg-accent/25 blur-lg" aria-hidden="true" />
          )}
          <div
            className={`relative z-10 grid h-12 w-12 place-items-center rounded-full border bg-tile ${
              accent ? 'border-accent/60 text-accent' : 'border-line2 text-accent'
            }`}
          >
            {step.icon}
            <span
              className={`absolute -top-1 -left-1 grid h-5 w-5 place-items-center rounded-full border bg-bg text-[10px] font-bold tnum ${
                accent ? 'border-accent/50 text-accent' : 'border-line2 text-faint'
              }`}
            >
              {step.n.toLocaleString('fa-IR')}
            </span>
          </div>
          {!last && <span className="w-px flex-1 bg-gradient-to-b from-line2 to-transparent" aria-hidden="true" />}
        </div>
        <div className={last ? '' : 'pb-7'}>
          <h3 className="font-display text-[15px] font-bold leading-7">{step.label}</h3>
          <p className="mt-0.5 text-xs leading-6 text-faint">{step.hint}</p>
        </div>
      </div>
    </div>
  );
}

export function PlayerJourneySection() {
  return (
    <section className="relative">
      {/* بلاکِ عنوان */}
      <CineReveal className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-tile/60 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          مسیرِ بازیکن
        </span>
        <h2 className="mt-4 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">
          از ثبت‌نام تا جایزه، مسیرِ رقابت روشن است
        </h2>
        <p className="mt-3 text-base leading-8 text-muted">
          هفت گامِ روشن — از انتخابِ تورنومنت تا دریافتِ جایزه؛ هر مرحله شفاف، خودکار و امن.
        </p>
      </CineReveal>

      {/* تایم‌لاین */}
      <div className="relative mt-14">
        {/* خطِ افقیِ اتصال (فقط دسکتاپ) — هم‌ترازِ مرکزِ نودها */}
        <div className="pointer-events-none absolute inset-x-0 top-[34px] hidden md:block" aria-hidden="true">
          <div className="mx-[7.14%] h-px -translate-y-1/2 bg-gradient-to-l from-line via-line2 to-line" />
        </div>

        <ol className="grid grid-cols-1 gap-y-1 md:grid-cols-7 md:gap-x-3 lg:gap-x-5">
          {JOURNEY_STEPS.map((step, i) => (
            <li key={step.n} className="h-full">
              <CineReveal delay={i * 120} className="h-full">
                <JourneyNode
                  step={step}
                  first={i === 0}
                  last={i === JOURNEY_STEPS.length - 1}
                />
              </CineReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
