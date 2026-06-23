'use client';

// مدیریتِ اختلاف‌های تورنومنت — هر اختلاف به یک مسابقه گره خورده است.
// اقدام‌ها (اختصاص به داور / حل / رد) state محلی را تغییر می‌دهند، toast و audit می‌نویسند.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { fmt, type Tone } from '@/lib/admin';
import { can } from '@/lib/admin/ops';
import { useAdminRole, useTournament, pushToast, appendAudit } from '@/lib/admin/store';
import { disputesFor, DISPUTE_FA, type Dispute, type DisputeStatus } from '@/lib/admin/fixtures';

const TONE: Record<DisputeStatus, Tone> = {
  open: 'bad',
  under_review: 'gold',
  resolved: 'good',
  rejected: 'muted',
};

type Filter = 'all' | DisputeStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'open', label: DISPUTE_FA.open },
  { key: 'under_review', label: DISPUTE_FA.under_review },
  { key: 'resolved', label: DISPUTE_FA.resolved },
  { key: 'rejected', label: DISPUTE_FA.rejected },
];

interface Row extends Dispute {
  assignee?: string;
  resolution?: string;
}

export default function DisputesPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();

  const [actorName, setActorName] = useState('مدیر سیستم');
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (isLoggedIn())
      apiGet<{ displayName: string }>('/users/me')
        .then((m) => m.displayName && setActorName(m.displayName))
        .catch(() => {});
  }, []);

  // مقداردهیِ اولیه از fixtureها (قطعی) — هر بار که تورنومنت عوض شد.
  useEffect(() => {
    if (t) setRows(disputesFor(t).map((d) => ({ ...d })));
  }, [t]);

  const canReview = t ? can(role, 'review_disputes') : false;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((d) => {
      if (filter !== 'all' && d.status !== filter) return false;
      if (q && !`${d.reporter} ${d.reason} ${d.matchId} ${d.assignee ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, search]);

  if (!t) return null;

  const openCount = rows.filter((d) => d.status === 'open' || d.status === 'under_review').length;

  function patch(dispId: string, p: Partial<Row>) {
    setRows((prev) => prev.map((d) => (d.id === dispId ? { ...d, ...p } : d)));
  }

  function audit(action: string, dispId: string, reason?: string) {
    appendAudit({ actor: actorName, actorRole: role, action, entityType: 'dispute', entityId: dispId, reason });
  }

  function assign(d: Row) {
    if (!canReview) return;
    const name = window.prompt('نامِ داورِ مسئول را وارد کنید:', d.assignee ?? '')?.trim();
    if (!name) return;
    patch(d.id, { status: 'under_review', assignee: name });
    pushToast({ kind: 'info', msg: `اختلاف به «${name}» اختصاص یافت` });
    audit('اختصاصِ اختلاف به داور', d.id, `داور: ${name}`);
  }

  function resolve(d: Row) {
    if (!canReview) return;
    if (!window.confirm('آیا از حلِ این اختلاف مطمئن هستید؟ این اقدام نتیجه را نهایی می‌کند.')) return;
    const resolution = window.prompt('شرحِ رأی/نتیجه‌ی نهایی را وارد کنید:', '')?.trim();
    if (!resolution) return;
    patch(d.id, { status: 'resolved', resolution });
    pushToast({ kind: 'success', msg: 'اختلاف حل شد' });
    audit('حلِ اختلاف', d.id, resolution);
  }

  function reject(d: Row) {
    if (!canReview) return;
    if (!window.confirm('این اختلاف رد شود؟ گزارش‌دهنده مطلع خواهد شد.')) return;
    const reason = window.prompt('دلیلِ رد (اختیاری):', '')?.trim() || undefined;
    patch(d.id, { status: 'rejected' });
    pushToast({ kind: 'info', msg: 'اختلاف رد شد' });
    audit('ردِ اختلاف', d.id, reason);
  }

  const noAccessTitle = 'دسترسی لازم را ندارید';
  const actionBtn =
    'rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-4">
      {/* section heading */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">مدیریتِ اختلاف‌ها</h2>
          <p className="mt-0.5 text-xs text-faint">
            {openCount > 0
              ? `${fmt(openCount)} اختلافِ باز — پیش از آزادسازیِ جایزه باید حل شوند.`
              : 'هیچ اختلافِ بازی وجود ندارد.'}
          </p>
        </div>
        {!canReview && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-tile2 px-2.5 py-1.5 text-[11px] text-faint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            فقط مشاهده — دسترسیِ بررسیِ اختلاف ندارید
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
            <div className="relative min-w-[200px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-faint">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3-3" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جست‌وجو: گزارش‌دهنده، دلیل، مسابقه…"
                className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    filter === f.key
                      ? 'border-accent-dim bg-accent/10 text-white'
                      : 'border-line text-muted hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>
          </div>

          {/* list */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-tile p-10 text-center">
              <p className="text-sm text-muted">اختلافی با این فیلتر پیدا نشد</p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
                className="btn-ghost mt-3 px-4 py-2 text-xs"
              >
                پاک‌کردنِ فیلترها
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((d) => {
                const done = d.status === 'resolved' || d.status === 'rejected';
                return (
                  <li key={d.id} className="rounded-2xl border border-line bg-tile p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <AdminBadge label={DISPUTE_FA[d.status]} tone={TONE[d.status]} dot={d.status === 'open'} />
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-tile2 px-2 py-0.5 text-[11px] text-muted">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M4 4v16" />
                              <path d="M4 4h12l-2 4 2 4H4" />
                            </svg>
                            مسابقه: <span className="tnum text-slate-200">{d.matchId}</span>
                          </span>
                          {d.assignee && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-[#5eead4]">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                              </svg>
                              داور: {d.assignee}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-200">
                          <span className="text-faint">گزارش‌دهنده: </span>
                          <span className="font-semibold">{d.reporter}</span>
                        </p>
                        <p className="text-sm text-muted">«{d.reason}»</p>
                        {d.resolution && (
                          <p className="rounded-lg border border-good/30 bg-good/5 px-3 py-2 text-xs text-good">
                            رأیِ نهایی: {d.resolution}
                          </p>
                        )}
                      </div>

                      {/* actions */}
                      <div className="flex flex-none flex-wrap items-center justify-end gap-1.5">
                        {done ? (
                          <span className="text-xs text-faint">رسیدگی‌شده</span>
                        ) : (
                          <>
                            <button
                              onClick={() => assign(d)}
                              disabled={!canReview}
                              title={canReview ? undefined : noAccessTitle}
                              className={`${actionBtn} border-line text-slate-200 hover:border-accent-dim hover:text-white`}
                            >
                              اختصاص به داور
                            </button>
                            <button
                              onClick={() => resolve(d)}
                              disabled={!canReview}
                              title={canReview ? undefined : noAccessTitle}
                              className={`${actionBtn} border-good/30 text-good hover:bg-good/10`}
                            >
                              حلِ اختلاف
                            </button>
                            <button
                              onClick={() => reject(d)}
                              disabled={!canReview}
                              title={canReview ? undefined : noAccessTitle}
                              className={`${actionBtn} border-bad/30 text-[#fca5a5] hover:bg-bad/10`}
                            >
                              رد
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* audit log for this tournament */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-accent">
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          گزارشِ عملیاتِ این تورنومنت
        </h3>
        <AuditLogList entityId={id} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-line bg-tile px-6 py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-tile2 text-good">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <p className="text-base font-bold">اختلافی ثبت نشده است</p>
      <p className="mt-1 max-w-sm text-xs text-faint">
        هر اختلافی که شرکت‌کننده‌ها روی نتیجه‌ی مسابقه‌ها ثبت کنند اینجا برای رسیدگی نمایش داده می‌شود.
      </p>
    </div>
  );
}
