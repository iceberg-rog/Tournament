'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';

const FORMATS = [
  ['SINGLE_ELIM', 'حذفی تک‌حذفی'],
  ['DOUBLE_ELIM', 'حذفی دوحذفی'],
  ['ROUND_ROBIN', 'دوره‌ای (همه با همه)'],
  ['SWISS', 'سوئیسی'],
  ['FFA', 'Battle Royale / FFA'],
];
const GENRES = [
  ['DUEL', 'دوئل (۱v۱)'],
  ['TEAM', 'تیمی'],
  ['FFA', 'انفرادیِ چندنفره'],
];
const STEPS = ['پایه', 'فرمت', 'ژانر/راند', 'ظرفیت', 'هزینه', 'جوایز', 'امتیاز/داوری', 'استریم', 'مرور'];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [f, setF] = useState({
    title: '',
    game: '',
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    ffaRounds: 3,
    swissRounds: 0,
    maxParticipants: 0,
    requireCheckIn: false,
    entryFee: 0,
    prize1: 0,
    prize2: 0,
    scoringWin: 3,
    scoringDraw: 1,
    scoringLoss: 0,
    requireResultConfirmation: false,
    streamUrl: '',
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  if (!isLoggedIn())
    return (
      <main className="p-8">
        برای ساخت تورنومنت{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  function next() {
    if (step === 1 && f.title.trim().length < 2) {
      setError('عنوان حداقل ۲ کاراکتر باشد');
      return;
    }
    setError('');
    setStep(Math.min(STEPS.length, step + 1));
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
        format: f.format,
        genre: f.genre,
        requireCheckIn: f.requireCheckIn,
        requireResultConfirmation: f.requireResultConfirmation,
        scoring: { win: f.scoringWin, draw: f.scoringDraw, loss: f.scoringLoss },
      };
      if (f.format === 'FFA') body.ffaRounds = f.ffaRounds;
      if (f.format === 'SWISS' && f.swissRounds) body.swissRounds = f.swissRounds;
      if (f.maxParticipants) body.maxParticipants = f.maxParticipants;
      if (f.entryFee) body.entryFee = f.entryFee;
      if (prizePool.length) body.prizePool = prizePool;
      if (f.streamUrl) body.streamUrl = f.streamUrl;
      const t = await authedPost<{ id: string }>('/tournaments', body);
      router.push(`/tournaments/${t.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  const Num = (label: string, key: keyof typeof f) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <input
        type="number"
        className="rounded-lg bg-slate-800 px-3 py-2"
        value={String(f[key])}
        onChange={(e) => set({ [key]: Number(e.target.value) } as Partial<typeof f>)}
      />
    </label>
  );

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-1 text-2xl font-bold">ساخت تورنومنت</h1>
      <p className="mb-5 text-sm text-slate-400">
        گام {step} از {STEPS.length}: {STEPS[step - 1]}
      </p>
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded bg-slate-800">
        <div className="h-full bg-indigo-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>

      <div className="min-h-[160px] space-y-3 rounded-lg bg-slate-900 p-5">
        {step === 1 && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">عنوان</span>
              <input className="rounded-lg bg-slate-800 px-3 py-2" value={f.title} onChange={(e) => set({ title: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">بازی (اختیاری)</span>
              <input className="rounded-lg bg-slate-800 px-3 py-2" value={f.game} onChange={(e) => set({ game: e.target.value })} placeholder="FC26، Warzone، …" />
            </label>
          </>
        )}
        {step === 2 && (
          <div className="grid gap-2">
            {FORMATS.map(([v, fa]) => (
              <button key={v} onClick={() => set({ format: v })} className={`rounded-lg px-4 py-2 text-right ${f.format === v ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                {fa}
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {GENRES.map(([v, fa]) => (
                <button key={v} onClick={() => set({ genre: v })} className={`rounded-lg px-3 py-2 text-sm ${f.genre === v ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                  {fa}
                </button>
              ))}
            </div>
            {f.format === 'FFA' && <div className="mt-3">{Num('تعداد راند FFA', 'ffaRounds')}</div>}
            {f.format === 'SWISS' && <div className="mt-3">{Num('تعداد راند سوئیسی (۰ = خودکار)', 'swissRounds')}</div>}
          </>
        )}
        {step === 4 && (
          <>
            {Num('حداکثر ظرفیت (۰ = نامحدود)', 'maxParticipants')}
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.requireCheckIn} onChange={(e) => set({ requireCheckIn: e.target.checked })} />
              نیاز به check-in پیش از هر مسابقه
            </label>
          </>
        )}
        {step === 5 && Num('هزینه‌ی ورودی (ریال، ۰ = رایگان)', 'entryFee')}
        {step === 6 && (
          <div className="grid grid-cols-2 gap-3">
            {Num('جایزه‌ی رتبه ۱ (ریال)', 'prize1')}
            {Num('جایزه‌ی رتبه ۲ (ریال)', 'prize2')}
          </div>
        )}
        {step === 7 && (
          <>
            <p className="text-sm text-slate-400">قالب امتیازدهی (برای رده‌بندیِ دوره‌ای/سوئیسی):</p>
            <div className="grid grid-cols-3 gap-2">
              {Num('برد', 'scoringWin')}
              {Num('مساوی', 'scoringDraw')}
              {Num('باخت', 'scoringLoss')}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.requireResultConfirmation} onChange={(e) => set({ requireResultConfirmation: e.target.checked })} />
              نتایج پیش از نهایی‌شدن نیاز به تأیید داور دارند
            </label>
          </>
        )}
        {step === 8 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">آدرس embed استریم (اختیاری)</span>
            <input className="rounded-lg bg-slate-800 px-3 py-2" value={f.streamUrl} onChange={(e) => set({ streamUrl: e.target.value })} placeholder="https://player.twitch.tv/…" />
          </label>
        )}
        {step === 9 && (
          <ul className="space-y-1 text-sm">
            <li>عنوان: <b>{f.title}</b> {f.game && `· ${f.game}`}</li>
            <li>فرمت: {f.format} · ژانر: {f.genre}</li>
            <li>ظرفیت: {f.maxParticipants || 'نامحدود'} · check-in: {f.requireCheckIn ? 'بله' : 'خیر'}</li>
            <li>هزینه‌ی ورودی: {f.entryFee || 0} · جوایز: {f.prize1 || 0}/{f.prize2 || 0}</li>
            <li>امتیاز: برد {f.scoringWin}/مساوی {f.scoringDraw}/باخت {f.scoringLoss} · تأیید داور: {f.requireResultConfirmation ? 'بله' : 'خیر'}</li>
          </ul>
        )}
      </div>

      {error && <p className="mt-3 text-red-400">{error}</p>}

      <div className="mt-5 flex justify-between">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="rounded-lg border border-slate-700 px-5 py-2 disabled:opacity-40">
          قبلی
        </button>
        {step < STEPS.length ? (
          <button onClick={next} className="rounded-lg bg-indigo-600 px-6 py-2 hover:bg-indigo-500">
            بعدی
          </button>
        ) : (
          <button onClick={submit} className="rounded-lg bg-emerald-600 px-6 py-2 hover:bg-emerald-500">
            ساخت تورنومنت
          </button>
        )}
      </div>
    </main>
  );
}
