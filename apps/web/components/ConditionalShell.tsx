'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppShell from './AppShell';

// صفحاتِ عمومی بدون پوسته (هیرو/احراز هویتِ تمام‌صفحه)
const PUBLIC = ['/', '/login', '/register'];

export default function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC.includes(pathname)) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
