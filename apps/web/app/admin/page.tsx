'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';
import { BarChart, Donut, RadialProgress } from '@/components/charts';

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

function Kpi({ label, value, icon, tint }: { label: string; value: string; icon: string; tint: string }) {
  return (
    <div className="card flex items-center justify-between p-5">
      <div className="min-w-0">
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{label}</p>
      </div>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${tint}`}>{icon}</span>
    </div>
  );
}

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
        <Link href="/login" className="text-fuchsia-300">
          وارد شوید
        </Link>
      </main>
    );

  const t = stats?.tournaments;
  const completionRate = t && t.total ? Math.round((t.completed / t.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-7">
      <h2 className="mb-6 text-2xl font-extrabold">کنسول مدیریت</h2>
      {error && <p className="mb-4 text-red-400">{error} — دسترسی مدیر لازم است.</p>}

      {/* KPI cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="کاربران" value={fmt(stats?.users ?? 0)} icon="👥" tint="bg-violet-400/15 text-violet-300" />
        <Kpi label="تورنومنت‌ها" value={fmt(t?.total ?? 0)} icon="🏆" tint="bg-fuchsia-400/15 text-fuchsia-300" />
        <Kpi label="درآمد (تومان)" value={fmt(stats?.payments.paidTotal ?? 0)} icon="💰" tint="bg-emerald-400/15 text-emerald-300" />
        <Kpi label="برداشت‌های در انتظار" value={fmt(stats?.pendingWithdrawals ?? 0)} icon="🏦" tint="bg-amber-400/15 text-amber-300" />
        <Kpi label="گزارش‌های باز" value={fmt(stats?.openReports ?? 0)} icon="🚩" tint="bg-red-400/15 text-red-300" />
        <Kpi label="تیکت‌های باز" value={fmt(stats?.openTickets ?? 0)} icon="🎫" tint="bg-amber-400/15 text-amber-300" />
        <Kpi label="پرداخت‌های موفق" value={fmt(stats?.payments.paidCount ?? 0)} icon="✅" tint="bg-teal-400/15 text-teal-300" />
        <Kpi label="در حال اجرا" value={fmt(t?.running ?? 0)} icon="🟢" tint="bg-emerald-400/15 text-emerald-300" />
      </section>

      {/* charts */}
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="card flex items-center gap-5 p-6">
          <Donut
            size={140}
            center={fmt(t?.total ?? 0)}
            segments={[
              { label: 'پیش‌نویس', value: t?.draft ?? 0, color: '#64748b' },
              { label: 'در حال اجرا', value: t?.running ?? 0, color: '#34d399' },
              { label: 'پایان‌یافته', value: t?.completed ?? 0, color: '#a78bfa' },
              { label: 'لغوشده', value: t?.cancelled ?? 0, color: '#f43f5e' },
            ]}
          />
          <div className="space-y-1.5 text-sm">
            <p className="mb-2 font-semibold text-slate-300">وضعیت تورنومنت‌ها</p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-slate-500" /> پیش‌نویس: {fmt(t?.draft ?? 0)}</p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-emerald-400" /> در حال اجرا: {fmt(t?.running ?? 0)}</p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-violet-400" /> پایان‌یافته: {fmt(t?.completed ?? 0)}</p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-rose-500" /> لغوشده: {fmt(t?.cancelled ?? 0)}</p>
          </div>
        </div>

        <div className="card p-6">
          <p className="mb-6 text-sm font-semibold text-slate-300">شمارشِ کلیدی</p>
          <BarChart
            height={140}
            data={[
              { label: 'کاربران', value: stats?.users ?? 0 },
              { label: 'تورنومنت', value: t?.total ?? 0 },
              { label: 'پرداخت', value: stats?.payments.paidCount ?? 0 },
              { label: 'تیکت', value: stats?.openTickets ?? 0 },
              { label: 'گزارش', value: stats?.openReports ?? 0 },
            ]}
          />
        </div>

        <div className="card flex flex-col items-center justify-center p-6">
          <p className="mb-3 self-start text-sm font-semibold text-slate-300">نرخ تکمیل تورنومنت‌ها</p>
          <RadialProgress value={completionRate} label="پایان‌یافته از کل" />
        </div>
      </section>

      {/* games */}
      <section className="mb-8">
        <h3 className="mb-3 font-bold">مدیریت بازی‌ها</h3>
        <div className="mb-3 flex gap-2">
          <input className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2" placeholder="slug" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })} />
          <input className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2" placeholder="نام بازی" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} />
          <button
            onClick={() => authedPost('/games', { slug: newGame.slug, name: newGame.name, platforms: [] }).then(load).catch((e) => setError(e.message))}
            className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-2 font-semibold"
          >
            افزودن
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {games.map((g) => (
            <span key={g.id} className="chip bg-white/5 text-slate-200">
              🎮 {g.name}
            </span>
          ))}
          {games.length === 0 && <span className="text-sm text-slate-400">بازی‌ای ثبت نشده.</span>}
        </div>
      </section>

      {/* users */}
      <section>
        <h3 className="mb-3 font-bold">کاربران و نقش‌ها ({fmt(users.length)})</h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="p-3 text-right">کاربر</th>
                <th className="p-3 text-right">نقش</th>
                <th className="p-3 text-right">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 50).map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="p-3">
                    {u.displayName}
                    <span className="block text-xs text-slate-500">{u.email}</span>
                  </td>
                  <td className="p-3">
                    <select
                      className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1"
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
                  <td className="p-3">
                    <select
                      className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1"
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
        </div>
      </section>
    </main>
  );
}
