import { Reveal } from '@/components/Reveal';
import { ORGANIZER_POINTS } from '@/lib/landing';

const Ico = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** آیتم‌های فاوسایدبارِ مینیِ داشبورد (صرفاً تزئینی). */
const NAV = [
  {
    label: 'داشبورد',
    active: true,
    icon: (
      <Ico>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </Ico>
    ),
  },
  {
    label: 'تورنومنت‌ها',
    icon: (
      <Ico>
        <path d="M6 3v6a6 6 0 0 0 12 0V3" />
        <path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
      </Ico>
    ),
  },
  {
    label: 'کیف‌پول',
    icon: (
      <Ico>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M3 10h18" />
        <circle cx="17" cy="14.5" r="1.2" />
      </Ico>
    ),
  },
  {
    label: 'داوری',
    icon: (
      <Ico>
        <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" />
        <path d="M9.5 12l2 2 3.5-3.5" />
      </Ico>
    ),
  },
];

/** سه کاشیِ مینیِ KPI (صرفاً تزئینی، بدونِ دادهٔ واقعی). */
const KPIS = [
  { label: 'تورنومنتِ فعال', value: '۴', tone: 'accent' as const },
  { label: 'شرکت‌کننده', value: '۲٬۱۸۰', tone: 'text' as const },
  { label: 'در escrow', value: '۸۴٪', tone: 'gold' as const },
];

/** ردیف‌های جدولِ مینیِ شرکت‌کننده/مسابقه (صرفاً تزئینی). */
const ROWS = [
  { team: 'Phantom X', vs: 'Valor GG', state: 'تأییدشده', tone: 'good' as const },
  { team: 'Apex Titans', vs: 'Cobalt', state: 'در جریان', tone: 'accent' as const },
  { team: 'Storm Five', vs: 'Nova', state: 'در انتظار', tone: 'muted' as const },
];

const TONE: Record<'accent' | 'gold' | 'good' | 'text' | 'muted', string> = {
  accent: 'text-accent',
  gold: 'text-gold',
  good: 'text-good',
  text: 'text-white',
  muted: 'text-muted',
};

/** پیش‌نمایشِ داشبوردِ برگزارکننده — تزئینی، نه داشبوردِ واقعی و بدونِ هیچ fetch. */
function OrganizerDashboardMockup() {
  return (
    <div className="relative">
      {/* درخششِ ملایمِ پشتِ پنل */}
      <div className="pointer-events-none absolute -inset-5 rounded-[28px] bg-gradient-to-br from-accent/15 to-gold/10 opacity-50 blur-2xl" />

      <div className="anim-float relative rounded-2xl border border-line bg-tile p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
        {/* نوارِ بالا: شناسهٔ پنل + کنترل‌های پنجره */}
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2.5">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent/10 text-accent">
            <Ico size={15}>
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </Ico>
          </span>
          <p className="flex-1 truncate text-xs font-bold text-white">پنلِ مدیریتِ مسابقه</p>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-line2" />
            <span className="h-2 w-2 rounded-full bg-line2" />
            <span className="h-2 w-2 rounded-full bg-accent/50" />
          </span>
        </div>

        <div className="grid grid-cols-[88px_1fr] gap-3">
          {/* فاوسایدبار */}
          <nav className="flex flex-col gap-1.5 rounded-xl border border-line bg-black/20 p-2">
            {NAV.map((n) => (
              <span
                key={n.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                  n.active ? 'bg-accent/10 text-accent' : 'text-muted'
                }`}
              >
                <span className="flex-none">{n.icon}</span>
                <span className="truncate">{n.label}</span>
              </span>
            ))}
          </nav>

          {/* محتوای اصلی */}
          <div className="min-w-0 space-y-3">
            {/* سه کاشیِ KPI */}
            <div className="grid grid-cols-3 gap-2">
              {KPIS.map((k) => (
                <div key={k.label} className="rounded-xl border border-line bg-black/20 p-2.5">
                  <p className="truncate text-[9.5px] leading-5 text-faint">{k.label}</p>
                  <p className={`mt-0.5 font-display text-base font-bold tnum ${TONE[k.tone]}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* جدولِ مینیِ شرکت‌کننده/مسابقه */}
            <div className="rounded-xl border border-line bg-black/20 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">مسابقه‌های اخیر</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 text-[9px] font-bold text-[#fca5a5]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" /> زنده
                </span>
              </div>
              <ul className="space-y-1.5">
                {ROWS.map((r) => (
                  <li
                    key={r.team}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5 text-[10.5px]"
                  >
                    <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-tile2 font-display text-[9px] font-bold text-muted">
                      {r.team.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-200">
                      {r.team} <span className="text-faint">vs {r.vs}</span>
                    </span>
                    <span className={`flex-none font-semibold ${TONE[r.tone]}`}>{r.state}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrganizerPreviewSection() {
  return (
    <section>
      <Reveal>
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">
            برای برگزارکننده‌ها ساخته شده، نه فقط بازیکن‌ها
          </h2>
          <p className="mt-3 leading-7 text-muted">
            همهٔ ابزارهای اجرای یک مسابقهٔ حرفه‌ای در یک پنل: از مدیریتِ ثبت‌نام و داوری تا کیف‌پول و
            تسویه. تو روی رقابت تمرکز کن، بقیه را به ما بسپار.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
        {/* چک‌لیستِ برگزارکننده */}
        <ul className="space-y-3">
          {ORGANIZER_POINTS.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 70}>
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-tile p-4 transition duration-200 hover:-translate-y-1 hover:border-accent/40">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
                  <Ico size={18}>
                    <path d="M20 6 9 17l-5-5" />
                  </Ico>
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[15px] font-bold leading-6 text-white">{p.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-faint">{p.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>

        {/* پیش‌نمایشِ داشبورد */}
        <Reveal delay={120}>
          <OrganizerDashboardMockup />
        </Reveal>
      </div>
    </section>
  );
}
