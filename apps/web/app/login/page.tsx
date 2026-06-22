'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, saveTokens } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = form.code ? form : { email: form.email, password: form.password };
      const res = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/login', body);
      saveTokens(res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  }

  async function oauthGoogle() {
    setError('');
    const email = window.prompt('ایمیل حساب گوگل (حالت آزمایشی):');
    if (!email) return;
    try {
      const res = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/oauth/google', { email });
      saveTokens(res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    }
  }

  const field =
    'rounded-xl border border-line bg-tile2 px-4 py-3 text-text placeholder:text-faint outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-accent/20 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-gold/15 blur-[110px]" />

      <div className="card relative z-10 w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_6px_18px_-8px_rgba(45,212,191,.6)]">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
            </svg>
          </span>
          <span>
            <span className="block font-display text-lg font-bold tracking-[.14em]">SHELTER</span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-faint">سامانه‌ی برگزاری</span>
          </span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-extrabold">ورود</h1>
        <p className="mb-6 text-center text-sm text-muted">به حسابت وارد شو</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="ایمیل"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={field}
            placeholder="رمز عبور"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            className={field}
            placeholder="کد دومرحله‌ای (در صورت فعال‌بودن)"
            inputMode="numeric"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          {error && <p className="text-sm text-bad">{error}</p>}
          <button disabled={loading} className="btn-primary mt-1 w-full disabled:opacity-50">
            {loading ? '...' : 'ورود'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-faint">
          <span className="h-px flex-1 bg-line" />
          یا
          <span className="h-px flex-1 bg-line" />
        </div>
        <button onClick={oauthGoogle} className="btn-ghost w-full">
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
          </svg>
          ورود با گوگل
        </button>

        <p className="mt-5 text-center text-sm text-muted">
          حساب نداری؟{' '}
          <Link href="/register" className="text-accent hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </main>
  );
}
