'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedGet, authedPut, isLoggedIn } from '@/lib/api';

interface PlatformSettings {
  general: { siteName: string; currency: string };
  payment: { provider: string; merchantId: string; callbackUrl: string; sandbox: boolean };
  sms: { provider: string; apiKey: string; senderLine: string };
  oauth: { googleClientId: string; discordClientId: string };
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{props.label}</span>
      <input
        className="rounded-lg bg-slate-800 px-3 py-2"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<PlatformSettings | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) return;
    authedGet<PlatformSettings>('/settings')
      .then(setS)
      .catch((e) => setError(e instanceof Error ? e.message : 'خطا'));
  }, [loggedIn]);

  async function save() {
    if (!s) return;
    setError('');
    setSaved(false);
    try {
      const next = await authedPut<PlatformSettings>('/settings', s);
      setS(next);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!loggedIn) {
    return (
      <main className="p-8">
        برای تنظیمات مدیریت{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );
  }
  if (!s) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  const set = (patch: Partial<PlatformSettings>) => setS({ ...s, ...patch });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">تنظیمات پایه‌ی داشبورد مدیریت</h1>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">عمومی</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام سایت" value={s.general.siteName} onChange={(v) => set({ general: { ...s.general, siteName: v } })} />
          <Field label="واحد پول" value={s.general.currency} onChange={(v) => set({ general: { ...s.general, currency: v } })} />
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">درگاه پرداخت</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ارائه‌دهنده" value={s.payment.provider} onChange={(v) => set({ payment: { ...s.payment, provider: v } })} placeholder="zarinpal" />
          <Field label="Merchant ID" value={s.payment.merchantId} onChange={(v) => set({ payment: { ...s.payment, merchantId: v } })} placeholder="کد پذیرنده" />
          <Field label="Callback URL" value={s.payment.callbackUrl} onChange={(v) => set({ payment: { ...s.payment, callbackUrl: v } })} placeholder="https://…/verify" />
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.payment.sandbox}
              onChange={(e) => set({ payment: { ...s.payment, sandbox: e.target.checked } })}
            />
            حالت آزمایشی (sandbox)
          </label>
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">پیامک</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ارائه‌دهنده" value={s.sms.provider} onChange={(v) => set({ sms: { ...s.sms, provider: v } })} placeholder="kavenegar / …" />
          <Field label="API Key" value={s.sms.apiKey} onChange={(v) => set({ sms: { ...s.sms, apiKey: v } })} />
          <Field label="خط ارسال" value={s.sms.senderLine} onChange={(v) => set({ sms: { ...s.sms, senderLine: v } })} />
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">ورود اجتماعی (OAuth)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Google Client ID" value={s.oauth.googleClientId} onChange={(v) => set({ oauth: { ...s.oauth, googleClientId: v } })} />
          <Field label="Discord Client ID" value={s.oauth.discordClientId} onChange={(v) => set({ oauth: { ...s.oauth, discordClientId: v } })} />
        </div>
      </section>

      {error && <p className="mb-3 text-red-400">{error}</p>}
      {saved && <p className="mb-3 text-emerald-400">ذخیره شد ✅</p>}
      <button onClick={save} className="rounded-lg bg-indigo-600 px-6 py-3 font-medium hover:bg-indigo-500">
        ذخیره‌ی تنظیمات
      </button>
    </main>
  );
}
