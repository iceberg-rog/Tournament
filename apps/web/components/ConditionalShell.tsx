'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppShell from './AppShell';
import { PublicShell } from './PublicShell';
import { isLoggedIn } from '@/lib/api';

// صفحاتِ تمام‌صفحه‌ی عمومی (هیرو/احراز هویت) — بدونِ هیچ پوسته‌ای.
const PUBLIC = ['/', '/login', '/register'];

// صفحاتی که هم برای مهمان و هم کاربر قابل‌مشاهده‌اند:
// مهمان → پوسته‌ی عمومی (PublicShell)، کاربرِ لاگین‌کرده → داشبورد (AppShell).
const isViewable = (p: string) =>
  p === '/tournaments' || p.startsWith('/tournaments/') || p === '/games' || p.startsWith('/games/');

export default function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (PUBLIC.includes(pathname)) return <>{children}</>;

  if (isViewable(pathname)) {
    // SSR و اولین پینت = پوسته‌ی عمومی (پیش‌فرضِ امن، بدونِ پرشِ hydration).
    // پس از mount، اگر کاربر واقعاً لاگین بود → داشبورد.
    if (mounted && isLoggedIn()) return <AppShell>{children}</AppShell>;
    return <PublicShell>{children}</PublicShell>;
  }

  // بقیه‌ی مسیرها خصوصی‌اند (داشبورد، کیف‌پول، ادمین، …) و خودشان در نبودِ توکن به /login می‌روند.
  return <AppShell>{children}</AppShell>;
}
