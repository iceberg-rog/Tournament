'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';

interface Me {
  displayName: string;
  email: string;
  role: string;
}

const NAV = [
  {
    group: 'اصلی',
    items: [
      { href: '/dashboard', label: 'داشبورد', icon: '🏠' },
      { href: '/tournaments', label: 'تورنومنت‌ها', icon: '🏆' },
      { href: '/tournaments/new', label: 'ساخت تورنومنت', icon: '➕' },
      { href: '/seasons', label: 'فصل‌ها', icon: '📅' },
      { href: '/spaces', label: 'کامیونیتی', icon: '💬' },
      { href: '/ladders', label: 'نردبان رتبه‌بندی', icon: '📈' },
    ],
  },
  {
    group: 'حساب',
    items: [
      { href: '/wallet', label: 'کیف پول', icon: '💳' },
      { href: '/notifications', label: 'اعلان‌ها', icon: '🔔' },
      { href: '/security', label: 'امنیت (۲FA)', icon: '🛡️' },
      { href: '/support', label: 'پشتیبانی', icon: '🎧' },
      { href: '/report', label: 'گزارش تخلف', icon: '🚩' },
    ],
  },
  {
    group: 'مدیریت',
    items: [
      { href: '/admin', label: 'کنسول مدیریت', icon: '📊' },
      { href: '/settings', label: 'تنظیمات', icon: '⚙️' },
    ],
  },
];

export default function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const token = localStorage.getItem('accessToken') ?? '';
    apiGet<Me>('/users/me', token)
      .then(setMe)
      .catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem('accessToken');
    router.push('/login');
  }

  const initials = (me?.displayName ?? '?').trim().charAt(0) || '?';

  const sidebar = (
    <>
      <a href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-lg shadow-indigo-600/30">
          🏆
        </span>
        <span className="text-lg font-extrabold tracking-tight">Tournament</span>
      </a>
      <nav className="space-y-5">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {g.group}
            </p>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href;
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-indigo-600/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{it.icon}</span>
                    <span>{it.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-l border-white/5 bg-slate-950/40 p-4 backdrop-blur md:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute right-0 top-0 h-full w-64 overflow-y-auto border-l border-white/5 bg-slate-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-slate-950/50 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm md:hidden"
              onClick={() => setOpen(true)}
              aria-label="منو"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold md:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <div className="flex items-center gap-2">
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-tight">{me.displayName}</p>
                  <p className="text-[11px] leading-tight text-slate-400">{me.role}</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">
                  {initials}
                </span>
              </div>
            )}
            <button onClick={logout} className="btn-ghost">
              خروج
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
