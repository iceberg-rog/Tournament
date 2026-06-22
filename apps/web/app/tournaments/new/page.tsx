'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';
import { CoverUpload } from '@/components/CoverUpload';
import JalaliPicker from '@/components/JalaliPicker';
import { GAMES, GAME_CATEGORIES, recommendedFormats, type GameDef } from '@/lib/games';
import { isoToJalaliLabel } from '@/lib/jalali';

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
  { v: 'SWISS', name: 'سوئیسی', icon: '🧮', desc: 'چند دور با حریفِ هم‌سطح، بدونِ حذف.', best: 'تعداد زیاد' },
  { v: 'FFA', name: 'Battle Royale', icon: '🪂', desc: 'چندنفره؛ رتبه بر اساس جایگاه.', best: 'Warzone / PUBG / Apex' },
];
const formatName = (v: string) => FORMATS.find((x) => x.v === v)?.name ?? v;
const fmtMoney = (n: number) => n.toLocaleString('en-US');

function MoneyInput({ value, onChange, placeholder }: { value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <input
      inputMode="numeric"
      dir="ltr"
      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-right outline-none focus:border-fuchsia-500/60"
      value={value ? fmtMoney(value) : ''}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^\d]/g, '');
        onChange(digits ? Number(digits) : 0);
      }}
    />
  );
}

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `game-${s.length}`;
}

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [error, setError] = useState('');
  const [gameCat, setGameCat] = useState<string | null>(null);
  const [customGames, setCustomGames] = useState<GameDef[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newGame, setNewGame] = useState({ name: '', category: 'ورزشی' });
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
  const set = (p: Partial<typeof f>) => setF((cur) => ({ ...cur, ...p }));

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

  function pickGame(g: GameDef) {
    const rec = recommendedFormats(g.name);
    set({ game: g.name, format: rec[0] ?? f.format });
  }
  function addGame() {
    const name = newGame.name.trim();
    if (name.length < 2) return setError('نام بازی کوتاه است');
    const g: GameDef = { slug: slugify(name), name, category: newGame.category, emoji: '🎮', c1: '', c2: '' };
    setCustomGames((c) => [g, ...c]);
    setGameCat(newGame.category);
    set({ game: name });
    setNewGame({ name: '', category: 'ورزشی' });
    setAddOpen(false);
    setError('');
    // در صورت دسترسی، در کاتالوگِ پلتفرم هم ثبت می‌شود
    authedPost('/games', { slug: g.slug, name, platforms: [g.category] }).catch(() => {});
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
      if (f.startAt) body.startAt = f.startAt;
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

  const allGames = [...customGames, ...GAMES];
  const rec = recommendedFormats(f.game);
  const sortedFormats = [...FORMATS].sort((a, b) => (rec.includes(b.v) ? 1 : 0) - (rec.includes(a.v) ? 1 : 0));

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
          <div className="card min-h-[320px] p-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
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
                  <button onClick={() => setAddOpen((o) => !o)} className="rounded-xl border border-dashed border-fuchsia-500/50 px-3 py-1.5 text-sm text-fuchsia-300 hover:bg-fuchsia-500/10">
                    + افزودن بازی
                  </button>
                </div>

                {addOpen && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-3">
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      placeholder="نام بازی (مثلاً EA Sports FC 26)"
                      value={newGame.name}
                      onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                    />
                    <select className="rounded-lg bg-slate-800 px-2 py-2 text-sm" value={newGame.category} onChange={(e) => setNewGame({ ...newGame, category: e.target.value })}>
                      {GAME_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button onClick={addGame} className="rounded-lg bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold">
                      افزودن
                    </button>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm text-slate-400">بازی را انتخاب کن</p>
                  <div className="grid max-h-[320px] grid-cols-2 gap-3 overflow-y-auto pl-1 sm:grid-cols-3 md:grid-cols-4">
                    {allGames.filter((g) => !gameCat || g.category === gameCat).map((g) => (
                      <button
                        key={g.slug}
                        onClick={() => pickGame(g)}
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
                <div>
                  <p className="mb-2 text-sm text-slate-400">عکس کاور (آپلود یا کاورِ خودکار)</p>
                  <CoverUpload value={f.coverImage} game={f.game} onChange={(d) => set({ coverImage: d })} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {f.game && rec.length > 0 && (
                  <p className="text-xs text-slate-400">
                    برای <b className="text-slate-200">{f.game}</b> این فرمت‌ها پیشنهاد می‌شوند:
                  </p>
                )}
                {sortedFormats.map((fo) => {
                  const recommended = rec.includes(fo.v);
                  return (
                    <button
                      key={fo.v}
                      onClick={() => set({ format: fo.v, genre: fo.v === 'FFA' ? 'FFA' : f.genre === 'FFA' ? 'DUEL' : f.genre })}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-right transition ${
                        f.format === fo.v ? 'border-fuchsia-500/50 bg-fuchsia-500/10' : recommended ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-white/5 bg-white/[0.02] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">{fo.icon}</span>
                      <div className="flex-1">
                        <p className="flex items-center gap-2 font-bold">
                          {fo.name}
                          {recommended && <span className="chip bg-emerald-500/20 text-emerald-300">پیشنهادی</span>}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-400">{fo.desc}</p>
                        <p className="mt-1 text-xs text-fuchsia-300">مناسب برای: {fo.best}</p>
                      </div>
                    </button>
                  );
                })}
                {f.format !== 'FFA' && (
                  <div className="flex gap-2 pt-2">
                    {[['DUEL', 'انفرادی'], ['TEAM', 'تیمی']].map(([v, fa]) => (
                      <button key={v} onClick={() => set({ genre: v })} className={`rounded-xl px-4 py-2 text-sm ${f.genre === v ? 'bg-violet-600' : 'bg-white/5'}`}>
                        {fa}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">تاریخ و ساعتِ شروع (شمسی)</p>
                <JalaliPicker value={f.startAt} onChange={(iso) => set({ startAt: iso })} />
                {Num('مدت برگزاری (ساعت)', 'durationHours')}
                {f.startAt && (
                  <div className="rounded-xl bg-white/5 p-3 text-sm">
                    🏁 پایانِ تخمینی:{' '}
                    <b>
                      {isoToJalaliLabel(new Date(new Date(f.startAt).getTime() + f.durationHours * 3600_000).toISOString())}
                    </b>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {Num('حداکثر ظرفیت (۰ = نامحدود)', 'maxParticipants', 'مازادِ ظرفیت به لیست انتظار می‌رود')}
                {f.format === 'FFA' && Num('تعداد راند FFA', 'ffaRounds')}
                {f.format === 'SWISS' && Num('تعداد راند سوئیسی (۰ = خودکار)', 'swissRounds')}
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={f.requireCheckIn} onChange={(e) => set({ requireCheckIn: e.target.checked })} />
                  <span>
                    نیاز به check-in پیش از هر مسابقه
                    <span className="block text-[11px] text-slate-500">بازیکن باید حضورش را تأیید کند؛ وگرنه no-show</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={f.requireResultConfirmation} onChange={(e) => set({ requireResultConfirmation: e.target.checked })} />
                  <span>
                    تأیید نتایج توسط داور پیش از نهایی‌شدن
                    <span className="block text-[11px] text-slate-500">نتیجه تا تأییدِ داور اعمال نمی‌شود</span>
                  </span>
                </label>
                <div>
                  <p className="mb-2 text-sm text-slate-400">قالب امتیازدهی (فقط لیگ/سوئیسی)</p>
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
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-400">هزینه‌ی ورودی (تومان، ۰ = رایگان)</span>
                  <MoneyInput value={f.entryFee} onChange={(n) => set({ entryFee: n })} placeholder="۰" />
                  <span className="text-[11px] text-slate-500">از کیف پولِ شرکت‌کننده در escrow مسدود می‌شود</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-400">جایزه‌ی رتبه ۱ (تومان)</span>
                    <MoneyInput value={f.prize1} onChange={(n) => set({ prize1: n })} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-400">جایزه‌ی رتبه ۲ (تومان)</span>
                    <MoneyInput value={f.prize2} onChange={(n) => set({ prize2: n })} />
                  </label>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">این‌طوری نمایش داده می‌شود:</p>
                {/* preview card مثلِ کارتِ واقعی */}
                <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                  <CoverBanner coverImage={f.coverImage} game={f.game} rounded="rounded-none" className="h-32 w-full" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-bold">{f.title || '(بدون عنوان)'}</h3>
                      <span className="chip bg-slate-500/20 text-slate-300">پیش‌نویس</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{f.game || 'بدون بازی'} · {formatName(f.format)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="chip bg-white/5 text-slate-300">🕹️ {f.platform}</span>
                      {f.startAt && <span className="chip bg-white/5 text-slate-300">📅 {isoToJalaliLabel(f.startAt)}</span>}
                      {f.entryFee ? <span className="chip bg-white/5 text-slate-300">🎟️ {fmtMoney(f.entryFee)} ت</span> : null}
                    </div>
                  </div>
                </div>
                <ul className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <li>⏱️ مدت: {f.durationHours} ساعت</li>
                  <li>👥 ظرفیت: {f.maxParticipants || 'نامحدود'}</li>
                  <li>🏆 جوایز: {fmtMoney(f.prize1)} / {fmtMoney(f.prize2)}</li>
                  <li>🎭 نوع: {f.format === 'FFA' ? 'چندنفره' : f.genre === 'TEAM' ? 'تیمی' : 'انفرادی'}</li>
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
