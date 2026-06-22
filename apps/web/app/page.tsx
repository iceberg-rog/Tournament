import Link from 'next/link';
import LiveTournaments from '@/components/LiveTournaments';

const ICONS: Record<string, React.ReactNode> = {
  game: <><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /></>,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  stream: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m10 8 4 2.5L10 13z" /></>,
  ladder: <><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></>,
  shield: <><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
};

function FeatureIcon({ name }: { name: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const FEATURES = [
  { icon: 'game', title: '۵ فرمت حرفه‌ای', desc: 'تک‌حذفی، دوحذفی، دوره‌ای، سوئیسی و Battle Royale' },
  { icon: 'wallet', title: 'جایزه با escrow', desc: 'هزینه‌ی ورودی و جایزه‌ی نقدی امن با تسویه‌ی خودکار' },
  { icon: 'stream', title: 'چت و استریم زنده', desc: 'پخش زنده‌ی مسابقه و گفتگوی هم‌زمانِ بازیکنان' },
  { icon: 'ladder', title: 'نردبان ELO', desc: 'matchmaking و رتبه‌بندی بر اساس مهارت' },
  { icon: 'shield', title: 'داوری و ضدتقلب', desc: 'تأیید نتایج توسط داور، گزارش تخلف و تعدیل' },
  { icon: 'globe', title: 'همه‌ی پلتفرم‌ها', desc: 'PC، کنسول و موبایل با cross-play' },
];

const STATS = [
  { v: '۵', l: 'فرمت مسابقه' },
  { v: '∞', l: 'شرکت‌کننده' },
  { v: '۱۰۰٪', l: 'فارسی / RTL' },
  { v: 'آنی', l: 'تحویل جایزه' },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_6px_18px_-8px_rgba(45,212,191,.6)]">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
        </svg>
      </span>
      <span>
        <span className="block font-display text-[19px] font-bold tracking-[.14em]">SHELTER</span>
        <span className="block text-[10px] uppercase tracking-[.2em] text-faint">سامانه‌ی برگزاری</span>
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* glow orbs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-gold/15 blur-[120px]" />

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            ورود
          </Link>
          <Link href="/register" className="btn-primary">
            ثبت‌نام رایگان
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <span className="chip mb-5 inline-flex border border-accent/30 bg-accent/10 px-3 py-1 text-[#5eead4]">
          پلتفرم اسپورتِ بازار ایران
        </span>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">
          تورنومنت بساز، بازی کن،{' '}
          <span className="bg-gradient-to-l from-accent to-[#5eead4] bg-clip-text text-transparent">
            جایزه بگیر
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
          پلتفرم کاملِ برگزاری مسابقاتِ بازی‌های ویدیویی — از ثبت‌نام و پرداخت ریالیِ امن تا داوری، چت و استریم
          زنده، و توزیعِ خودکارِ جایزه.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-7 py-3.5 text-base">
            شروع رایگان
          </Link>
          <Link href="/tournaments" className="btn-ghost px-7 py-3.5 text-base">
            مشاهده‌ی تورنومنت‌ها ←
          </Link>
        </div>

        {/* stats */}
        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.l} className="card p-4">
              <p className="num text-2xl font-extrabold text-accent">{s.v}</p>
              <p className="mt-1 text-[11px] text-muted">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* live tournaments */}
      <LiveTournaments />

      {/* features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">همه‌چیز برای یک مسابقه‌ی بی‌نقص</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card p-6 transition hover:border-accent/30 hover:bg-tile2">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${i % 2 === 0 ? 'bg-accent/10 text-accent' : 'bg-gold/15 text-gold'}`}>
                <FeatureIcon name={f.icon} />
              </span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="card relative overflow-hidden bg-gradient-to-l from-accent/15 via-gold/10 to-tile p-10 text-center">
          <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
          <h2 className="relative text-2xl font-extrabold md:text-3xl">آماده‌ای اولین تورنومنتت رو بسازی؟</h2>
          <p className="relative mt-2 text-muted">چند ثانیه‌ای ثبت‌نام کن و شروع کن.</p>
          <Link href="/register" className="btn-primary relative mt-6 px-8 py-3.5 text-base">
            ثبت‌نام رایگان
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted sm:flex-row">
          <Brand />
          <p>SHELTER — پلتفرم برگزاری مسابقات آنلاین</p>
        </div>
      </footer>
    </div>
  );
}
