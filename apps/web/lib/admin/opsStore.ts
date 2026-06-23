// persistِ سبکِ refresh-safe برای دادهٔ عملیاتیِ هر تورنومنت (چت، اسکجول، استریم).
// هر تب slice خودش را در localStorage نگه می‌دارد؛ بدونِ backend هم پایدار است.
'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = (id: string, slice: string) => `shelter:ops:${id}:${slice}`;

export function opsLoad<T>(id: string, slice: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(KEY(id, slice));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function opsSave<T>(id: string, slice: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY(id, slice), JSON.stringify(data));
  } catch {
    /* quota/serialization — بی‌خطر صرف‌نظر می‌کنیم */
  }
}

/** useState که از localStorage مقداردهیِ اولیه می‌شود و هر تغییر را persist می‌کند. */
export function useOpsSlice<T>(id: string, slice: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  // پس از mount از localStorage بخوان (SSR-safe؛ از mismatch جلوگیری می‌کند)
  useEffect(() => {
    setState(opsLoad(id, slice, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, slice]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        opsSave(id, slice, value);
        return value;
      });
    },
    [id, slice],
  );

  // قبل از hydration، fallback را برمی‌گردانیم تا server/client یکی باشد
  return [hydrated ? state : fallback, set];
}
