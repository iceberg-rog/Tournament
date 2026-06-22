import { Reveal } from '@/components/Reveal';
import { PLAYER_POINTS } from '@/lib/landing';

/** آیکونِ خطیِ یک‌دست (fill=none, stroke=currentColor). */
const Ico = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** گره‌های مسیرِ بازیکن: پیدا کردن → ثبت‌نام → براکت → چت → نتیجه → جایزه. */
const JOURNEY: { label: string; icon: React.ReactNode }[] = [
  {
    label: 'پیدا کردن',
    icon: (
      <Ico size={16}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </Ico>
    ),
  },
  {
    label: 'ثبت‌نام',
    icon: (
      <Ico size={16}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </Ico>
    ),
  },
  {
    label: 'براکت',
    icon: (
      <Ico size={16}>
        <path d="M3 5h5v14H3M21 9h-5M21 15h-5M8 8h5a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H8" />
      </Ico>
    ),
  },
  {
    label: 'چت',
    icon: (
      <Ico size={16}>
        <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z" />
      </Ico>
    ),
  },
  {
    label: 'نتیجه',
    icon: (
      <Ico size={16}>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </Ico>
    ),
  },
  {
    label: 'جایزه',
    icon: (
      <Ico size={16}>
        <circle cx="12" cy="8" r="6" />
        <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
      </Ico>
    ),
  },
];

/** نتایجِ اخیرِ نمایشی برای پیش‌نمایشِ پروفایل (تصویری). */
const RECENT: ('W' | 'L')[] = ['W', 'W', 'L', 'W', 'W', 'W'];

export function PlayerExperienceSection() {
  return (
    <Reveal as="section">
      {/* بلاکِ سرتیتر */}
      <div className="mb-8">
        <span className="chip bg-accent/10 text-accent">
          <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          مسیرِ بازیکن
        </span>
        <h2 className="mt-3 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight text-white">
          رقابت زنده، داوری شفاف، جایزه‌ی امن
        </h2>
        <p className="mt-3 max-w-2xl text-muted leading-7">
          از پیدا کردنِ تورنومنتِ مناسب تا دریافتِ امنِ جایزه؛ یک مسیرِ روشن و بدونِ ابهام
          که در هر گام می‌دانی کجای رقابت ایستاده‌ای.
        </p>
      </div>

      {/* دو ستون؛ ترتیب نسبت به بخشِ برگزارکننده برعکس است (نکات راست، ویژوال چپ در RTL). */}
      <div className="grid items-stretch gap-6 md:grid-cols-[0.9fr_1.1fr]">
        {/* ── ستونِ نکات: PLAYER_POINTS با مارکرِ teal ── */}
        <div className="flex h-full flex-col rounded-2xl border border-line bg-tile p-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
          <h3 className="mb-5 font-display text-lg font-bold text-white">چرخه‌ی بازیکن، سرتاسر شفاف</h3>
          <ul className="flex flex-1 flex-col gap-4">
            {PLAYER_POINTS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 70}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                    <Ico size={15}>
                      <path d="M20 6 9 17l-5-5" />
                    </Ico>
                  </span>
                  <div>
                    <div className="font-semibold text-white leading-7">{p.title}</div>
                    <div className="text-sm text-muted leading-7">{p.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* ── ستونِ ویژوال: کارتِ پروفایلِ بازیکن + نوارِ مسیر ── */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-tile2 p-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
          {/* درخششِ نرمِ پس‌زمینه */}
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 60px 8px rgba(0,0,0,.35)' }} />

          {/* کارتِ پروفایلِ نمایشی */}
          <div className="relative">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
              <Ico size={14}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </Ico>
              پیش‌نمایشِ پروفایل
            </div>

            <div className="rounded-2xl border border-line bg-tile p-4 anim-float-sm shadow-[0_14px_34px_-22px_rgba(0,0,0,.85)]">
              <div className="flex items-center gap-3">
                {/* آواتارِ گرادیانی با حروفِ اول */}
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gradient-to-br from-accent to-accent-dim font-display text-base font-bold text-[#06231f] shadow-[0_8px_20px_-10px_rgba(45,212,191,.9)]">
                  AP
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-bold text-white" dir="ltr">
                    Arian&nbsp;Pro
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="chip bg-accent/10 text-accent">
                      <Ico size={12}>
                        <path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 18.2l.9-5.5-4-3.9 5.5-.8Z" />
                      </Ico>
                      <span className="tnum">ELO ۱۸۴۲</span>
                    </span>
                    <span className="chip bg-gold/10 text-gold">
                      <Ico size={12}>
                        <path d="M6 3v6a6 6 0 0 0 12 0V3" />
                        <path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
                      </Ico>
                      رتبه‌ی ۷
                    </span>
                  </div>
                </div>
              </div>

              {/* ردیفِ نتایجِ اخیر: پیل‌های W/L */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-[11px] text-faint">
                  <span>نتایجِ اخیر</span>
                  <span className="tnum text-good">۵ بُرد از ۶</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {RECENT.map((r, i) => (
                    <span
                      key={i}
                      className={`grid h-6 w-6 flex-none place-items-center rounded-md text-[11px] font-bold tnum ${
                        r === 'W'
                          ? 'border border-good/25 bg-good/10 text-good'
                          : 'border border-bad/25 bg-bad/10 text-bad'
                      }`}
                    >
                      {r === 'W' ? 'بُرد' : 'باخت'}
                    </span>
                  ))}
                </div>
              </div>

              {/* دکمه‌ی اصلی */}
              <button type="button" className="btn-primary mt-4 w-full">
                <Ico size={16}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" />
                </Ico>
                ثبت‌نام در تورنومنت
              </button>
            </div>
          </div>

          {/* نوارِ مسیر: ۶ گره با خطِ teal (عمودی در موبایل، افقی در دسکتاپ) */}
          <div className="relative mt-6 flex flex-1 flex-col">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
              <Ico size={14}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </Ico>
              مسیرِ یک بازیکن
            </div>

            <div className="relative flex flex-1 flex-col justify-center">
              {/* خطِ رابطِ teal: عمودی در موبایل، افقی در دسکتاپ */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-6 right-[19px] top-6 w-px bg-gradient-to-b from-accent/50 via-accent/30 to-accent/10 md:bottom-auto md:right-6 md:left-6 md:top-[19px] md:h-px md:w-auto md:bg-gradient-to-l md:from-accent/50 md:via-accent/30 md:to-accent/10"
              />
              <ol className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-1">
                {JOURNEY.map((j, i) => (
                  <Reveal
                    as="li"
                    key={j.label}
                    delay={i * 80}
                    className="flex items-center gap-3 md:flex-1 md:flex-col md:items-center md:gap-2 md:text-center"
                  >
                    <span
                      className={`grid h-10 w-10 flex-none place-items-center rounded-xl border ${
                        i === JOURNEY.length - 1
                          ? 'border-gold/30 bg-gold/10 text-gold'
                          : 'border-accent/25 bg-accent/10 text-accent'
                      }`}
                    >
                      {j.icon}
                    </span>
                    <span className="text-sm font-semibold text-white md:text-xs">{j.label}</span>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
