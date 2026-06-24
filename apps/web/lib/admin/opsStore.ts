// هوکِ persistِ عملیات. پشتِ OpsRepository می‌نشیند: پیش‌فرض localStorage
// (mock-functional)، با NEXT_PUBLIC_OPS_BACKEND=api روی backend. صفحه‌ها بدونِ
// تغییر از useOpsSlice استفاده می‌کنند؛ adapter زیر آن عوض می‌شود.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOpsRepository, localOpsRepository } from './opsRepository';

// سازگاری به‌عقب: helperهای مستقیمِ localStorage (هرجا مستقیماً استفاده شده باشد).
export function opsLoad<T>(id: string, slice: string, fallback: T): T {
  return localOpsRepository.loadSlice(id, slice, fallback) as T;
}
export function opsSave<T>(id: string, slice: string, data: T): void {
  void localOpsRepository.saveSlice(id, slice, data);
}

/**
 * useState که از repositoryِ فعال مقداردهیِ اولیه می‌شود و هر تغییر را persist
 * می‌کند. قبل از hydration، fallback را برمی‌گرداند (SSR-safe + بدونِ mismatch).
 */
export function useOpsSlice<T>(id: string, slice: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    const repo = getOpsRepository();
    Promise.resolve(repo.loadSlice(id, slice, fallback)).then((value) => {
      if (!alive) return;
      // فقط اگر هنوز hydrate نشده مقدارِ بارگذاری‌شده را می‌نشانیم تا یک mutationِ
      // کاربر در پنجره‌ی ریزِ پیش از hydration بازنویسی نشود.
      setHydrated((h) => {
        if (!h) setState(value);
        return true;
      });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, slice]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        void getOpsRepository().saveSlice(id, slice, value);
        return value;
      });
    },
    [id, slice],
  );

  return [hydrated ? state : fallback, set];
}
