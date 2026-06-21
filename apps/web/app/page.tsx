import Link from 'next/link';

const FEATURES = [
  { icon: '🎮', title: '۵ فرمت حرفه‌ای', desc: 'تک‌حذفی، دوحذفی، دوره‌ای، سوئیسی و Battle Royale' },
  { icon: '💰', title: 'جایزه با escrow', desc: 'هزینه‌ی ورودی و جایزه‌ی نقدی امن با تسویه‌ی خودکار' },
  { icon: '📺', title: 'چت و استریم زنده', desc: 'پخش زنده‌ی مسابقه و گفتگوی هم‌زمانِ بازیکنان' },
  { icon: '📈', title: 'نردبان ELO', desc: 'matchmaking و رتبه‌بندی بر اساس مهارت' },
  { icon: '🛡️', title: 'داوری و ضدتقلب', desc: 'تأیید نتایج توسط داور، گزارش تخلف و تعدیل' },
  { icon: '🌐', title: 'همه‌ی پلتفرم‌ها', desc: 'PC، کنسول و موبایل با cross-play' },
];

const STATS = [
  { v: '۵', l: 'فرمت مسابقه' },
  { v: '∞', l: 'شرکت‌کننده' },
  { v: '۱۰۰٪', l: 'فارسی / RTL' },
  { v: '⚡', l: 'تحویل آنی' },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl shadow-lg shadow-fuchsia-600/30">
        🏆
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        شلتر <span className="text-fuchsia-400">تورنومنت</span>
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* glow orbs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            ورود
          </Link>
          <Link href="/register" className="btn-primary bg-gradient-to-l from-violet-600 to-fuchsia-500">
            ثبت‌نام رایگان
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <span className="chip mb-5 inline-flex border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
          🎮 پلتفرم اسپورتِ بازار ایران
        </span>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">
          تورنومنت بساز، بازی کن،{' '}
          <span className="bg-gradient-to-l from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            جایزه بگیر
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
          پلتفرم کاملِ برگزاری مسابقاتِ بازی‌های ویدیویی — از ثبت‌نام و پرداخت ریالیِ امن تا داوری، چت و استریم
          زنده، و توزیعِ خودکارِ جایزه.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-7 py-3.5 font-bold shadow-lg shadow-fuchsia-600/30 transition hover:opacity-90"
          >
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
              <p className="text-2xl font-extrabold text-fuchsia-300">{s.v}</p>
              <p className="mt-1 text-[11px] text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">همه‌چیز برای یک مسابقه‌ی بی‌نقص</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:border-fuchsia-500/30 hover:bg-slate-900/80">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-2xl">
                {f.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="card relative overflow-hidden bg-gradient-to-l from-violet-700/40 via-fuchsia-700/25 to-slate-900/40 p-10 text-center">
          <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <h2 className="relative text-2xl font-extrabold md:text-3xl">آماده‌ای اولین تورنومنتت رو بسازی؟</h2>
          <p className="relative mt-2 text-slate-300">چند ثانیه‌ای ثبت‌نام کن و شروع کن.</p>
          <Link
            href="/register"
            className="relative mt-6 inline-block rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-8 py-3.5 font-bold shadow-lg shadow-fuchsia-600/30 transition hover:opacity-90"
          >
            ثبت‌نام رایگان
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-400 sm:flex-row">
          <Brand />
          <p>شلتر تورنومنت — پلتفرم برگزاری مسابقات آنلاین</p>
        </div>
      </footer>
    </div>
  );
}
