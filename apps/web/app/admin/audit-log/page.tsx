'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AUDIT_LOG, fmt, type Tone } from '@/lib/admin';

const Ico = ({ name, size = 16 }: { name: 'search' | 'download' | 'shield' | 'tag'; size?: number }) => {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    download: <><path d="M12 3v12" /><path d="m7 11 5 4 5-4" /><path d="M5 21h14" /></>,
    shield: <path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" />,
    tag: <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// نگاشتِ نوعِ موجودیت به برچسبِ فارسی + رنگ (برای ستونِ موجودیت).
const ENTITY_FA: Record<string, string> = {
  match: 'مسابقه',
  tournament: 'تورنومنت',
  user: 'کاربر',
  payout: 'پرداخت',
  organizer_request: 'درخواستِ برگزارکننده',
};
const ENTITY_TONE: Record<string, Tone> = {
  match: 'accent',
  tournament: 'accent',
  user: 'gold',
  payout: 'good',
  organizer_request: 'gold',
};

const ROLE_FA: Record<string, string> = {
  ADMIN: 'مدیرِ سیستم',
  MAIN_ADMIN: 'مدیرِ کل',
  REFEREE: 'داور',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }) +
  ' · ' +
  new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

export default function AuditLogPage() {
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('all');
  const [note, setNote] = useState('');

  // انواعِ موجودیتِ متمایز — مستقیماً از داده استخراج می‌شوند.
  const entityTypes = useMemo(
    () => Array.from(new Set(AUDIT_LOG.map((e) => e.entityType))),
    [],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return AUDIT_LOG.filter((e) => {
      if (entity !== 'all' && e.entityType !== entity) return false;
      if (!term) return true;
      return (
        e.actor.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.entityType.toLowerCase().includes(term) ||
        e.entityId.toLowerCase().includes(term)
      );
    });
  }, [q, entity]);

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="گزارشِ ممیزی"
          subtitle="همه‌ی اقدام‌های حساس ثبت می‌شوند."
          actions={
            <button
              type="button"
              onClick={() => setNote('به‌زودی')}
              className="btn-ghost px-4 py-2 text-sm"
            >
              <Ico name="download" />
              خروجیِ CSV
            </button>
          }
        />

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-faint">
                <Ico name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو بر اساسِ عامل، اقدام یا موجودیت…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-10 pl-3 text-sm outline-none transition placeholder:text-faint focus:border-accent/50"
              />
            </div>

            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-accent/50"
            >
              <option value="all">همه‌ی موجودیت‌ها</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {ENTITY_FA[t] ?? t}
                </option>
              ))}
            </select>

            <span className="chip bg-tile2 text-muted">
              <Ico name="shield" size={13} />
              {fmt(rows.length)} رویداد
            </span>

            {note && (
              <span className="chip border border-accent/30 bg-accent/15 text-[#5eead4]">
                {note}
              </span>
            )}
          </div>

          {/* جدول */}
          {rows.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-line bg-tile2 py-14 text-center">
              <p className="text-sm text-faint">موردی با این فیلتر نیست</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-xs text-faint">
                    <th className="px-4 py-3 font-semibold">عامل</th>
                    <th className="px-4 py-3 font-semibold">اقدام</th>
                    <th className="px-4 py-3 font-semibold">موجودیت</th>
                    <th className="px-4 py-3 font-semibold">دلیل</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-line transition last:border-0 hover:bg-white/[.03]"
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold">{e.actor}</p>
                        <p className="mt-0.5 text-[11px] text-faint">{ROLE_FA[e.actorRole] ?? e.actorRole}</p>
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-slate-200">{e.action}</td>
                      <td className="px-4 py-3 align-top">
                        <AdminBadge label={ENTITY_FA[e.entityType] ?? e.entityType} tone={ENTITY_TONE[e.entityType] ?? 'muted'} />
                        <p className="mt-1 font-display text-[11px] text-faint tnum">{e.entityId}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-muted">
                        {e.reason ? e.reason : <span className="text-faint">—</span>}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-faint tnum">{fmtDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
