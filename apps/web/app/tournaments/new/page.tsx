'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';
import { GAMES, GAME_CATEGORIES } from '@/lib/games';

const STEPS = [
  { n: 1, label: 'بازی و پلتفرم', icon: '🎮' },
  { n: 2, label: 'عنوان و کاور', icon: '🖼️' },
  { n: 3, label: 'فرمت مسابقه', icon: '🏗️' },
  { n: 4, label: 'زمان‌بندی', icon: '📅' },
  { n: 5, label: 'ظرفیت و قوانین', icon: '⚙️' },
  { n: 6, label: 'هزینه و جوایز', icon: '💰' },
  { n: 7, label: 'مرور و ساخت', icon: '🚀' },
];

const PLATFORMS: [string, string, string][] = [
  ['PC', '🖥️', 'کامپیوتر'],
  ['PS5', '🎮', 'PS5'],
  ['PS4', '🎮', 'PS4'],
  ['XBOX', '🟢', 'Xbox'],
  ['SWITCH', '🔴', 'Switch'],
  ['MOBILE', '📱', 'موبایل'],
  ['CROSS', '🌐', 'Cross-play'],
];
const FORMATS = [
  { v: 'SINGLE_ELIM', name: 'تک‌حذفی', icon: '🎯', desc: 'هر باخت = حذف. سریع و پرهیجان.', best: 'تعداد کم تا متوسط' },
  { v: 'DOUBLE_ELIM', name: 'دوحذفی', icon: '♻️', desc: 'تا دو باخت فرصت داری؛ منصفانه‌تر.', best: 'مسابقات جدی' },
  { v: 'ROUND_ROBIN', name: 'دوره‌ای (لیگ)', icon: '🔄', desc: 'همه با همه بازی می‌کنند؛ امتیازی.', best: 'گروه‌های کوچک' },
  { v: 'SWISS', name: 'سوئیسی', icon: '🧮', desc: 'چند دور با حریفِ هم‌سطح، بدونِ حذف. در اسپورت رایج است.', best: 'تعداد زیاد' },
  { v: 'FFA', name: 'Battle Royale', icon: '🪂', desc: 'چندنفره؛ رتبه بر اساس جایگاه.', best: 'Warzone / PUBG / Apex' },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [error, setError] = useState('');
  const [gameCat, setGameCat] = useState<string | null>(null);
  const [f, setF] = useState({
    game: '',
    platform: 'PC',
    title: '',
    coverImage: '',
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    ffaRounds: 3,
    swissRounds: 0,
    startAt: '',
    durationHours: 3,
    maxParticipants: 0,
    requireCheckIn: false,
    requireResultConfirmation: false,
    scoringWin: 3,
    scoringDraw: 1,
    scoringLoss: 0,
    entryFee: 0,
    prize1: 0,
    prize2: 0,
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  if (!isLoggedIn())
    return (
      <main className="grid min-h-[60vh] place-items-center p-8">
        برای ساخت تورنومنت{' '}
        <Link href="/login" className="text-fuchsia-300">
          وارد شوید
        </Link>
      </main>
    );

  function go(to: number) {
    setError('');
    setStep(to);
    setMaxStep((m) => Math.max(m, to));
  }
  function next() {
    if (step === 1 && !f.game) return setError('یک بازی انتخاب کن');
    if (step === 2 && f.title.trim().length < 2) return setError('عنوان حداقل ۲ کاراکتر باشد');
    go(Math.min(STEPS.length, step + 1));
  }

  async function submit() {
    setError('');
    try {
      const prizePool = [
        ...(f.prize1 ? [{ rank: 1, amount: f.prize1 }] : []),
        ...(f.prize2 ? [{ rank: 2, amount: f.prize2 }] : []),
      ];
      const body: Record<string, unknown> = {
        title: f.title,
        game: f.game || undefined,
        platform: f.platform,
        coverImage: f.coverImage || undefined,
        format: f.format,
        genre: f.genre,
        requireCheckIn: f.requireCheckIn,
        requireResultConfirmation: f.requireResultConfirmation,
        scoring: { win: f.scoringWin, draw: f.scoringDraw, loss: f.scoringLoss },
        durationHours: f.durationHours,
      };
      if (f.startAt) body.startAt = new Date(f.startAt).toISOString();
      if (f.format === 'FFA') body.ffaRounds = f.ffaRounds;
      if (f.format === 'SWISS' && f.swissRounds) body.swissRounds = f.swissRounds;
      if (f.maxParticipants) body.maxParticipants = f.maxParticipants;
      if (f.entryFee) body.entryFee = f.entryFee;
      if (prizePool.length) body.prizePool = prizePool;
      const t = await authedPost<{ id: string }>('/tournaments', body);
      router.push(`/tournaments/${t.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  const Num = (label: string, key: keyof typeof f, hint?: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <input
        type="number"
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 outline-none focus:border-fuchsia-500/60"
        value={String(f[key])}
        onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<typeof f>)}
      />
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </label>
  );

  const endAt =
    f.startAt && f.durationHours
      ? new Date(new Date(f.startAt).getTime() + f.durationHours * 3600_000).toLocaleString('fa-IR')
      : null;

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-7">
      <h2 className="mb-6 text-2xl font-extrabold">ساخت تورنومنت</h2>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* step tree */}
        <aside className="card h-max p-5">
          <ol className="relative space-y-1">
            <span className="absolute bottom-4 right-[19px] top-4 w-px bg-white/10" />
            {STEPS.map((s) => {
              const done = s.n < step;
              const active = s.n === step;
              const reachable = s.n <= maxStep;
              return (
                <li key={s.n}>
                  <button
                    disabled={!reachable}
                    onClick={() => reachable && go(s.n)}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right text-sm transition ${
                      active ? 'bg-white/5' : reachable ? 'hover:bg-white/5' : 'opacity-40'
                    }`}
                  >
                    <span
                      className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        active
                          ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30'
                          : done
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {done ? '✓' : s.icon}
                    </span>
                    <span className={active ? 'font-semibold' : 'text-slate-300'}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* step content */}
        <div>
          <div className="card min-h-[300px] p-6">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm text-slate-400">دسته‌بندی بازی</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setGameCat(null)}
                      className={`rounded-xl px-3 py-1.5 text-sm transition ${gameCat === null ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      همه
                    </button>
                    {GAME_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setGameCat(c)}
                        className={`rounded-xl px-3 py-1.5 text-sm transition ${gameCat === c ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-400">بازی را انتخاب کن</p>
                  <div className="grid max-h-[340px] grid-cols-2 gap-3 overflow-y-auto pl-1 sm:grid-cols-3 md:grid-cols-4">
                    {GAMES.filter((g) => !gameCat || g.category === gameCat).map((g) => (
                      <button
                        key={g.slug}
                        onClick={() => set({ game: g.name })}
                        className={`overflow-hidden rounded-xl border-2 transition ${
                          f.game === g.name ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30' : 'border-transparent hover:border-white/20'
                        }`}
                      >
                        <CoverBanner game={g.name} rounded="rounded-lg" className="h-24 w-full" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-400">پلتفرم</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(([v, icon, fa]) => (
                      <button
                        key={v}
                        onClick={() => set({ platform: v })}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                          f.platform === v ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span>{icon}</span> {fa}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">عنوان تورنومنت</span>
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-fuchsia-500/60"
                    placeholder={`مثلاً جام ${f.game || 'هفتگی'}`}
                    value={f.title}
                    onChange={(e) => set({ title: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">آدرس عکس کاور (اختیاری)</span>
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-fuchsia-500/60"
                    placeholder="https://…/cover.jpg — خالی بذاری کاورِ خودکار می‌سازیم"
                    value={f.coverImage}
                    onChange={(e) => set({ coverImage: e.target.value })}
                  />
                </label>
                <div>
                  <p className="mb-2 text-sm text-slate-400">پیش‌نمایش کاور</p>
                  <CoverBanner coverImage={f.coverImage} game={f.game} className="h-40 w-full" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {FORMATS.map((fo) => (
                  <button
                    key={fo.v}
                    onClick={() => set({ format: fo.v, genre: fo.v === 'FFA' ? 'FFA' : f.genre === 'FFA' ? 'DUEL' : f.genre })}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-right transition ${
                      f.format === fo.v ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">{fo.icon}</span>
                    <div>
                      <p className="font-bold">{fo.name}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{fo.desc}</p>
                      <p className="mt-1 text-xs text-fuchsia-300">مناسب برای: {fo.best}</p>
                    </div>
                  </button>
                ))}
                {f.format !== 'FFA' && (
                  <div className="flex gap-2 pt-2">
                    {[['DUEL', 'انفرادی'], ['TEAM', 'تیمی']].map(([v, fa]) => (
                      <button
                        key={v}
                        onClick={() => set({ genre: v })}
                        className={`rounded-xl px-4 py-2 text-sm ${f.genre === v ? 'bg-violet-600' : 'bg-white/5'}`}
                      >
                        {fa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">تاریخ و ساعتِ شروع</span>
                  <input
                    type="datetime-local"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-fuchsia-500/60 [color-scheme:dark]"
                    value={f.startAt}
                    onChange={(e) => set({ startAt: e.target.value })}
                  />
                </label>
                {Num('مدت برگزاری (ساعت)', 'durationHours')}
                {endAt && (
                  <div className="rounded-xl bg-white/5 p-3 text-sm">
                    🏁 پایانِ تخمینی: <b>{endAt}</b>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {Num('حداکثر ظرفیت (۰ = نامحدود)', 'maxParticipants')}
                {f.format === 'FFA' && Num('تعداد راند FFA', 'ffaRounds')}
                {f.format === 'SWISS' && Num('تعداد راند سوئیسی (۰ = خودکار)', 'swissRounds')}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={f.requireCheckIn} onChange={(e) => set({ requireCheckIn: e.target.checked })} />
                  نیاز به check-in پیش از هر مسابقه
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={f.requireResultConfirmation} onChange={(e) => set({ requireResultConfirmation: e.target.checked })} />
                  تأیید نتایج توسط داور پیش از نهایی‌شدن
                </label>
                <div>
                  <p className="mb-2 text-sm text-slate-400">قالب امتیازدهی (لیگ/سوئیسی)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Num('برد', 'scoringWin')}
                    {Num('مساوی', 'scoringDraw')}
                    {Num('باخت', 'scoringLoss')}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                {Num('هزینه‌ی ورودی (تومان، ۰ = رایگان)', 'entryFee', 'از کیف پولِ شرکت‌کننده در escrow مسدود می‌شود')}
                <div className="grid grid-cols-2 gap-3">
                  {Num('جایزه‌ی رتبه ۱', 'prize1')}
                  {Num('جایزه‌ی رتبه ۲', 'prize2')}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <CoverBanner coverImage={f.coverImage} game={f.game} className="h-40 w-full" />
                <h3 className="text-lg font-bold">{f.title || '(بدون عنوان)'}</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <li>🎮 بازی: {f.game || '—'}</li>
                  <li>🕹️ پلتفرم: {f.platform}</li>
                  <li>🏗️ فرمت: {FORMATS.find((x) => x.v === f.format)?.name}</li>
                  <li>👥 ظرفیت: {f.maxParticipants || 'نامحدود'}</li>
                  <li>📅 شروع: {f.startAt ? new Date(f.startAt).toLocaleString('fa-IR') : 'تعیین‌نشده'}</li>
                  <li>⏱️ مدت: {f.durationHours} ساعت</li>
                  <li>💰 ورودی: {f.entryFee || 0} تومان</li>
                  <li>🏆 جوایز: {f.prize1 || 0} / {f.prize2 || 0}</li>
                </ul>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-red-400">{error}</p>}

          <div className="mt-5 flex justify-between">
            <button onClick={() => go(Math.max(1, step - 1))} disabled={step === 1} className="btn-ghost disabled:opacity-40">
              قبلی
            </button>
            {step < STEPS.length ? (
              <button onClick={next} className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-7 py-2.5 font-bold shadow-lg shadow-fuchsia-600/25">
                بعدی
              </button>
            ) : (
              <button onClick={submit} className="rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 px-7 py-2.5 font-bold shadow-lg shadow-emerald-600/25">
                🚀 ساخت تورنومنت
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
