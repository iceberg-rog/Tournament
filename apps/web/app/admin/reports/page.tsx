'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  REPORTS,
  REPORT_CAT_FA,
  REPORT_STATUS_META,
  fmt,
  type ReportCategory,
  type ReportItem,
  type ReportStatus,
} from '@/lib/admin';

// ───────── آیکن‌های خطی (بدونِ emoji) ─────────
const PATHS: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  warn: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  remove: <><circle cx="9" cy="8" r="4" /><path d="M3 21a6 6 0 0 1 11 0M16 11h6" /></>,
  refund: <><path d="M3 7h13a4 4 0 0 1 0 8H8" /><path d="m7 3-4 4 4 4" /></>,
  doc: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
};
const Ico = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
);

// ترتیبِ نمایشِ وضعیت‌ها در فیلتر
const STATUS_ORDER: ReportStatus[] = ['new', 'under_review', 'needs_info', 'action_taken', 'rejected', 'closed'];
const CAT_ORDER: ReportCategory[] = ['cheating', 'harassment', 'no_show', 'fake_result', 'payment_issue', 'smurfing', 'other'];

// اقدام‌های مدیریتی روی هر گزارش
type ActionDef = { key: string; label: string; icon: string; tone: 'ghost' | 'bad' | 'gold'; next: ReportStatus; confirm?: string; note: string };
const ACTIONS: ActionDef[] = [
  { key: 'warn', label: 'اخطار', icon: 'warn', tone: 'gold', next: 'action_taken', confirm: 'به این کاربر اخطار داده شود؟', note: 'اخطار ثبت شد' },
  { key: 'suspend', label: 'تعلیقِ کاربر', icon: 'pause', tone: 'bad', next: 'action_taken', confirm: 'این کاربر تعلیق شود؟ این اقدام حساس است.', note: 'کاربر تعلیق شد' },
  { key: 'kick', label: 'حذفِ شرکت‌کننده', icon: 'remove', tone: 'bad', next: 'action_taken', confirm: 'شرکت‌کننده از تورنومنت حذف شود؟', note: 'شرکت‌کننده حذف شد' },
  { key: 'refund', label: 'بازپرداخت', icon: 'refund', tone: 'gold', next: 'action_taken', confirm: 'مبلغِ ورودیِ این کاربر بازپرداخت شود؟', note: 'بازپرداخت انجام شد' },
  { key: 'info', label: 'درخواستِ مدرک', icon: 'doc', tone: 'ghost', next: 'needs_info', note: 'درخواستِ مدرک ارسال شد' },
  { key: 'close', label: 'بستن', icon: 'close', tone: 'ghost', next: 'closed', confirm: 'این گزارش بسته شود؟', note: 'گزارش بسته شد' },
];

const TONE_FALLBACK = REPORT_STATUS_META.new.tone;

