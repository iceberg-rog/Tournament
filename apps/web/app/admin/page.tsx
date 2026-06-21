'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';

interface Stats {
  users: number;
  tournaments: { draft: number; running: number; completed: number; cancelled: number; total: number };
  payments: { paidCount: number; paidTotal: number };
  pendingWithdrawals: number;
  openReports: number;
  openTickets: number;
}
interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  accountStatus: string;
}
interface Game {
  id: string;
  slug: string;
  name: string;
}

const ROLES = ['USER', 'GAME_ADMIN', 'REFEREE', 'SUPPORT', 'MAIN_ADMIN', 'ADMIN'];
const fmt = (n: number) => n.toLocaleString('fa-IR');

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState({ slug: '', name: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setStats(await authedGet<Stats>('/admin/stats'));
      setUsers(await authedGet<AdminUser[]>('/admin/users'));
      setGames(await authedGet<Game[]>('/games'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }
  useEffect(() => {
    if (isLoggedIn()) load();
  }, []);

  if (!isLoggedIn())
    return (
      <main className="p-8">
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
      </main>
    );

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold">کنسول مدیریت</h1>
      {error && <p className="mb-3 text-red-400">{error} — دسترسی مدیر لازم است.</p>}

      {stats && (
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="کاربران" value={fmt(stats.users)} />
          <Stat label="تورنومنت‌ها" value={fmt(stats.tournaments.total)} />
          <Stat label="در حال اجرا" value={fmt(stats.tournaments.running)} />
          <Stat label="کامل‌شده" value={fmt(stats.tournaments.completed)} />
          <Stat label="درآمد پرداختی" value={`${fmt(stats.payments.paidTotal)} ﷼`} />
          <Stat label="برداشت‌های در انتظار" value={fmt(stats.pendingWithdrawals)} />
          <Stat label="گزارش‌های باز" value={fmt(stats.openReports)} />
          <Stat label="تیکت‌های باز" value={fmt(stats.openTickets)} />
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-bold">مدیریت بازی‌ها</h2>
        <div className="mb-3 flex gap-2">
          <input className="w-32 rounded-lg bg-slate-800 px-3 py-2" placeholder="slug" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })} />
          <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="نام بازی" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} />
          <button
            onClick={() => authedPost('/games', { slug: newGame.slug, name: newGame.name, platforms: [] }).then(load).catch((e) => setError(e.message))}
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
          >
            افزودن
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {games.map((g) => (
            <span key={g.id} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
              {g.name}
            </span>
          ))}
          {games.length === 0 && <span className="text-slate-400">بازی‌ای ثبت نشده.</span>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">کاربران و نقش‌ها</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="p-2 text-right">کاربر</th>
              <th className="p-2 text-right">نقش</th>
              <th className="p-2 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td className="p-2">
                  {u.displayName}
                  <span className="block text-xs text-slate-500">{u.email}</span>
                </td>
                <td className="p-2">
                  <select
                    className="rounded bg-slate-800 px-2 py-1"
                    value={u.role}
                    onChange={(e) => authedPost(`/admin/users/${u.id}/role`, { role: e.target.value }).then(load).catch((er) => setError(er.message))}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    className="rounded bg-slate-800 px-2 py-1"
                    value={u.accountStatus}
                    onChange={(e) => authedPost(`/admin/users/${u.id}/status`, { status: e.target.value }).then(load).catch((er) => setError(er.message))}
                  >
                    {['ACTIVE', 'SUSPENDED', 'BANNED'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
