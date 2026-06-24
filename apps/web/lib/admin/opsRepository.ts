// قراردادِ ذخیره‌سازیِ عملیات — فرانت همیشه با همین interface کار می‌کند.
// پیش‌فرض: localStorage (mock-functional). با NEXT_PUBLIC_OPS_BACKEND=api به
// backend سوییچ می‌شود — بدونِ تغییرِ هیچ صفحه‌ای. این همان نقطه‌ی swap است.
'use client';

const KEY = (id: string, slice: string) => `shelter:ops:${id}:${slice}`;

export interface OpsRepository {
  readonly kind: 'local' | 'api';
  loadSlice<T>(tournamentId: string, slice: string, fallback: T): T | Promise<T>;
  saveSlice<T>(tournamentId: string, slice: string, data: T): void | Promise<void>;
}

/** پیاده‌سازیِ محلی (localStorage) — رفتارِ فعلی، refresh-safe، تک‌دستگاه. */
export const localOpsRepository: OpsRepository = {
  kind: 'local',
  loadSlice<T>(id: string, slice: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(KEY(id, slice));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  saveSlice<T>(id: string, slice: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(KEY(id, slice), JSON.stringify(data));
    } catch {
      /* quota — صرف‌نظر */
    }
  },
};

function token(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('accessToken') ?? '';
}
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * پیاده‌سازیِ backend — همان قرارداد، روی REST.
 * GET/PUT /tournaments/:id/ops/slice/:slice. در صورتِ خطا به fallback برمی‌گردد
 * تا UI نشکند (degrade-gracefully).
 */
export const apiOpsRepository: OpsRepository = {
  kind: 'api',
  async loadSlice<T>(id: string, slice: string, fallback: T): Promise<T> {
    try {
      const res = await fetch(`${API}/tournaments/${id}/ops/slice/${slice}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) return fallback;
      const rec = (await res.json()) as { data: T } | null;
      return rec && rec.data !== undefined ? rec.data : fallback;
    } catch {
      return fallback;
    }
  },
  async saveSlice<T>(id: string, slice: string, data: T): Promise<void> {
    try {
      await fetch(`${API}/tournaments/${id}/ops/slice/${slice}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ data }),
      });
    } catch {
      /* backend در دسترس نیست — UI با state محلی ادامه می‌دهد */
    }
  },
};

/** انتخابِ adapterِ فعال. پیش‌فرض local تا QAی FC26 دست‌نخورده بماند. */
export function getOpsRepository(): OpsRepository {
  return process.env.NEXT_PUBLIC_OPS_BACKEND === 'api' ? apiOpsRepository : localOpsRepository;
}
