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
        <h1 className="mb-1 text-center text-2xl font-extrabold">ورود</h1>
        <p className="mb-6 text-center text-sm text-slate-400">به حسابت وارد شو</p>

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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            disabled={loading}
            className="mt-1 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-3 font-bold shadow-lg shadow-fuchsia-600/25 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '...' : 'ورود'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          یا
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <button onClick={oauthGoogle} className="btn-ghost w-full">
          🟢 ورود با گوگل
        </button>

        <p className="mt-5 text-center text-sm text-slate-400">
          حساب نداری؟{' '}
          <Link href="/register" className="text-fuchsia-300 hover:underline">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </main>
  );
}
