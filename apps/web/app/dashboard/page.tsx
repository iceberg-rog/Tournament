'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { apiGet, authedGet, publicGet, isLoggedIn } from '@/lib/api';

interface Me {
  displayName: string;
  email: string;
  role: string;
}
interface Balance {
  available: number;
  escrow: number;
}
interface T {
  id: string;
  title: string;
  status: string;
  game?: string;
  format: string;
}

const fmt = (n: number) => n.toLocaleString('fa-IR');
const statusFa: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  RUNNING: 'در حال اجرا',
  COMPLETED: 'پایان‌یافته',
  CANCELLED: 'لغوشده',
};
const statusColor: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300',
  RUNNING: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-indigo-500/20 text-indigo-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

function Stat({ icon, label, value, small }: { icon: string; label: string; value: string; small?: boolean }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{label}</p>
        <p className={`font-extrabold ${small ? 'text-base' : 'text-xl'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [bal, setBal] = useState<Balance | null>(null);
  const [tournaments, setTournaments] = useState<T[]>([]);
  const [unread, setUnread] = useState(0);
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
        setBal(await authedGet<Balance>('/wallet'));
      } catch {}
      try {
        setTournaments(await publicGet<T[]>('/tournaments'));
      } catch {}
      try {
        const n = await authedGet<{ read: boolean }[]>('/notifications');
        setUnread(n.filter((x) => !x.read).length);
      } catch {}
      setReady(true);
    })();
  }, [router]);

  const activeCount = tournaments.filter((t) => t.status === 'RUNNING').length;
  const isAdmin = me?.role === 'ADMIN' || me?.role === 'MAIN_ADMIN';

  const quick = [
    { href: '/tournaments/new', label: 'ساخت تورنومنت', icon: '➕', desc: 'wizard ۹ مرحله‌ای' },
    { href: '/wallet', label: 'کیف پول', icon: '💳', desc: 'شارژ، برداشت، KYC' },
    { href: '/tournaments', label: 'تورنومنت‌ها', icon: '🏆', desc: 'مرور و ثبت‌نام' },
    { href: '/ladders', label: 'نردبان رتبه‌بندی', icon: '📈', desc: 'matchmaking ELO' },
    ...(isAdmin ? [{ href: '/admin', label: 'کنسول مدیریت', icon: '📊', desc: 'کاربران، آمار، بازی‌ها' }] : []),
    { href: '/security', label: 'امنیت', icon: '🛡️', desc: 'فعال‌سازی ۲FA' },
  ];

  return (
    <AppShell title="داشبورد">
      <section className="card relative mb-6 overflow-hidden p-6">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">خوش آمدی</p>
            <h2 className="mt-1 text-2xl font-extrabold">{me?.displayName ?? '...'} 👋</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>{me?.email}</span>
              <span className="chip bg-indigo-500/15 text-indigo-300">{me?.role}</span>
            </div>
          </div>
          <a
            href="/wallet"
            className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-center shadow-lg shadow-indigo-600/25 transition hover:scale-[1.02]"
          >
            <p className="text-xs text-indigo-100/80">موجودی کیف پول</p>
            <p className="mt-1 text-2xl font-extrabold">
              {bal ? fmt(bal.available) : '—'} <span className="text-sm font-normal">﷼</span>
            </p>
            {bal && bal.escrow > 0 && (
              <p className="mt-1 text-[11px] text-indigo-100/70">مسدودی: {fmt(bal.escrow)} ﷼</p>
            )}
          </a>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="🏆" label="کل تورنومنت‌ها" value={fmt(tournaments.length)} />
        <Stat icon="🟢" label="در حال اجرا" value={fmt(activeCount)} />
        <Stat icon="🔔" label="اعلان نخوانده" value={fmt(unread)} />
        <Stat icon="🛡️" label="نقش" value={me?.role ?? '—'} small />
      </section>

      <h3 className="mb-3 text-sm font-semibold text-slate-400">دسترسی سریع</h3>
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {quick.map((q) => (
          <a
            key={q.href}
            href={q.href}
            className="card group flex items-center gap-3 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900/80"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl transition group-hover:bg-indigo-600/20">
              {q.icon}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{q.label}</p>
              <p className="truncate text-xs text-slate-400">{q.desc}</p>
            </div>
          </a>
        ))}
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400">تورنومنت‌های اخیر</h3>
        <a href="/tournaments" className="text-xs text-indigo-400 hover:underline">
          مشاهده‌ی همه
        </a>
      </div>
      <section className="card divide-y divide-white/5 overflow-hidden">
        {tournaments.slice(0, 6).map((t) => (
          <a
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5">🎮</span>
              <div className="min-w-0">
                <p className="truncate font-medium">{t.title}</p>
                <p className="truncate text-xs text-slate-400">
                  {t.game ?? '—'} · {t.format}
                </p>
              </div>
            </div>
            <span className={`chip shrink-0 ${statusColor[t.status] ?? 'bg-slate-500/20 text-slate-300'}`}>
              {statusFa[t.status] ?? t.status}
            </span>
          </a>
        ))}
        {ready && tournaments.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-400">
            هنوز تورنومنتی نیست.{' '}
            <a href="/tournaments/new" className="text-indigo-400">
              یکی بساز
            </a>
          </p>
        )}
      </section>
    </AppShell>
  );
}
