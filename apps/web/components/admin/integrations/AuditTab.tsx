'use client';

import { useCallback, useEffect, useState } from 'react';
import { authedGet } from '@/lib/api';
import type { IntegrationEnvironment } from '@/lib/integrations/types';

interface AuditRow {
  id: string;
  actor: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  createdAt: string;
}

const ftime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export function AuditTab({ env }: { env: IntegrationEnvironment }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authedGet<AuditRow[]>(`/integrations/${env}/audit`);
      const list = Array.isArray(data) ? data : [];
      // newest-first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'دریافتِ تاریخچه ناموفق بود.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [env]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      {/* head */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">تاریخچهٔ تغییرات</h2>
          <p className="mt-1 text-sm text-muted">
            هر ذخیره، تست و نمایشِ secret در محیطِ «{env}» اینجا ثبت می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && rows.length > 0 && (
            <span className="text-[11px] text-faint tnum">
              {rows.length.toLocaleString('fa-IR')} رویداد
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            تازه‌سازی
          </button>
        </div>
      </div>

      {/* error note */}
      {error && (
        <div className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-[#fca5a5]">
          {error}
        </div>
      )}

      {/* loading */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl border border-line bg-tile2/40"
            />
          ))}
        </div>
      ) : rows.length === 0 && !error ? (
        // empty
        <div className="rounded-2xl border border-line bg-tile p-10 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-line bg-tile2 text-faint">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <p className="text-sm text-muted">
            هنوز تغییری در تنظیمات ثبت نشده؛ پس از ذخیره/تست/نمایشِ secret اینجا می‌آید.
          </p>
        </div>
      ) : rows.length > 0 ? (
        // table
        <div className="overflow-hidden rounded-2xl border border-line bg-tile">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-faint">
                  <th className="px-4 py-3 text-start font-semibold">کاربر</th>
                  <th className="px-4 py-3 text-start font-semibold">عملیات</th>
                  <th className="px-4 py-3 text-start font-semibold">موجودیت</th>
                  <th className="px-4 py-3 text-start font-semibold">جزئیات</th>
                  <th className="px-4 py-3 text-start font-semibold">زمان</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-line/60 transition last:border-0 hover:bg-tile2/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-text">{r.actor}</div>
                      {r.actorRole && (
                        <div className="mt-0.5 text-[11px] text-faint">{r.actorRole}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="chip border border-line bg-tile2 font-mono text-[11px] text-muted">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono text-[11px] text-slate-300">
                        {r.entityType}
                        <span className="text-faint">:</span>
                        {r.entityId}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-muted">
                      {r.reason ? (
                        <span className="line-clamp-2">{r.reason}</span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-[12px] text-faint tnum">
                      {ftime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
