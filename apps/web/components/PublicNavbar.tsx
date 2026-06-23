'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/tournaments', label: 'تورنومنت‌ها' },
  { href: '/games', label: 'دیسیپلین‌ها' },
  { href: '/ladders', label: 'رتبه‌بندی' },
  { href: '/register', label: 'برگزارکنندگان' },
  { href: '/#how', label: 'راهنما' },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = (href: string) => href.startsWith('/#') ? false : pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'border-b border-line bg-ink/85 shadow-[0_8px_30px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl' : 'border-b border-transparent bg-ink/30 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 md:px-6">
        {/* برند */}
        <Link href="/" className="flex flex-none items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_6px_18px_-8px_rgba(45,212,191,.6)]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg>
          </span>
          <span className="font-display text-[19px] font-bold tracking-[.14em]">SHELTER</span>
        </Link>

        {/* نویگیشنِ دسکتاپ */}
        <nav className="ms-4 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${active(n.href) ? 'bg-white/[.06] text-white' : 'text-muted hover:text-text'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* اکشن‌ها — سلسله‌مراتب: ساخت تورنومنت (ثانویه/outline) · ورود (متن) · ثبت‌نام (primary) */}
        <div className="ms-auto flex items-center gap-2">
          <Link href="/register" className="btn-ghost hidden px-3.5 py-2 text-sm md:inline-flex">همکاری با ما</Link>
          <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-text sm:block">ورود</Link>
          <Link href="/register" className="btn-primary px-4 py-2 text-sm">ثبت‌نام</Link>
          <button onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted md:hidden" aria-label="منو">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-2.5 text-sm ${active(n.href) ? 'bg-white/[.06] text-white' : 'text-muted'}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-muted">همکاری با ما</Link>
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm text-muted">ورود</Link>
          <Link href="/register" onClick={() => setOpen(false)} className="btn-primary mt-1 py-2.5 text-sm">ثبت‌نام</Link>
        </nav>
      )}
    </header>
  );
}
