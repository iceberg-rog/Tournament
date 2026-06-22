'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, saveTokens } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiPost<{ accessToken: string; refreshToken: string }>('/auth/register', form);
      saveTokens(res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
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
          <span className="font-display text-lg font-extrabold tracking-[.14em]">
            SHELTER <span className="text-accent">تورنومنت</span>
          </span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-extrabold">ساخت حساب</h1>
        <p className="mb-6 text-center text-sm text-muted">چند ثانیه‌ای ثبت‌نام کن و شروع کن</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            className={field}
            placeholder="نام نمایشی"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <input
            className={field}
            placeholder="ایمیل"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={field}
            placeholder="رمز عبور (حداقل ۸ کاراکتر)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-bad">{error}</p>}
          <button disabled={loading} className="btn-primary mt-1 w-full py-3 disabled:opacity-50">
            {loading ? '...' : 'ثبت‌نام رایگان'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          حساب داری؟{' '}
          <Link href="/login" className="text-accent hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </main>
  );
}
