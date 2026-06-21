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
      <button
        onClick={logout}
        className="mt-4 rounded-lg border border-slate-700 px-4 py-2 transition hover:bg-slate-800"
      >
        خروج
      </button>
    </main>
  );
}
