'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { apiGet, authedGet, publicGet, isLoggedIn } from '@/lib/api';

interface Me {
  id: string;
  displayName: string;
  email: string;
  role: string;
}
interface T {
  id: string;
  title: string;
  status: string;
  game?: string;
  format: string;
  participants?: { id: string }[];
}

const fmt = (n: number) => n.toLocaleString('fa-IR');
const formatFa: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی',
  DOUBLE_ELIM: 'دوحذفی',
  ROUND_ROBIN: 'دوره‌ای',
  SWISS: 'سوئیسی',
  FFA: 'Battle Royale',
};
const statusFa: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  RUNNING: 'در حال اجرا',
  COMPLETED: 'پایان‌یافته',
  CANCELLED: 'لغوشده',
};
const statusChip: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300',
  RUNNING: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-violet-500/20 text-violet-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

function StatCard({ value, label, icon, tint }: { value: string; label: string; icon: string; tint: string }) {
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

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<T[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('accessToken') ?? '';
    (async () => {
      try {
        setMe(await apiGet<Me>('/users/me', token));
      } catch {}
      try {
        setBalance((await authedGet<{ available: number }>('/wallet')).available);
      } catch {}
      try {
        setTournaments(await publicGet<T[]>('/tournaments'));
      } catch {}
      try {
        const tk = await authedGet<{ status: string }[]>('/tickets');
        setOpenTickets(tk.filter((t) => t.status !== 'CLOSED').length);
      } catch {}
      setReady(true);
    })();
  }, [router]);

  const running = tournaments.filter((t) => t.status === 'RUNNING').length;
  const mine = me ? tournaments.filter((t) => t.participants?.some((p) => p.id === me.id)) : [];
  const myList = (mine.length ? mine : tournaments).slice(0, 6);

  return (
    <AppShell title="داشبورد">
      <h2 className="mb-6 text-center text-2xl font-extrabold">
        به شلتر تورنومنت خوش آمدید! <span className="align-middle">👋</span>
      </h2>

      {/* stat cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={fmt(openTickets)} label="تیکت باز" icon="🎫" tint="bg-amber-400/15 text-amber-300" />
        <StatCard value={fmt(running)} label="تورنومنت‌های فعال" icon="🟢" tint="bg-emerald-400/15 text-emerald-300" />
        <StatCard
          value={`${balance !== null ? fmt(balance) : '—'}`}
          label="موجودی کیف پول (تومان)"
          icon="💳"
          tint="bg-teal-400/15 text-teal-300"
        />
        <StatCard value={fmt(tournaments.length)} label="کل تورنومنت‌ها" icon="🏆" tint="bg-violet-400/15 text-violet-300" />
      </section>

      {/* promo banner */}
      <section className="card relative mb-8 overflow-hidden bg-gradient-to-l from-violet-700/50 via-fuchsia-700/30 to-slate-900/40 p-6">
        <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/10 text-4xl backdrop-blur">
            🏆
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-2 text-xl font-extrabold">
              تورنومنت بساز، آنی شروع کن <span>⚡</span>
            </h3>
            <p className="mt-1 max-w-lg text-sm text-slate-300">
              ۵ فرمت حرفه‌ای، جایزه‌ی نقدی با escrow، چت و استریم زنده. با wizard چندمرحله‌ای چند ثانیه‌ای بساز.
            </p>
          </div>
          <a
            href="/tournaments/new"
            className="rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-6 py-3 font-semibold shadow-lg shadow-fuchsia-600/30 transition hover:opacity-90"
          >
            ➕ ساخت تورنومنت
          </a>
        </div>
      </section>

      {/* my tournaments */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span>🏆</span> {mine.length ? 'تورنومنت‌های من' : 'تورنومنت‌های اخیر'}
        </h3>
        <a
          href="/tournaments/new"
          className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/5"
        >
          + تورنومنت جدید
        </a>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {myList.map((t) => (
          <a
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="card p-5 transition hover:border-fuchsia-500/30 hover:bg-slate-900/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-lg font-bold">{t.title}</h4>
                <p className="mt-0.5 text-xs text-slate-400">{t.game ?? 'بدون بازی'}</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/5 text-xl">🎮</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span>🎯 {formatFa[t.format] ?? t.format}</span>
              <span>👥 {fmt(t.participants?.length ?? 0)} شرکت‌کننده</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`chip ${statusChip[t.status] ?? 'bg-slate-500/20 text-slate-300'}`}>
                <span className="text-[8px]">●</span> {statusFa[t.status] ?? t.status}
              </span>
              <span className="text-sm text-fuchsia-300">مشاهده ←</span>
            </div>
          </a>
        ))}
        {ready && tournaments.length === 0 && (
          <div className="card col-span-full p-10 text-center text-slate-400">
            هنوز تورنومنتی نیست.{' '}
            <a href="/tournaments/new" className="text-fuchsia-300">
              اولین تورنومنت را بساز
            </a>
          </div>
        )}
      </section>
    </AppShell>
  );
}
