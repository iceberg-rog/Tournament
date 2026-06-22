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
    'rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/20';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-[110px]" />

      <div className="card relative z-10 w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl shadow-lg shadow-fuchsia-600/30">
            🏆
          </span>
          <span className="text-lg font-extrabold">
            شلتر <span className="text-fuchsia-400">تورنومنت</span>
          </span>
        </Link>
        <h1 className="mb-1 text-center text-2xl font-extrabold">ساخت حساب</h1>
        <p className="mb-6 text-center text-sm text-slate-400">چند ثانیه‌ای ثبت‌نام کن و شروع کن</p>

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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={loading}
            className="mt-1 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-3 font-bold shadow-lg shadow-fuchsia-600/25 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '...' : 'ثبت‌نام رایگان'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">
          حساب داری؟{' '}
          <Link href="/login" className="text-fuchsia-300 hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </main>
  );
}
