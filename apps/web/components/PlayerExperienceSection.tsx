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

/** مسیرِ تجربه‌ی بازیکن: پیدا کن ← ثبت‌نام ← رقابت ← جایزه. */
const FLOW: { label: string; icon: React.ReactNode }[] = [
  {
    label: 'پیدا کن',
    icon: (
      <Ico>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </Ico>
    ),
  },
  {
    label: 'ثبت‌نام',
    icon: (
      <Ico>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </Ico>
    ),
  },
  {
    label: 'رقابت',
    icon: (
      <Ico>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z" />
        <path d="M12 14v3M9 21h6M10 21v-1.5a2 2 0 1 1 4 0V21" />
      </Ico>
    ),
  },
  {
    label: 'جایزه',
    icon: (
      <Ico>
        <circle cx="12" cy="8" r="6" />
        <path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" />
      </Ico>
    ),
  },
];

export function PlayerExperienceSection() {
  return (
    <Reveal as="section">
      {/* بلاکِ سرتیتر */}
      <div className="mb-8">
        <span className="chip bg-accent/10 text-accent">
          <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          برای بازیکن‌ها
        </span>
        <h2 className="mt-3 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight text-white">
          بازیکن‌ها سریع پیدا می‌کنند، راحت ثبت‌نام می‌کنند، شفاف رقابت می‌کنند
        </h2>
        <p className="mt-3 max-w-2xl text-muted leading-8">
          از پیدا کردنِ تورنومنتِ مناسب تا دریافتِ امنِ جایزه — همه‌چیز در یک مسیرِ روان و
          شفاف. بدونِ واسطه، بدونِ ابهام، با آماری که به آن اعتماد داری.
        </p>
      </div>

      {/* دو ستون؛ ترتیب نسبت به بخشِ برگزارکننده برعکس شده تا ریتمِ صفحه متناوب بماند:
          ابتدا لیستِ نکات، سپس ویژوال (در RTL ویژوال سمتِ چپ می‌نشیند). */}
      <div className="grid items-stretch gap-6 md:grid-cols-2">
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

        {/* ── ستونِ ویژوال: مسیرِ بازیکن + استکِ دیسیپلین ── */}
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-tile2 p-6 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
          {/* درخششِ نرمِ پس‌زمینه */}
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 60px 8px rgba(0,0,0,.35)' }} />

          {/* مسیرِ تجربه: پیدا کن ← ثبت‌نام ← رقابت ← جایزه */}
          <div className="relative">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
              <Ico size={14}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </Ico>
              مسیرِ یک بازیکن
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FLOW.map((f, i) => (
                <Reveal key={f.label} delay={i * 90} className="h-full">
                  <div className="flex h-full flex-col items-center gap-2 rounded-xl border border-line bg-black/20 px-2 py-4 text-center anim-float-sm" style={{ animationDelay: `${i * 0.4}s` }}>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${i === FLOW.length - 1 ? 'bg-gold/10 text-gold' : 'bg-accent/10 text-accent'}`}>
                      {f.icon}
                    </span>
                    <span className="text-xs font-semibold text-white">{f.label}</span>
                    <span className="tnum text-[10px] text-faint">{`۰${i + 1}`}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* استکِ دیسیپلین: مرورِ تورنومنت بر اساسِ بازی و پلتفرم */}
          <div className="relative mt-6 flex flex-1 flex-col">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-faint">
              <Ico size={14}>
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M7 20h10M9 16v4M15 16v4" />
              </Ico>
              مرور بر اساسِ دیسیپلین
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2.5">
              {[
                { name: 'تیراندازی', plat: 'PC', open: 'ثبت‌نام باز' },
                { name: 'بتل‌رویال', plat: 'Cross-play', open: 'ثبت‌نام باز' },
                { name: 'MOBA', plat: 'PC', open: 'زنده' },
              ].map((d, i) => (
                <Reveal key={d.name} delay={i * 80}>
                  <div className="row-soft flex items-center gap-3 p-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-accent/10 text-accent">
                      <Ico size={16}>
                        <path d="M6 12h4M8 10v4" />
                        <rect x="2" y="6" width="20" height="12" rx="4" />
                        <circle cx="16" cy="11" r="1" />
                        <circle cx="18.5" cy="13" r="1" />
                      </Ico>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{d.name}</div>
                      <div className="text-xs text-faint">{d.plat}</div>
                    </div>
                    <span
                      className={`chip ${
                        d.open === 'زنده'
                          ? 'border border-bad/30 bg-bad/10 text-bad'
                          : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {d.open === 'زنده' && <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-bad" />}
                      {d.open}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
