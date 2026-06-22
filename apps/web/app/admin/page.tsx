'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

/* ---- آیکن‌های خطی (بدون ایموجی) ---- */
const I: Record<string, ReactNode> = {
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></>,
  trophy: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></>,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  bank: <><path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18M12 3 3 8h18z" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  ticket: <><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 7v10" strokeDasharray="2 2" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4z" /></>,
  game: <><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></>,
  bars: <><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></>,
  donut: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></>,
  ring: <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 9 9" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
};
function Icon({ name, size = 15 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {I[name]}
    </svg>
  );
}

const TileHead = ({ icon, title, amber, action }: { icon: ReactNode; title: string; amber?: boolean; action?: ReactNode }) => (
  <div className="tile-head">
    <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
    <span className="tile-title">{title}</span>
    {action && <span className="ms-auto">{action}</span>}
  </div>
);

function KpiTile({ label, value, icon, amber }: { label: string; value: string; icon: ReactNode; amber?: boolean }) {
  return (
    <article className="tile">
      <TileHead icon={icon} title={label} amber={amber} />
      <div className="kpi-value tnum">{value}</div>
    </article>
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
      <div className="card p-8">
        <Link href="/login" className="text-accent">
          وارد شوید
        </Link>
      </div>
    );

  const t = stats?.tournaments;
  const completionRate = t && t.total ? Math.round((t.completed / t.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error} — دسترسی مدیر لازم است.</p>
      )}

      {/* KPI cards */}
      <section className="bento" aria-label="شاخص‌های کلیدی">
        <KpiTile label="کاربران" value={fmt(stats?.users ?? 0)} icon={<Icon name="users" />} />
        <KpiTile label="تورنومنت‌ها" value={fmt(t?.total ?? 0)} icon={<Icon name="trophy" />} amber />
        <KpiTile label="درآمد (تومان)" value={fmt(stats?.payments.paidTotal ?? 0)} icon={<Icon name="wallet" />} amber />
        <KpiTile label="برداشت‌های در انتظار" value={fmt(stats?.pendingWithdrawals ?? 0)} icon={<Icon name="bank" />} amber />
        <KpiTile label="گزارش‌های باز" value={fmt(stats?.openReports ?? 0)} icon={<Icon name="flag" />} />
        <KpiTile label="تیکت‌های باز" value={fmt(stats?.openTickets ?? 0)} icon={<Icon name="ticket" />} amber />
        <KpiTile label="پرداخت‌های موفق" value={fmt(stats?.payments.paidCount ?? 0)} icon={<Icon name="check" />} />
        <KpiTile label="در حال اجرا" value={fmt(t?.running ?? 0)} icon={<Icon name="play" />} />
      </section>

      {/* charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card flex items-center gap-5 p-6">
          <Donut
            size={140}
            center={fmt(t?.total ?? 0)}
            segments={[
              { label: 'پیش‌نویس', value: t?.draft ?? 0, color: '#64748b' },
              { label: 'در حال اجرا', value: t?.running ?? 0, color: '#34d399' },
              { label: 'پایان‌یافته', value: t?.completed ?? 0, color: '#2dd4bf' },
              { label: 'لغوشده', value: t?.cancelled ?? 0, color: '#f87171' },
            ]}
          />
          <div className="space-y-1.5 text-sm">
            <p className="mb-2 font-semibold text-muted">وضعیت تورنومنت‌ها</p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-slate-500" /> پیش‌نویس: <b className="num">{fmt(t?.draft ?? 0)}</b></p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-good" /> در حال اجرا: <b className="num">{fmt(t?.running ?? 0)}</b></p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-accent" /> پایان‌یافته: <b className="num">{fmt(t?.completed ?? 0)}</b></p>
            <p className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-bad" /> لغوشده: <b className="num">{fmt(t?.cancelled ?? 0)}</b></p>
          </div>
        </div>

        <div className="card p-6">
          <p className="mb-6 text-sm font-semibold text-muted">شمارشِ کلیدی</p>
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
          <p className="mb-3 self-start text-sm font-semibold text-muted">نرخ تکمیل تورنومنت‌ها</p>
          <RadialProgress value={completionRate} label="پایان‌یافته از کل" />
        </div>
      </section>

      {/* games */}
      <section className="card p-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <span className="tile-ic"><Icon name="game" /></span>
          مدیریت بازی‌ها
        </h3>
        <div className="mb-3 flex gap-2">
          <input className="w-32 rounded-xl border border-line bg-tile2 px-3 py-2" placeholder="slug" value={newGame.slug} onChange={(e) => setNewGame({ ...newGame, slug: e.target.value })} />
          <input className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2" placeholder="نام بازی" value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} />
          <button
            onClick={() => authedPost('/games', { slug: newGame.slug, name: newGame.name, platforms: [] }).then(load).catch((e) => setError(e.message))}
            className="btn-primary"
          >
            افزودن
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {games.map((g) => (
            <span key={g.id} className="chip bg-accent/15 text-[#5eead4]">
              <Icon name="game" size={13} /> {g.name}
            </span>
          ))}
          {games.length === 0 && <span className="text-sm text-muted">بازی‌ای ثبت نشده.</span>}
        </div>
      </section>

      {/* users */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <span className="tile-ic"><Icon name="list" /></span>
          کاربران و نقش‌ها ({fmt(users.length)})
        </h3>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-tile2 text-muted">
              <tr>
                <th className="p-3 text-right">کاربر</th>
                <th className="p-3 text-right">نقش</th>
                <th className="p-3 text-right">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 50).map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="p-3">
                    {u.displayName}
                    <span className="block text-xs text-faint">{u.email}</span>
                  </td>
                  <td className="p-3">
                    <select
                      className="rounded-lg border border-line bg-tile2 px-2 py-1"
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
                      className="rounded-lg border border-line bg-tile2 px-2 py-1"
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
    </div>
  );
}
