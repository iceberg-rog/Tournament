'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { ADMIN_QUEUE, QUEUE_META, type QueueKind, fmt } from '@/lib/admin';

const PATHS: Record<string, ReactNode> = {
  trophy: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  inbox: <><path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /><path d="M4 13h5l1.5 2.5h3L19 13" /></>,
  ticket: <><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /></>,
  idcard: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16a3 3 0 0 1 6 0M14 9.5h4M14 13h3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
};
const Ico = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
);

// kindهای موجود در صف (به ترتیبِ ظهور، یکتا)
const KINDS = Array.from(new Set(ADMIN_QUEUE.map((q) => q.kind))) as QueueKind[];

export default function AdminQueuePage() {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | QueueKind>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ADMIN_QUEUE.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (urgentOnly && !item.urgent) return false;
      if (term) {
        const hay = `${item.title} ${item.meta} ${QUEUE_META[item.kind].label}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [q, kind, urgentOnly]);

  const urgentCount = ADMIN_QUEUE.filter((i) => i.urgent).length;
  const openCount = ADMIN_QUEUE.filter((i) => !done[i.id]).length;

  const resolve = (id: string, title: string) => {
    if (!window.confirm(`این مورد به‌عنوانِ «رسیدگی‌شده» علامت بخورد؟\n\n${title}`)) return;
    setDone((d) => ({ ...d, [id]: true }));
    setNote(`«${title}» به‌عنوانِ رسیدگی‌شده علامت خورد.`);
  };

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="صفِ اقدامات"
          subtitle="کارهایی که همین حالا نیازِ به تصمیمِ مدیر دارند — به ترتیبِ اولویت."
          actions={
            <>
              <span className="chip bg-bad/15 text-[#fca5a5]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> {fmt(urgentCount)} فوری
              </span>
              <span className="chip bg-tile2 text-muted">{fmt(openCount)} باز</span>
              <Link href="/admin" className="btn-ghost px-4 py-2 text-sm">داشبورد</Link>
            </>
          }
        />

        {note && (
          <div className="rounded-xl border border-good/30 bg-good/10 px-4 py-2.5 text-sm text-good">
            {note}
          </div>
        )}

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
                <Ico name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو در عنوان یا توضیح…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-10 pl-3 text-sm outline-none transition placeholder:text-faint focus:border-accent/40"
              />
            </div>

            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'all' | QueueKind)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none focus:border-accent/40"
            >
              <option value="all">همه‌ی انواع</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>{QUEUE_META[k].label}</option>
              ))}
            </select>

            <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
                className="h-4 w-4 accent-[#f87171]"
              />
              فقط فوری
            </label>
          </div>

          <p className="mt-3 text-xs text-faint tnum">{fmt(rows.length)} مورد از {fmt(ADMIN_QUEUE.length)}</p>
        </section>

        {/* لیستِ صف */}
        <section className="space-y-2.5">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-tile p-10 text-center text-sm text-faint">
              موردی با این فیلتر نیست
            </div>
          ) : (
            rows.map((item) => {
              const m = QUEUE_META[item.kind];
              const isDone = done[item.id];
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border border-line bg-tile p-4 transition hover:border-line2 ${isDone ? 'opacity-55' : ''}`}
                >
                  <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${item.urgent ? 'bg-bad/15 text-[#fca5a5]' : 'bg-accent/10 text-accent'}`}>
                    <Ico name={m.icon} size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      {item.urgent && <AdminBadge label="فوری" tone="bad" />}
                      {isDone && <AdminBadge label="رسیدگی‌شده" tone="good" />}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-faint">
                      <span className="text-muted">{m.label}</span> · {item.meta}
                    </p>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    {!isDone && (
                      <button onClick={() => resolve(item.id, item.title)} className="btn-ghost px-3 py-1.5 text-xs">
                        رسیدگی‌شد
                      </button>
                    )}
                    <Link href={m.href} className="btn-primary px-3.5 py-1.5 text-xs">بررسی</Link>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
