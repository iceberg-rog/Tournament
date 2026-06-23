'use client';

import { useMemo, useState } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { KYC_QUEUE, KYC_META, fmt, type KycStatus } from '@/lib/admin';

const STATUS_OPTIONS: { value: 'all' | KycStatus; label: string }[] = [
  { value: 'all', label: 'همه‌ی وضعیت‌ها' },
  { value: 'pending', label: KYC_META.pending.label },
  { value: 'verified', label: KYC_META.verified.label },
  { value: 'rejected', label: KYC_META.rejected.label },
  { value: 'not_started', label: KYC_META.not_started.label },
  { value: 'expired', label: KYC_META.expired.label },
];

const dateFa = (iso: string) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

const Ico = ({ name, size = 16 }: { name: 'search' | 'doc'; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {name === 'search' ? (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ) : (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    )}
  </svg>
);

export default function AdminKycPage() {
  const [rows, setRows] = useState(KYC_QUEUE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | KycStatus>('all');
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (q === '' || r.user.toLowerCase().includes(q)),
    );
  }, [rows, search, status]);

  const setStatusFor = (id: string, next: KycStatus) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));

  const approve = (id: string, user: string) => {
    if (!window.confirm(`احرازِ هویتِ «${user}» تأیید شود؟`)) return;
    setStatusFor(id, 'verified');
    setNote(`احرازِ هویتِ «${user}» تأیید شد.`);
  };

  const reject = (id: string, user: string) => {
    if (!window.confirm(`احرازِ هویتِ «${user}» رد شود؟`)) return;
    const reason = window.prompt('دلیلِ رد را وارد کنید:', '');
    if (reason === null) return;
    setStatusFor(id, 'rejected');
    setNote(`احرازِ هویتِ «${user}» رد شد${reason.trim() ? ` — دلیل: ${reason.trim()}` : ''}.`);
  };

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="احرازِ هویت"
          subtitle="صفِ بررسیِ مدارکِ احرازِ هویتِ کاربران."
          actions={
            <span className="chip border border-line bg-tile2 text-muted">
              <span className="tnum text-text">{fmt(rows.filter((r) => r.status === 'pending').length)}</span>
              در انتظارِ بررسی
            </span>
          }
        />

        <p className="rounded-xl border border-line bg-tile2 px-4 py-3 text-sm text-muted">
          برای برداشتِ جایزه، احرازِ هویتِ تأییدشده لازم است.
        </p>

        {note && (
          <div className="flex items-center gap-2 rounded-xl border border-good/30 bg-good/15 px-4 py-2.5 text-sm font-semibold text-good">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {note}
          </div>
        )}

        {/* فیلترها */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-tile p-4">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
              <Ico name="search" />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجوی کاربر…"
              className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-10 pl-3 text-sm outline-none transition placeholder:text-faint focus:border-line2"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | KycStatus)}
            className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-line2"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="ms-auto text-xs text-faint tnum">
            {fmt(filtered.length)} از {fmt(rows.length)}
          </span>
        </div>

        {/* لیست */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-tile p-12 text-center text-sm text-faint">
            موردی با این فیلتر نیست
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const m = KYC_META[r.status];
              const done = r.status === 'verified' || r.status === 'rejected';
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-tile p-5 sm:flex-row sm:items-center"
                >
                  {/* پیش‌نمایشِ مدرک */}
                  <div className="grid h-16 w-24 flex-none place-items-center gap-1 rounded-xl border border-dashed border-line2 bg-tile2 text-faint">
                    <Ico name="doc" size={20} />
                    <span className="text-[10px] font-semibold">مدرک</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold">{r.user}</p>
                    <p className="mt-0.5 text-xs text-faint">
                      ارسال‌شده: <span className="tnum">{dateFa(r.submitted)}</span>
                    </p>
                  </div>

                  <AdminBadge label={m.label} tone={m.tone} />

                  <div className="flex flex-none items-center gap-2">
                    <button
                      onClick={() => approve(r.id, r.user)}
                      disabled={r.status === 'verified'}
                      className="btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      تأیید
                    </button>
                    <button
                      onClick={() => reject(r.id, r.user)}
                      disabled={r.status === 'rejected'}
                      className="btn-ghost px-4 py-2 text-xs text-[#fca5a5] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      رد
                    </button>
                    {done && <span className="text-[11px] text-faint">بررسی‌شده</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