export default function ReportsModerationPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [cat, setCat] = useState<ReportCategory | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  // وضعیتِ محلیِ هر گزارش (mock — به‌جای فراخوانیِ API)
  const [localStatus, setLocalStatus] = useState<Record<string, ReportStatus>>(
    () => Object.fromEntries(REPORTS.map((r) => [r.id, r.status])),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});

  const statusOf = (r: ReportItem) => localStatus[r.id] ?? r.status;

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('fa-IR');
    return REPORTS.filter((r) => {
      if (status !== 'all' && statusOf(r) !== status) return false;
      if (cat !== 'all' && r.category !== cat) return false;
      if (!needle) return true;
      return [r.reporter, r.reported, r.tournament]
        .some((f) => f.toLocaleLowerCase('fa-IR').includes(needle));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, cat, localStatus]);

  const openCount = REPORTS.filter((r) => !['closed', 'rejected', 'action_taken'].includes(statusOf(r))).length;

  function applyAction(r: ReportItem, a: ActionDef) {
    if (a.confirm && !window.confirm(`«${a.label}» — ${a.confirm}`)) return;
    setLocalStatus((s) => ({ ...s, [r.id]: a.next }));
    setNotes((n) => ({ ...n, [r.id]: a.note }));
  }

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="گزارش‌های تخلف"
          subtitle="صفِ نظارت — بررسیِ گزارش‌های کاربران و اعمالِ اقدامِ انضباطی."
          actions={
            <span className="chip border border-line bg-tile2 text-muted">
              <Ico name="flag" size={13} />
              <span className="tnum">{fmt(openCount)}</span> بازِ در دستِ بررسی
            </span>
          }
        />

        {/* راهنمای دسته‌بندی‌ها */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <p className="mb-3 text-xs font-semibold text-muted">راهنمای دسته‌بندی</p>
          <div className="flex flex-wrap gap-2">
            {CAT_ORDER.map((c) => (
              <span key={c} className="chip border border-line bg-tile2 text-xs text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                <span className="font-semibold text-slate-200">{REPORT_CAT_FA[c]}</span>
                <span className="text-faint/70">·</span>
                <span dir="ltr" className="tnum text-faint">{c}</span>
              </span>
            ))}
          </div>
        </section>

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
                <Ico name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو در گزارش‌دهنده، متهم یا تورنومنت…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-accent/40"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportStatus | 'all')}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-accent/40"
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{REPORT_STATUS_META[s].label}</option>
              ))}
            </select>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as ReportCategory | 'all')}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-accent/40"
            >
              <option value="all">همه‌ی دسته‌ها</option>
              {CAT_ORDER.map((c) => (
                <option key={c} value={c}>{REPORT_CAT_FA[c]}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-faint">
            <span className="tnum text-slate-300">{fmt(filtered.length)}</span> گزارش از مجموعِ <span className="tnum">{fmt(REPORTS.length)}</span>
          </p>
        </section>

        {/* لیستِ گزارش‌ها */}
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-tile py-16 text-center">
              <Ico name="flag" size={26} />
              <p className="mt-3 text-sm font-semibold text-muted">موردی با این فیلتر نیست</p>
              <p className="mt-1 text-xs text-faint">فیلترها را تغییر دهید یا جست‌وجو را پاک کنید.</p>
            </div>
          ) : (
            filtered.map((r) => {
              const st = statusOf(r);
              const meta = REPORT_STATUS_META[st] ?? { label: st, tone: TONE_FALLBACK };
              const isOpen = expanded === r.id;
              const note = notes[r.id];
              return (
                <div key={r.id} className="overflow-hidden rounded-2xl border border-line bg-tile">
                  {/* ردیفِ اصلی */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="flex w-full items-center gap-3 p-4 text-right transition hover:bg-white/[.02]"
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-bad/10 text-[#fca5a5]">
                      <Ico name="flag" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold">{r.reported}</span>
                        <span className="chip bg-tile2 text-[11px] text-faint">{REPORT_CAT_FA[r.category]}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-faint">
                        گزارش‌دهنده: <span className="text-muted">{r.reporter}</span>
                        <span className="px-1 text-faint/60">·</span>
                        {r.tournament}
                      </p>
                    </div>
                    <AdminBadge label={meta.label} tone={meta.tone} />
                    <span className={`flex-none text-faint transition ${isOpen ? 'rotate-180' : ''}`}>
                      <Ico name="chevron" />
                    </span>
                  </button>

                  {/* جزئیات + اقدام‌ها */}
                  {isOpen && (
                    <div className="border-t border-line bg-tile2/40 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="گزارش‌دهنده" value={r.reporter} />
                        <Field label="متهم" value={r.reported} />
                        <Field label="تورنومنت" value={r.tournament} />
                        <Field label="دسته‌بندی" value={`${REPORT_CAT_FA[r.category]} (${r.category})`} />
                        <Field label="شناسه" value={r.id} ltr />
                        <Field label="تاریخِ ثبت" value={new Date(r.createdAt).toLocaleDateString('fa-IR')} />
                      </div>

                      {note && (
                        <div className="mt-3">
                          <span className="chip border border-good/30 bg-good/15 text-good">
                            <Ico name="arrowLeft" size={13} />
                            {note}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {ACTIONS.map((a) => (
                          <button
                            key={a.key}
                            onClick={() => applyAction(r, a)}
                            className={
                              a.tone === 'bad'
                                ? 'inline-flex items-center gap-1.5 rounded-xl border border-bad/30 bg-bad/10 px-3 py-1.5 text-xs font-semibold text-[#fca5a5] transition hover:bg-bad/20'
                                : a.tone === 'gold'
                                ? 'inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20'
                                : 'btn-ghost px-3 py-1.5 text-xs'
                            }
                          >
                            <Ico name={a.icon} size={14} />
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>
    </AdminGuard>
  );
}

function Field({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-tile p-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold text-slate-200 ${ltr ? 'tnum' : ''}`} dir={ltr ? 'ltr' : undefined}>{value}</p>
    </div>
  );
}
