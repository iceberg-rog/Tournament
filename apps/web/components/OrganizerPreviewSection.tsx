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

/** نوارِ ۴ گامیِ راه‌اندازی (بازی → فرمت → جوایز → انتشار)؛ یک گام teal فعال. */
const SETUP_STEPS = ['بازی', 'فرمت', 'جوایز', 'انتشار'] as const;
const ACTIVE_STEP = 1; // «فرمت» highlighted

/** ردیفِ انتخابِ فرمت؛ یک چیپ فعال. */
const FORMAT_CHIPS = ['تک‌حذفی', 'دوحذفی', 'لیگ', 'سوئیسی'] as const;
const ACTIVE_FORMAT = 0;

/** لیستِ مینیِ ثبت‌نام (صرفاً تزئینی). */
const REG_ROWS = [
  { name: 'Phantom X', tag: 'PX' },
  { name: 'Valor GG', tag: 'VG' },
  { name: 'Apex Titans', tag: 'AT' },
];

/** سپرِ هویتیِ SHELTER (موتیفِ ظریف). */
const Shield = ({ size = 15 }: { size?: number }) => (
  <Ico size={size}>
    <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" />
    <path d="M9.5 12l2 2 3.5-3.5" />
  </Ico>
);

/** پنلِ «کنترلِ برگزارکننده» — کاملاً تزئینی، بدونِ هیچ fetch یا دادهٔ واقعی. */
function OrganizerControlPanel() {
  return (
    <div className="relative">
      {/* درخششِ ملایمِ پشتِ پنل */}
      <div className="pointer-events-none absolute -inset-5 rounded-[28px] bg-gradient-to-br from-accent/15 to-gold/10 opacity-50 blur-2xl" />

      <div className="anim-float relative rounded-2xl border border-line bg-tile p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)]">
        {/* نوارِ بالا: شناسهٔ پنل + موتیفِ سپر */}
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-line bg-black/20 px-3 py-2.5">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent/10 text-accent">
            <Shield />
          </span>
          <p className="flex-1 truncate text-xs font-bold text-white">کنترلِ برگزارکننده</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 text-[9px] font-bold text-[#fca5a5]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" /> زنده
          </span>
        </div>

        <div className="space-y-2.5">
          {/* (۱) نوارِ ۴ گامیِ راه‌اندازی */}
          <div className="rounded-xl border border-line bg-black/20 p-2.5">
            <div className="flex items-center gap-1.5">
              {SETUP_STEPS.map((s, i) => {
                const active = i === ACTIVE_STEP;
                const done = i < ACTIVE_STEP;
                return (
                  <div key={s} className="flex flex-1 items-center gap-1.5">
                    <span
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[10px] font-bold transition ${
                        active
                          ? 'bg-accent/15 text-accent ring-1 ring-accent/40'
                          : done
                            ? 'bg-white/[0.03] text-good'
                            : 'bg-white/[0.02] text-faint'
                      }`}
                    >
                      <span className="grid h-4 w-4 flex-none place-items-center rounded-full border border-current text-[8px]">
                        {done ? <Ico size={9}><path d="M20 6 9 17l-5-5" /></Ico> : i + 1}
                      </span>
                      <span className="truncate">{s}</span>
                    </span>
                    {i < SETUP_STEPS.length - 1 && (
                      <span className={`h-px w-2 flex-none ${done ? 'bg-good/50' : 'bg-line2'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* (۲) ردیفِ انتخابِ فرمت */}
          <div className="rounded-xl border border-line bg-black/20 p-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">فرمتِ مسابقه</p>
            <div className="flex flex-wrap gap-1.5">
              {FORMAT_CHIPS.map((f, i) => (
                <span
                  key={f}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition ${
                    i === ACTIVE_FORMAT
                      ? 'bg-accent/15 text-accent ring-1 ring-accent/40'
                      : 'border border-line text-muted'
                  }`}
                >
                  {i === ACTIVE_FORMAT && (
                    <span className="grid h-3 w-3 place-items-center rounded-full bg-accent/20">
                      <Ico size={8}><path d="M20 6 9 17l-5-5" /></Ico>
                    </span>
                  )}
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* (۳) لیستِ مینیِ ثبت‌نام */}
          <div className="rounded-xl border border-line bg-black/20 p-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">ثبت‌نام‌ها</p>
            <ul className="space-y-1.5">
              {REG_ROWS.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5 text-[10.5px]"
                >
                  <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-gradient-to-br from-accent/30 to-gold/20 font-display text-[8px] font-bold text-white" dir="ltr">
                    {r.tag}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-200" dir="ltr">{r.name}</span>
                  <span className="inline-flex flex-none items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent">
                    <Ico size={9}><path d="M20 6 9 17l-5-5" /></Ico> تأیید
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* (۴) صفِ داوری */}
          <div className="flex items-center gap-2 rounded-xl border border-line bg-black/20 p-2.5">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-gold/10 text-gold">
              <Ico size={14}>
                <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" />
                <path d="M12 8v4M12 15v.5" />
              </Ico>
            </span>
            <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-200">
              <span className="tnum">۲</span> نتیجه در انتظارِ تأیید
            </p>
            <span className="inline-flex flex-none items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-[10px] font-bold text-[#06231f]">
              <Ico size={11}><path d="M20 6 9 17l-5-5" /></Ico> تأیید
            </span>
          </div>

          {/* (۵) وضعیتِ escrowِ جایزه */}
          <div className="flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.06] p-2.5">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-gold/15 text-gold">
              <Ico size={14}>
                <rect x="3" y="6" width="18" height="13" rx="2.5" />
                <path d="M3 10h18" />
                <circle cx="17" cy="14.5" r="1.2" />
              </Ico>
            </span>
            <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-200">
              جوایز در <span className="text-gold">escrow</span> مسدود است
            </p>
            <span className="inline-flex flex-none items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> امن
            </span>
          </div>

          {/* (۶) کپیِ لینکِ عمومی */}
          <div className="flex items-center gap-2 rounded-xl border border-line bg-black/20 px-2.5 py-2">
            <span className="flex-none text-faint">
              <Ico size={13}>
                <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
                <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
              </Ico>
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-[10.5px] text-muted" dir="ltr">
              shelter.gg/t/champions-arena
            </span>
            <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-tile2 text-muted">
              <Ico size={12}>
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </Ico>
            </span>
          </div>

          {/* (۷) دکمهٔ ساختِ خودکارِ براکت */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="btn-primary w-full pointer-events-none text-[12px]"
          >
            <Ico size={14}>
              <rect x="3" y="4" width="6" height="5" rx="1.5" />
              <rect x="3" y="15" width="6" height="5" rx="1.5" />
              <rect x="15" y="9.5" width="6" height="5" rx="1.5" />
              <path d="M9 6.5h3a2 2 0 0 1 2 2v3.5M9 17.5h3a2 2 0 0 0 2-2V12" />
            </Ico>
            ساختِ خودکارِ براکت
          </button>
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
            برای برگزارکننده‌ها ساخته شده، برای بازیکن‌ها ساده شده
          </h2>
          <p className="mt-3 leading-7 text-muted">
            شِلتر یک ابزارِ کنترل است، نه فقط یک صفحه‌نمایش: راه‌اندازی، داوری، escrow و انتشار —
            همه از یک پنل و فقط با چند کلیک.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        {/* چپ: پنلِ کنترلِ برگزارکننده */}
        <Reveal>
          <OrganizerControlPanel />
        </Reveal>

        {/* راست: چک‌لیستِ ORGANIZER_POINTS */}
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
      </div>
    </section>
  );
}
