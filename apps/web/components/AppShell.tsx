'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiGet, authedGet, isLoggedIn } from '@/lib/api';

interface Me {
  displayName: string;
  email: string;
  role: string;
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

const NAV = [
  { href: '/dashboard', label: 'داشبورد', icon: '🏠' },
  { href: '/tournaments', label: 'تورنومنت‌ها', icon: '🏆' },
  { href: '/tournaments/new', label: 'ساخت تورنومنت', icon: '➕' },
  { href: '/ladders', label: 'نردبان رتبه‌بندی', icon: '📈' },
  { href: '/seasons', label: 'فصل‌ها', icon: '📅' },
  { href: '/spaces', label: 'کامیونیتی', icon: '💬' },
  { href: '/wallet', label: 'کیف پول', icon: '💳' },
  { href: '/support', label: 'تیکت‌ها', icon: '🎫' },
  { href: '/report', label: 'گزارش تخلف', icon: '🚩' },
  { href: '/security', label: 'امنیت', icon: '🛡️' },
  { href: '/admin', label: 'کنسول مدیریت', icon: '🛠️', admin: true },
  { href: '/settings', label: 'تنظیمات', icon: '⚙️', admin: true },
];

const ROLE_FA: Record<string, string> = {
  ADMIN: 'مدیر',
  MAIN_ADMIN: 'مدیر کل',
  REFEREE: 'داور',
  SUPPORT: 'پشتیبان',
  GAME_ADMIN: 'ادمین بازی',
  USER: 'کاربر',
};

export default function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const token = localStorage.getItem('accessToken') ?? '';
    apiGet<Me>('/users/me', token).then(setMe).catch(() => {});
    authedGet<{ available: number }>('/wallet').then((b) => setBalance(b.available)).catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem('accessToken');
    router.push('/login');
  }

  const isAdmin = me?.role === 'ADMIN' || me?.role === 'MAIN_ADMIN';
  const initials = (me?.displayName ?? '?').trim().charAt(0) || '?';
  const items = NAV.filter((n) => !n.admin || isAdmin);

  const Brand = (
    <a href="/dashboard" className="flex items-center gap-2.5 px-2">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl shadow-lg shadow-fuchsia-600/30">
        🏆
      </span>
      <span className="text-xl font-extrabold tracking-tight">شلتر</span>
    </a>
  );

  const navList = (
    <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <a
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
              active
                ? 'bg-gradient-to-l from-violet-600 to-fuchsia-500 font-semibold text-white shadow-lg shadow-fuchsia-600/30'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className="text-base">{it.icon}</span>
            <span>{it.label}</span>
          </a>
        );
      })}
      <button
        onClick={logout}
        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-red-300"
      >
        <span className="text-base">🚪</span>
        <span>خروج از حساب</span>
      </button>
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col">
      {Brand}
      {navList}
      <div className="mt-3 flex items-center gap-2 border-t border-white/5 px-2 pt-3">
        <a href="/" className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10" title="صفحه‌ی اصلی">🌐</a>
        <a href="/notifications" className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10" title="اعلان‌ها">🔔</a>
        <a href="/ladders" className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10" title="نردبان">📊</a>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-white/5 bg-slate-950/50 p-4 backdrop-blur-xl md:block">
        {sidebarInner}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute right-0 top-0 h-full w-64 border-l border-white/5 bg-slate-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-slate-950/40 px-4 py-3 backdrop-blur-xl md:px-7">
          {/* user card (right) */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-white/10 px-2.5 py-1.5 text-sm md:hidden"
              onClick={() => setOpen(true)}
              aria-label="منو"
            >
              ☰
            </button>
            {me && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/5 px-2 py-1.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold">
                  {initials}
                </span>
                <div className="hidden pl-1 leading-tight sm:block">
                  <p className="text-sm font-bold">{me.displayName}</p>
                  <span className="chip bg-amber-400/15 text-amber-300">👑 {ROLE_FA[me.role] ?? me.role}</span>
                </div>
              </div>
            )}
          </div>

          {title && <h1 className="mx-auto hidden text-base font-bold text-slate-200 sm:block">{title}</h1>}

          {/* wallet + bell (left) */}
          <div className="ms-auto flex items-center gap-2 sm:ms-0">
            <a
              href="/wallet"
              className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
            >
              <span className="text-slate-400">💳</span>
              <span className="font-semibold">{balance !== null ? fmt(balance) : '—'}</span>
              <span className="text-xs text-slate-400">تومان</span>
            </a>
            <a
              href="/notifications"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/5 bg-white/5 transition hover:bg-white/10"
              title="اعلان‌ها"
            >
              🔔
            </a>
          </div>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
