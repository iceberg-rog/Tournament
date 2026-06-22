import type { ReactNode } from 'react';
import Link from 'next/link';
import { PublicNavbar } from './PublicNavbar';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-faint md:px-6">
          <span className="font-display tracking-[.14em] text-muted">SHELTER</span>
          <span>پلتفرمِ برگزاریِ تورنومنت‌های گیمینگ</span>
          <div className="flex gap-4">
            <Link href="/tournaments" className="hover:text-accent">تورنومنت‌ها</Link>
            <Link href="/games" className="hover:text-accent">دیسیپلین‌ها</Link>
            <Link href="/login" className="hover:text-accent">ورود</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
