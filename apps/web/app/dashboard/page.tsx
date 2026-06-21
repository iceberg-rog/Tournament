'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

interface Me {
  id: string;
  email: string;
  displayName: string;
  role: string;
  wallet?: { balance: string; currency: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    apiGet<Me>('/users/me', token)
      .then(setUser)
      .catch(() => setError('نشست منقضی شده است'));
  }, [router]);

  function logout() {
    localStorage.removeItem('accessToken');
    router.push('/');
  }

  if (error) {
    return (
      <main className="p-8">
        {error} —{' '}
        <a href="/login" className="text-indigo-400">
          ورود مجدد
        </a>
      </main>
    );
  }

  if (!user) return <main className="p-8">در حال بارگذاری...</main>;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-2xl font-bold">داشبورد</h1>
      <div className="rounded-lg bg-slate-800 p-6">
        <p>
          سلام <b>{user.displayName}</b> 👋
        </p>
        <p className="mt-2 text-slate-400">{user.email}</p>
        <p className="mt-2 text-slate-400">نقش: {user.role}</p>
        {user.wallet && (
          <p className="mt-2 text-slate-400">
            کیف پول: {user.wallet.balance} {user.wallet.currency}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href="/tournaments" className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500">
          تورنومنت‌ها
        </a>
        <a href="/wallet" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          کیف پول
        </a>
        <a href="/notifications" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          اعلان‌ها
        </a>
        <a href="/security" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          امنیت (2FA)
        </a>
        <a href="/seasons" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          فصل‌ها
        </a>
        <a href="/spaces" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          کامیونیتی‌ها
        </a>
        <a href="/ladders" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          نردبان رتبه‌بندی
        </a>
        <a href="/support" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          پشتیبانی
        </a>
        <a href="/report" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          گزارش تخلف
        </a>
        <a href="/settings" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
          تنظیمات مدیریت
        </a>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-700 px-4 py-2 transition hover:bg-slate-800"
        >
          خروج
        </button>
      </div>
    </main>
  );
}
