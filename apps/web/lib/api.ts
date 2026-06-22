const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function token(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('accessToken') ?? '';
}
function refreshToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('refreshToken') ?? '';
}

/** ذخیره‌ی توکن‌ها پس از ورود/ثبت‌نام. */
export function saveTokens(accessToken: string, refresh?: string): void {
  localStorage.setItem('accessToken', accessToken);
  if (refresh) localStorage.setItem('refreshToken', refresh);
}
export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// تازه‌سازیِ توکنِ دسترسی (یک درخواست در لحظه؛ بقیه منتظرِ همان می‌مانند).
let refreshing: Promise<string> | null = null;
async function refreshAccess(): Promise<string> {
  const rt = refreshToken();
  if (!rt) throw new Error('no-refresh');
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) {
        clearTokens();
        throw new Error('refresh-failed');
      }
      const data = await res.json();
      saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

// fetchِ احرازشده با تازه‌سازیِ خودکار روی ۴۰۱.
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const make = (t: string) =>
    fetch(`${API_URL}${path}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${t}` } });
  let res = await make(token());
  if (res.status === 401 && refreshToken()) {
    try {
      res = await make(await refreshAccess());
    } catch {
      /* تازه‌سازی شکست خورد؛ همان ۴۰۱ برمی‌گردد */
    }
  }
  return res;
}

async function parse<T>(res: Response, errMsg: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? errMsg);
  }
  return res.json().catch(() => ({})) as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** POST عمومی (بدون احراز هویت) — برای ورود/ثبت‌نام. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
  return parse<T>(res, 'خطا در ارتباط با سرور');
}

/** GET احرازشده (پارامترِ token نادیده گرفته می‌شود؛ از localStorage + refresh). */
export async function apiGet<T>(path: string, _token?: string): Promise<T> {
  return parse<T>(await authedFetch(path), 'خطا در دریافت اطلاعات');
}

/** GET عمومی. */
export async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  return parse<T>(res, 'خطا در دریافت اطلاعات');
}

export async function authedGet<T>(path: string): Promise<T> {
  return parse<T>(await authedFetch(path), 'خطا در دریافت اطلاعات');
}

export async function authedPost<T>(path: string, body: unknown = {}): Promise<T> {
  return parse<T>(await authedFetch(path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) }), 'خطا در ارتباط با سرور');
}

export async function authedPut<T>(path: string, body: unknown = {}): Promise<T> {
  return parse<T>(await authedFetch(path, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(body) }), 'خطا در ارتباط با سرور');
}

export function isLoggedIn(): boolean {
  return token().length > 0;
}
