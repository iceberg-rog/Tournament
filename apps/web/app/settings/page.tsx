'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { authedGet, authedPut, isLoggedIn } from '@/lib/api';

interface PlatformSettings {
  general: { siteName: string; currency: string };
  payment: { provider: string; merchantId: string; callbackUrl: string; sandbox: boolean };
  sms: { provider: string; apiKey: string; senderLine: string };
  oauth: { googleClientId: string; discordClientId: string };
}

const I = {
  gear: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></svg>,
  wallet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  key: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 21 2M16 7l3 3M14 9l3 3" /></svg>,
};

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-faint text-[11px] font-semibold uppercase tracking-[.08em]">{props.label}</span>
      <input
        className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-text outline-none transition placeholder:text-faint focus:border-accent-dim focus:ring-2 focus:ring-accent/20"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function Section({ icon, title, amber, children }: { icon: ReactNode; title: string; amber?: boolean; children: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="tile-head">
        <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
        <span className="tile-title">{title}</span>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>
    </section>
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
      <div className="card p-8 text-sm text-muted">
        برای تنظیمات مدیریت{' '}
        <Link href="/login" className="text-accent">
          وارد شوید
        </Link>
        .
      </div>
    );
  }
  if (!s) return <div className="card p-8 text-sm text-muted">{error || 'در حال بارگذاری...'}</div>;

  const set = (patch: Partial<PlatformSettings>) => setS({ ...s, ...patch });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Section icon={I.gear} title="عمومی">
        <Field label="نام سایت" value={s.general.siteName} onChange={(v) => set({ general: { ...s.general, siteName: v } })} />
        <Field label="واحد پول" value={s.general.currency} onChange={(v) => set({ general: { ...s.general, currency: v } })} />
      </Section>

      <Section icon={I.wallet} title="درگاه پرداخت" amber>
        <Field label="ارائه‌دهنده" value={s.payment.provider} onChange={(v) => set({ payment: { ...s.payment, provider: v } })} placeholder="zarinpal" />
        <Field label="Merchant ID" value={s.payment.merchantId} onChange={(v) => set({ payment: { ...s.payment, merchantId: v } })} placeholder="کد پذیرنده" />
        <Field label="Callback URL" value={s.payment.callbackUrl} onChange={(v) => set({ payment: { ...s.payment, callbackUrl: v } })} placeholder="https://…/verify" />
        <label className="mt-1 flex items-center gap-2.5 self-end text-sm text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-accent"
            checked={s.payment.sandbox}
            onChange={(e) => set({ payment: { ...s.payment, sandbox: e.target.checked } })}
          />
          حالت آزمایشی (sandbox)
        </label>
      </Section>

      <Section icon={I.chat} title="پیامک">
        <Field label="ارائه‌دهنده" value={s.sms.provider} onChange={(v) => set({ sms: { ...s.sms, provider: v } })} placeholder="kavenegar / …" />
        <Field label="API Key" value={s.sms.apiKey} onChange={(v) => set({ sms: { ...s.sms, apiKey: v } })} />
        <Field label="خط ارسال" value={s.sms.senderLine} onChange={(v) => set({ sms: { ...s.sms, senderLine: v } })} />
      </Section>

      <Section icon={I.key} title="ورود اجتماعی (OAuth)" amber>
        <Field label="Google Client ID" value={s.oauth.googleClientId} onChange={(v) => set({ oauth: { ...s.oauth, googleClientId: v } })} />
        <Field label="Discord Client ID" value={s.oauth.discordClientId} onChange={(v) => set({ oauth: { ...s.oauth, discordClientId: v } })} />
      </Section>

      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}
      {saved && <p className="rounded-xl border border-good/30 bg-good/10 px-4 py-2 text-sm text-good">ذخیره شد</p>}
      <button onClick={save} className="btn-primary px-6 py-3">
        ذخیره‌ی تنظیمات
      </button>
    </div>
  );
}
