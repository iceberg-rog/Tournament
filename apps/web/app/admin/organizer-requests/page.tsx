'use client';

import { useMemo, useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  ORGANIZER_REQUESTS,
  ORG_REQ_META,
  fmt,
  type OrganizerRequest,
  type OrganizerRequestStatus,
} from '@/lib/admin';

const STATUS_OPTIONS: { value: 'all' | OrganizerRequestStatus; label: string }[] = [
  { value: 'all', label: 'همه‌ی وضعیت‌ها' },
  { value: 'submitted', label: ORG_REQ_META.submitted.label },
  { value: 'under_review', label: ORG_REQ_META.under_review.label },
  { value: 'approved', label: ORG_REQ_META.approved.label },
  { value: 'rejected', label: ORG_REQ_META.rejected.label },
];

const Ico = ({ name, size = 16 }: { name: 'org' | 'mail' | 'star' | 'note'; size?: number }) => {
  const paths = {
    org: <><path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 21v-9h4a1 1 0 0 1 1 1v8" /><path d="M8 8h2M8 12h2M8 16h2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    star: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z" />,
    note: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  } as const;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
  );
};

export default function OrganizerRequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | OrganizerRequestStatus>('all');
  const [statuses, setStatuses] = useState<Record<string, OrganizerRequestStatus>>(
    () => Object.fromEntries(ORGANIZER_REQUESTS.map((r) => [r.id, r.status])),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});

  const setNote = (id: string, text: string) => setNotes((n) => ({ ...n, [id]: text }));

  const approve = (r: OrganizerRequest) => {
    if (!window.confirm(`برگزارکننده‌ی «${r.org}» تأیید شود؟`)) return;
    setStatuses((s) => ({ ...s, [r.id]: 'approved' }));
    setNote(r.id, `برگزارکننده تأیید شد — پنل برای «${r.org}» فعال شد.`);
  };

  const reject = (r: OrganizerRequest) => {
    if (!window.confirm(`درخواستِ «${r.org}» رد شود؟`)) return;
    const reason = window.prompt('دلیلِ رد را وارد کنید:', '');
    if (reason === null) return;
    setStatuses((s) => ({ ...s, [r.id]: 'rejected' }));
    setNote(r.id, reason.trim() ? `رد شد — دلیل: ${reason.trim()}` : 'درخواست رد شد.');
  };

  const requestInfo = (r: OrganizerRequest) => {
    setStatuses((s) => ({ ...s, [r.id]: 'under_review' }));
    setNote(r.id, 'درخواستِ اطلاعاتِ تکمیلی برای متقاضی ارسال شد.');
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ORGANIZER_REQUESTS.filter((r) => {
      const cur = statuses[r.id];
      if (status !== 'all' && cur !== status) return false;
      if (q && !`${r.org} ${r.contact} ${r.reason}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, status, statuses]);

  const pendingCount = useMemo(
    () => Object.values(statuses).filter((s) => s === 'submitted' || s === 'under_review').length,
    [statuses],
  );

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="درخواست‌های برگزارکننده"
          subtitle="صفِ بررسیِ متقاضیانِ پنلِ برگزاری — تأیید، رد یا درخواستِ اطلاعاتِ تکمیلی."
          actions={
            <span className="chip border border-line bg-tile2 text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {fmt(pendingCount)} در انتظارِ بررسی
            </span>
          }
        />

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جست‌وجو در نام، تماس یا دلیل…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-10 pl-3 text-sm outline-none transition placeholder:text-faint focus:border-accent/40"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | OrganizerRequestStatus)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="text-xs text-faint tnum">{fmt(rows.length)} مورد</span>
          </div>
        </section>

        {/* لیست */}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-line bg-tile p-12 text-center">
            <p className="text-sm text-muted">موردی با این فیلتر نیست</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => {
              const cur = statuses[r.id];
              const meta = ORG_REQ_META[cur];
              const note = notes[r.id];
              const settled = cur === 'approved' || cur === 'rejected';
              return (
                <section key={r.id} className="rounded-2xl border border-line bg-tile p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
                        <Ico name="org" size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold">{r.org}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                          <Ico name="mail" size={13} />
                          <span className="truncate">{r.contact}</span>
                        </p>
                      </div>
                    </div>
                    <AdminBadge label={meta.label} tone={meta.tone} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-line bg-tile2 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-faint">
                        <Ico name="note" size={13} /> دلیلِ درخواست
                      </p>
                      <p className="text-sm leading-6 text-slate-200">{r.reason}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-tile2 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-faint">
                        <Ico name="star" size={13} /> سابقه
                      </p>
                      <p className="text-sm leading-6 text-slate-200">{r.experience}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => approve(r)}
                      disabled={cur === 'approved'}
                      className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      تأیید
                    </button>
                    <button
                      onClick={() => reject(r)}
                      disabled={cur === 'rejected'}
                      className="btn-ghost px-4 py-2 text-sm text-[#fca5a5] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      رد
                    </button>
                    <button
                      onClick={() => requestInfo(r)}
                      disabled={settled}
                      className="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      درخواستِ اطلاعات
                    </button>

                    {note && (
                      <span className={`chip mr-auto border ${cur === 'rejected' ? 'border-bad/30 bg-bad/15 text-[#fca5a5]' : cur === 'approved' ? 'border-good/30 bg-good/15 text-good' : 'border-accent/30 bg-accent/15 text-[#5eead4]'}`}>
                        {note}
                      </span>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
