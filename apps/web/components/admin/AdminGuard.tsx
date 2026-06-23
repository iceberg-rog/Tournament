'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { apiGet, isLoggedIn } from '@/lib/api';
import { roleGroup } from '@/lib/roles';

/** فقط مدیرانِ SHELTER اجازه‌ی دیدنِ محتوا را دارند؛ بقیه «دسترسی نداری». */
export function AdminGuard({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      setOk(false);
      return;
    }
    apiGet<{ role: string }>('/users/me')
      .then((m) => setOk(roleGroup(m.role) === 'admin'))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return <div className="py-20 text-center text-sm text-muted">در حال بارگذاری…</div>;
  if (!ok)
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="text-lg font-bold">دسترسی نداری</p>
          <p className="mt-1 text-sm text-faint">این بخش فقط برای مدیرانِ SHELTER است.</p>
          <Link href="/dashboard" className="btn-ghost mt-4 px-4 py-2 text-sm">بازگشت به داشبورد</Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
