'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

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
      const res = await apiPost<{ accessToken: string }>('/auth/register', form);
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="mb-6 text-2xl font-bold">ثبت‌نام</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          className="rounded-lg bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="نام نمایشی"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <input
          className="rounded-lg bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="ایمیل"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="rounded-lg bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="رمز عبور (حداقل ۸ کاراکتر)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-red-400">{error}</p>}
        <button
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-3 font-medium transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? '...' : 'ثبت‌نام'}
        </button>
      </form>
      <a href="/login" className="mt-4 text-center text-sm text-slate-400 hover:text-slate-200">
        حساب دارید؟ ورود
      </a>
    </main>
  );
}
