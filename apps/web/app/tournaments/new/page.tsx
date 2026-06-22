'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';
import { CoverUpload } from '@/components/CoverUpload';
import JalaliPicker from '@/components/JalaliPicker';
import { GAMES, GAME_CATEGORIES, recommendedFormats, type GameDef } from '@/lib/games';
import { isoToJalaliLabel } from '@/lib/jalali';

/* ---- آیکن‌های خطی (بدون ایموجی) ---- */
const Ico = ({ d, children, size = 18 }: { d?: string; children?: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
);

const STEP_ICONS: Record<number, ReactNode> = {
  1: <Ico><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /></Ico>,
  2: <Ico><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-5 4 4 3-3 4 4" /></Ico>,
  3: <Ico><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></Ico>,
  4: <Ico><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Ico>,
  5: <Ico><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Ico>,
  6: <Ico><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5 1-2.5 2 0 2.5 5 1.5 5 4 0 1-1 2-2.5 2A2.5 2.5 0 0 1 9.5 15M12 6v1.5M12 16.5V18" /></Ico>,
  7: <Ico><path d="M5 12l4 4 10-10" /></Ico>,
};

const STEPS = [
  { n: 1, label: 'بازی و پلتفرم' },
  { n: 2, label: 'عنوان و کاور' },
  { n: 3, label: 'فرمت مسابقه' },
  { n: 4, label: 'زمان‌بندی' },
  { n: 5, label: 'ظرفیت و قوانین' },
  { n: 6, label: 'هزینه و جوایز' },
  { n: 7, label: 'مرور و ساخت' },
];

const PLATFORM_ICONS: Record<string, ReactNode> = {
  PC: <Ico size={16}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Ico>,
  PS5: <Ico size={16}><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="16" cy="10" r="1" /><circle cx="18" cy="13" r="1" /></Ico>,
  PS4: <Ico size={16}><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="16" cy="10" r="1" /><circle cx="18" cy="13" r="1" /></Ico>,
  XBOX: <Ico size={16}><circle cx="12" cy="12" r="9" /><path d="M7 6c2 1 5 4 5 6 0 2 3 5 5 6M17 6c-2 1-5 4-5 6 0 2-3 5-5 6" /></Ico>,
  SWITCH: <Ico size={16}><rect x="3" y="3" width="8" height="18" rx="3" /><rect x="13" y="3" width="8" height="18" rx="3" /><circle cx="7" cy="8" r="1" /></Ico>,
  MOBILE: <Ico size={16}><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></Ico>,
  CROSS: <Ico size={16}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></Ico>,
};
const PLATFORMS: [string, string][] = [
  ['PC', 'کامپیوتر'],
  ['PS5', 'PS5'],
  ['PS4', 'PS4'],
  ['XBOX', 'Xbox'],
  ['SWITCH', 'Switch'],
  ['MOBILE', 'موبایل'],
  ['CROSS', 'Cross-play'],
];

const FORMATS: { v: string; name: string; icon: ReactNode; desc: string; best: string }[] = [
  { v: 'SINGLE_ELIM', name: 'تک‌حذفی', icon: <Ico><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></Ico>, desc: 'هر باخت = حذف. سریع و پرهیجان.', best: 'تعداد کم تا متوسط' },
  { v: 'DOUBLE_ELIM', name: 'دوحذفی', icon: <Ico><path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" /></Ico>, desc: 'تا دو باخت فرصت داری؛ منصفانه‌تر.', best: 'مسابقات جدی' },
  { v: 'ROUND_ROBIN', name: 'دوره‌ای (لیگ)', icon: <Ico><path d="M17 2v6h-6M7 22v-6h6" /><path d="M20 11a8 8 0 0 0-14-4M4 13a8 8 0 0 0 14 4" /></Ico>, desc: 'همه با همه بازی می‌کنند؛ امتیازی.', best: 'گروه‌های کوچک' },
  { v: 'SWISS', name: 'سوئیسی', icon: <Ico><path d="M4 7h16M4 12h16M4 17h16M8 4v16" /></Ico>, desc: 'چند دور با حریفِ هم‌سطح، بدونِ حذف.', best: 'تعداد زیاد' },
  { v: 'FFA', name: 'Battle Royale', icon: <Ico><circle cx="12" cy="8" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /><circle cx="5" cy="11" r="1.5" /><circle cx="19" cy="11" r="1.5" /></Ico>, desc: 'چندنفره؛ رتبه بر اساس جایگاه.', best: 'Warzone / PUBG / Apex' },
  { v: 'GROUP_STAGE', name: 'گروهی + پلی‌آف', icon: <Ico><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 17h7M18 14l3 3-3 3" /></Ico>, desc: 'تقسیم به چند گروه؛ نفراتِ برترِ هر گروه به براکتِ نهایی صعود می‌کنند.', best: 'تورنومنت‌های بزرگ (سبکِ جام‌جهانی)' },
];
const formatName = (v: string) => FORMATS.find((x) => x.v === v)?.name ?? v;
const fmtMoney = (n: number) => n.toLocaleString('en-US');

function MoneyInput({ value, onChange, placeholder }: { value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <input
      inputMode="numeric"
      dir="ltr"
      className="w-full rounded-xl border border-line bg-tile2 px-3 py-2.5 text-right outline-none transition focus:border-accent/60"
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
    groupSize: 4,
    advancePerGroup: 2,
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
      <div className="grid min-h-[60vh] place-items-center p-8 text-muted">
        برای ساخت تورنومنت{' '}
        <Link href="/login" className="text-accent">
          وارد شوید
        </Link>
      </div>
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
      if (f.format === 'GROUP_STAGE') {
        body.groupSize = f.groupSize;
        body.advancePerGroup = f.advancePerGroup;
      }
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
      <span className="text-muted">{label}</span>
      <input
        type="number"
        className="rounded-xl border border-line bg-tile2 px-3 py-2.5 outline-none transition focus:border-accent/60"
        value={String(f[key])}
        onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<typeof f>)}
      />
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </label>
  );

  const allGames = [...customGames, ...GAMES];
  const rec = recommendedFormats(f.game);
  const sortedFormats = [...FORMATS].sort((a, b) => (rec.includes(b.v) ? 1 : 0) - (rec.includes(a.v) ? 1 : 0));

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      {/* step tree */}
      <aside className="card h-max p-5">
        <ol className="relative space-y-1">
          <span className="absolute bottom-4 right-[19px] top-4 w-px bg-line" />
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
                    active ? 'bg-accent/10' : reachable ? 'hover:bg-white/[.04]' : 'opacity-40'
                  }`}
                >
                  <span
                    className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      active
                        ? 'bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_8px_22px_-12px_rgba(45,212,191,.8)]'
                        : done
                          ? 'bg-good/20 text-good'
                          : 'bg-tile2 text-muted'
                    }`}
                  >
                    {done ? <Ico d="M5 12l4 4 10-10" size={16} /> : STEP_ICONS[s.n]}
                  </span>
                  <span className={active ? 'font-semibold' : 'text-muted'}>{s.label}</span>
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
                  className={`rounded-xl px-3 py-1.5 text-sm transition ${gameCat === null ? 'btn-primary !rounded-xl !px-3 !py-1.5' : 'bg-tile2 text-muted hover:bg-white/[.06]'}`}
                >
                  همه
                </button>
                {GAME_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setGameCat(c)}
                    className={`rounded-xl px-3 py-1.5 text-sm transition ${gameCat === c ? 'btn-primary !rounded-xl !px-3 !py-1.5' : 'bg-tile2 text-muted hover:bg-white/[.06]'}`}
                  >
                    {c}
                  </button>
                ))}
                <button onClick={() => setAddOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-3 py-1.5 text-sm text-accent transition hover:bg-accent/10">
                  <Ico d="M12 5v14M5 12h14" size={15} /> افزودن بازی
                </button>
              </div>

              {addOpen && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile2 p-3">
                  <input
                    className="flex-1 rounded-lg border border-line bg-tile px-3 py-2 text-sm outline-none transition focus:border-accent/60"
                    placeholder="نام بازی (مثلاً EA Sports FC 26)"
                    value={newGame.name}
                    onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                  />
                  <select className="rounded-lg border border-line bg-tile px-2 py-2 text-sm" value={newGame.category} onChange={(e) => setNewGame({ ...newGame, category: e.target.value })}>
                    {GAME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button onClick={addGame} className="btn-primary">
                    افزودن
                  </button>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm text-muted">بازی را انتخاب کن</p>
                <div className="grid max-h-[320px] grid-cols-2 gap-3 overflow-y-auto pl-1 sm:grid-cols-3 md:grid-cols-4">
                  {allGames.filter((g) => !gameCat || g.category === gameCat).map((g) => (
                    <button
                      key={g.slug}
                      onClick={() => pickGame(g)}
                      className={`overflow-hidden rounded-xl border-2 transition ${
                        f.game === g.name ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-line-2'
                      }`}
                    >
                      <CoverBanner game={g.name} rounded="rounded-lg" className="h-24 w-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted">پلتفرم</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(([v, fa]) => (
                    <button
                      key={v}
                      onClick={() => set({ platform: v })}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                        f.platform === v ? 'btn-primary !rounded-xl' : 'bg-tile2 text-muted hover:bg-white/[.06]'
                      }`}
                    >
                      <span>{PLATFORM_ICONS[v]}</span> {fa}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted">عنوان تورنومنت</span>
                <input
                  className="rounded-xl border border-line bg-tile2 px-4 py-3 outline-none transition focus:border-accent/60"
                  placeholder={`مثلاً جام ${f.game || 'هفتگی'}`}
                  value={f.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </label>
              <div>
                <p className="mb-2 text-sm text-muted">عکس کاور (آپلود یا کاورِ خودکار)</p>
                <CoverUpload value={f.coverImage} game={f.game} onChange={(d) => set({ coverImage: d })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {f.game && rec.length > 0 && (
                <p className="text-xs text-muted">
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
                      f.format === fo.v ? 'border-accent/50 bg-accent/10' : recommended ? 'border-line bg-tile2 hover:bg-white/[.06]' : 'border-line/60 bg-white/[0.02] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${f.format === fo.v ? 'bg-accent/15 text-accent' : 'bg-tile text-muted'}`}>{fo.icon}</span>
                    <div className="flex-1">
                      <p className="flex items-center gap-2 font-bold">
                        {fo.name}
                        {recommended && <span className="chip bg-accent/15 text-[#5eead4]">پیشنهادی</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{fo.desc}</p>
                      <p className="mt-1 text-xs text-accent">مناسب برای: {fo.best}</p>
                    </div>
                  </button>
                );
              })}
              {f.format !== 'FFA' && (
                <div className="flex gap-2 pt-2">
                  {[['DUEL', 'انفرادی'], ['TEAM', 'تیمی']].map(([v, fa]) => (
                    <button key={v} onClick={() => set({ genre: v })} className={`rounded-xl px-4 py-2 text-sm transition ${f.genre === v ? 'bg-accent text-[#06231f] font-semibold' : 'bg-tile2 text-muted hover:bg-white/[.06]'}`}>
                      {fa}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted">تاریخ و ساعتِ شروع (شمسی)</p>
              <JalaliPicker value={f.startAt} onChange={(iso) => set({ startAt: iso })} />
              {Num('مدت برگزاری (ساعت)', 'durationHours')}
              {f.startAt && (
                <div className="flex items-center gap-2 rounded-xl border border-line bg-tile2 p-3 text-sm">
                  <span className="text-accent"><Ico d="M4 22V4M4 4h13l-2 4 2 4H4" size={16} /></span>
                  پایانِ تخمینی:{' '}
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
              {f.format === 'GROUP_STAGE' && (
                <div className="grid grid-cols-2 gap-2">
                  {Num('اعضای هر گروه', 'groupSize', 'مثلاً ۴')}
                  {Num('صعود از هر گروه', 'advancePerGroup', 'مثلاً ۲')}
                </div>
              )}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 accent-[#2dd4bf]" checked={f.requireCheckIn} onChange={(e) => set({ requireCheckIn: e.target.checked })} />
                <span>
                  نیاز به check-in پیش از هر مسابقه
                  <span className="block text-[11px] text-faint">بازیکن باید حضورش را تأیید کند؛ وگرنه no-show</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 accent-[#2dd4bf]" checked={f.requireResultConfirmation} onChange={(e) => set({ requireResultConfirmation: e.target.checked })} />
                <span>
                  تأیید نتایج توسط داور پیش از نهایی‌شدن
                  <span className="block text-[11px] text-faint">نتیجه تا تأییدِ داور اعمال نمی‌شود</span>
                </span>
              </label>
              <div>
                <p className="mb-2 text-sm text-muted">قالب امتیازدهی (فقط لیگ/سوئیسی)</p>
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
                <span className="text-muted">هزینه‌ی ورودی (تومان، ۰ = رایگان)</span>
                <MoneyInput value={f.entryFee} onChange={(n) => set({ entryFee: n })} placeholder="۰" />
                <span className="text-[11px] text-faint">از کیف پولِ شرکت‌کننده در escrow مسدود می‌شود</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">جایزه‌ی رتبه ۱ (تومان)</span>
                  <MoneyInput value={f.prize1} onChange={(n) => set({ prize1: n })} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">جایزه‌ی رتبه ۲ (تومان)</span>
                  <MoneyInput value={f.prize2} onChange={(n) => set({ prize2: n })} />
                </label>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted">این‌طوری نمایش داده می‌شود:</p>
              {/* preview card مثلِ کارتِ واقعی */}
              <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-line bg-tile2">
                <CoverBanner coverImage={f.coverImage} game={f.game} rounded="rounded-none" className="h-32 w-full" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-bold">{f.title || '(بدون عنوان)'}</h3>
                    <span className="chip bg-white/10 text-muted">پیش‌نویس</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{f.game || 'بدون بازی'} · {formatName(f.format)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="chip gap-1 bg-tile text-muted"><Ico size={13}><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="16" cy="11" r="1" /></Ico> {f.platform}</span>
                    {f.startAt && <span className="chip gap-1 bg-tile text-muted"><Ico size={13}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></Ico> {isoToJalaliLabel(f.startAt)}</span>}
                    {f.entryFee ? <span className="chip gap-1 bg-tile text-muted"><Ico size={13}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></Ico> {fmtMoney(f.entryFee)} ت</span> : null}
                  </div>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
                <li className="flex items-center gap-2"><span className="text-accent"><Ico size={15}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ico></span> مدت: {f.durationHours} ساعت</li>
                <li className="flex items-center gap-2"><span className="text-accent"><Ico size={15}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></Ico></span> ظرفیت: {f.maxParticipants || 'نامحدود'}</li>
                <li className="flex items-center gap-2"><span className="text-gold"><Ico size={15}><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></Ico></span> جوایز: {fmtMoney(f.prize1)} / {fmtMoney(f.prize2)}</li>
                <li className="flex items-center gap-2"><span className="text-accent"><Ico size={15}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Ico></span> نوع: {f.format === 'FFA' ? 'چندنفره' : f.genre === 'TEAM' ? 'تیمی' : 'انفرادی'}</li>
              </ul>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-bad">{error}</p>}

        <div className="mt-5 flex justify-between">
          <button onClick={() => go(Math.max(1, step - 1))} disabled={step === 1} className="btn-ghost disabled:opacity-40">
            قبلی
          </button>
          {step < STEPS.length ? (
            <button onClick={next} className="btn-primary px-7 py-2.5">
              بعدی
            </button>
          ) : (
            <button onClick={submit} className="btn-primary px-7 py-2.5">
              ساخت تورنومنت
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
