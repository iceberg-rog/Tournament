'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiGet, authedGet, isLoggedIn, clearTokens } from '@/lib/api';
import { ROLE_FA, canCreateTournament, dashboardLabel, navForGroup, roleGroup } from '@/lib/roles';
import { Toaster } from '@/components/admin/Toaster';

interface Me {
  displayName: string;
  email: string;
  role: string;
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

/* ---- آیکن‌های خطی (بدون ایموجی) ---- */
const PATHS: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  pad: <><rect x="2" y="6" width="20" height="12" rx="4" /><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /></>,
  trophy: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /><path d="M18 5h2a2 2 0 0 1 0 4M6 5H4a2 2 0 0 0 0 4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  bars: <path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" />,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  ticket: <><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 7v10" strokeDasharray="2 2" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  shield: <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />,
  tool: <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-1.4-1.4z" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  queue: <><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="11" height="4" rx="1" /></>,
  inbox: <><path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M4 13h5l1.5 2.5h3L19 13" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-3-5.2" /></>,
  idcard: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16a3 3 0 0 1 6 0M14 9.5h4M14 13h3" /></>,
  log: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  plug: <><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0z M12 16v6" /></>,
};
function Icon({ name, size = 17 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export default function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    apiGet<Me>('/users/me').then(setMe).catch(() => {});
    authedGet<{ available: number }>('/wallet').then((b) => setBalance(b.available)).catch(() => {});
  }, []);

  function logout() {
    clearTokens();
    router.push('/login');
  }

  const group = roleGroup(me?.role);
  const initials = (me?.displayName ?? '?').trim().charAt(0) || '?';
  const groups = navForGroup(group);
  const home = groups[0]?.items[0]?.href ?? '/dashboard';

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard' && href !== '/tournaments/new' && href !== '/admin' && pathname.startsWith(href + '/'));

  const sidebarInner = (
    <div className="flex h-full flex-col gap-5">
      {/* brand */}
      <a href={home} className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_6px_18px_-8px_rgba(45,212,191,.6)]">
          <Icon name="shield" size={19} />
        </span>
        <span>
          <span className="block font-display text-[19px] font-bold tracking-[.14em]">SHELTER</span>
          <span className="block text-[10px] uppercase tracking-[.2em] text-faint">سامانه‌ی برگزاری</span>
        </span>
      </a>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pe-1">
        {groups.map((g) => (
          <div key={g.label} className="mb-1">
            <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-faint">{g.label}</p>
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <a
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition ${
                    active
                      ? 'bg-[linear-gradient(270deg,rgba(45,212,191,.16),rgba(45,212,191,.03))] text-white shadow-[inset_-2px_0_0_#2dd4bf]'
                      : 'text-muted hover:bg-white/[.04] hover:text-white'
                  }`}
                >
                  <span className={active ? 'text-accent' : 'opacity-85'}>
                    <Icon name={it.icon} />
                  </span>
                  <span className="flex-1">{it.label}</span>
                  {it.soon && <span className="rounded bg-white/10 px-1.5 text-[9px] text-faint">به‌زودی</span>}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* org card */}
      <button onClick={logout} className="flex items-center gap-2.5 rounded-xl border border-line bg-white/[.02] p-2.5 text-right transition hover:border-bad/40" title="خروج از حساب">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[9px] bg-gradient-to-br from-gold to-gold-dim font-display text-sm font-bold text-[#2a1f02]">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-slate-100">{me?.displayName ?? '...'}</span>
          <span className="block text-[11px] text-faint">{me ? ROLE_FA[me.role] ?? me.role : '—'}</span>
        </span>
        <span className="text-faint"><Icon name="logout" size={15} /></span>
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1320px] gap-3.5 p-3.5 md:p-5">
      {/* sidebar (right in RTL) */}
      <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-[248px] flex-none rounded-[18px] border border-line bg-gradient-to-b from-tile2 to-tile p-4 shadow-[var(--shadow)] md:block">
        {sidebarInner}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute right-0 top-0 h-full w-[260px] border-s border-line bg-tile p-4" onClick={(e) => e.stopPropagation()}>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <header className="flex flex-wrap items-center gap-3">
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-tile text-muted md:hidden"
            onClick={() => setOpen(true)}
            aria-label="منو"
          >
            <Icon name="grid" size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-[clamp(18px,2.4vw,25px)] font-semibold">{title ?? `سلام، ${me?.displayName ?? '...'}`}</h1>
            <p className="mt-0.5 text-[12.5px] text-faint">SHELTER · {dashboardLabel(group)}</p>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-2.5">
            <a href="/wallet" className="flex items-center gap-2 rounded-xl border border-line bg-tile px-3 py-2 text-sm transition hover:border-accent-dim">
              <span className="text-muted"><Icon name="wallet" size={16} /></span>
              <span className="num font-semibold">{balance !== null ? fmt(balance) : '—'}</span>
              <span className="text-xs text-faint">تومان</span>
            </a>
            <a href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-tile text-muted transition hover:border-accent-dim hover:text-text" title="اعلان‌ها">
              <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full bg-gold shadow-[0_0_0_2px_#16181f]" />
              <Icon name="bell" size={18} />
            </a>
            {canCreateTournament(group) && (
              <a href="/tournaments/new" className="btn-primary">
                <Icon name="plus" size={16} />
                <span className="hidden sm:inline">تورنومنت جدید</span>
              </a>
            )}
          </div>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Toaster />
    </div>
  );
}
