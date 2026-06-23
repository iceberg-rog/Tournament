'use client';

// شرکت‌کننده‌های یک تورنومنت — مدیریتِ عملیاتیِ کامل.
// این صفحه فقط بدنه‌ی بخش را رندر می‌کند؛ هدر/تب‌ها در layout هستند.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { fmt } from '@/lib/admin';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import {
  participantsFor,
  PARTICIPANT_FA,
  type Participant,
  type ParticipantStatus,
} from '@/lib/admin/fixtures';
import { can } from '@/lib/admin/ops';
import { useAdminRole, useAuditLog, useTournament, pushToast, appendAudit } from '@/lib/admin/store';

const STATUS_TONE: Record<ParticipantStatus, 'good' | 'bad' | 'accent' | 'muted'> = {
  registered: 'accent',
  waitlisted: 'muted',
  checked_in: 'good',
  no_show: 'bad',
  disqualified: 'bad',
  eliminated: 'muted',
  winner: 'good',
};

type StatusFilter = 'all' | ParticipantStatus;
type PaidFilter = 'all' | 'paid' | 'unpaid';

export default function ParticipantsPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const auditAll = useAuditLog();
  const [actorName, setActorName] = useState('مدیر سیستم');

  // patch map: شناسه‌ی شرکت‌کننده → تغییراتِ محلی روی ردیف.
  const [patches, setPatches] = useState<Record<string, Partial<Participant>>>({});
  const [confirmKill, setConfirmKill] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [paid, setPaid] = useState<PaidFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = setTimeout(() => setLoading(false), 300);
    if (isLoggedIn())
      apiGet<{ displayName: string }>('/users/me')
        .then((m) => m.displayName && setActorName(m.displayName))
        .catch(() => {});
    return () => clearTimeout(tid);
  }, []);

  // پایه‌ی قطعی از fixtures، سپس اعمالِ patchهای محلی.
  const base = useMemo(() => (t ? participantsFor(t) : []), [t]);
  const rows = useMemo(() => base.map((p) => ({ ...p, ...patches[p.id] })), [base, patches]);

  // رویدادهای ممیزیِ مربوط به شرکت‌کننده‌های همین تورنومنت (entityId با id-p شروع می‌شود).
  const participantAudit = useMemo(
    () => auditAll.filter((e) => e.entityType === 'participant' && e.entityId.startsWith(`${id}-p`)),
    [auditAll, id],
  );

  const counts = useMemo(() => {
    let checkedIn = 0,
      absent = 0,
      banned = 0;
    for (const p of rows) {
      if (p.status === 'checked_in') checkedIn++;
      else if (p.status === 'no_show') absent++;
      else if (p.status === 'disqualified') banned++;
    }
    return { total: rows.length, checkedIn, absent, banned };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (paid === 'paid' && !p.paid) return false;
      if (paid === 'unpaid' && p.paid) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, status, paid]);

  const hasFilter = !!search || status !== 'all' || paid !== 'all';
  function resetFilters() {
    setSearch('');
    setStatus('all');
    setPaid('all');
  }

  if (!t) return null;

  const canManage = can(role, 'manual_check_in'); // tournament:update — چک‌این/ارتقا/محرومیت
  const canRefund = can(role, 'refund'); // finance:refund
  const noPerm = 'دسترسی لازم را ندارید';

  // ───────── اکشن‌های محلی ─────────
  function applyPatch(p: Participant, patch: Partial<Participant>) {
    setPatches((prev) => ({ ...prev, [p.id]: { ...prev[p.id], ...patch } }));
  }
  function audit(action: string, p: Participant, reason?: string) {
    appendAudit({
      actor: actorName,
      actorRole: role,
      action,
      entityType: 'participant',
      entityId: p.id,
      reason,
    });
  }

  function doCheckIn(p: Participant) {
    if (!canManage) return;
    applyPatch(p, { status: 'checked_in' });
    pushToast({ kind: 'success', msg: `«${p.name}» به‌صورتِ دستی چک‌این شد` });
    audit('چک‌اینِ دستی', p);
  }
  function doPromote(p: Participant) {
    if (!canManage) return;
    applyPatch(p, { status: 'registered' });
    pushToast({ kind: 'success', msg: `«${p.name}» از لیستِ انتظار ارتقا یافت` });
    audit('ارتقا از لیستِ انتظار', p);
  }
  function doDisqualify(p: Participant) {
    if (!canManage) return;
    applyPatch(p, { status: 'disqualified' });
    pushToast({ kind: 'info', msg: `«${p.name}» محروم شد` });
    audit('محروم‌سازیِ شرکت‌کننده', p, 'تصمیمِ مدیر');
    setConfirmKill(null);
  }
  function doRefund(p: Participant) {
    if (!canRefund) return;
    applyPatch(p, { paid: false });
    pushToast({ kind: 'success', msg: `ورودیِ «${p.name}» بازپرداخت شد` });
    audit('بازپرداختِ ورودی', p);
  }
  function doMessage(p: Participant) {
    const text = typeof window !== 'undefined' ? window.prompt(`پیام به «${p.name}»:`) : null;
    if (text == null) return;
    const msg = text.trim();
    if (!msg) return;
    pushToast({ kind: 'success', msg: `پیام به «${p.name}» ارسال شد` });
    audit('ارسالِ پیام به شرکت‌کننده', p, msg.slice(0, 60));
  }

  const selectCls =
    'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';
  const actBtn =
    'rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-faint disabled:hover:text-faint';

  const statCards = [
    { label: 'کل', value: counts.total, tone: 'text-slate-200' },
    { label: 'چک‌این‌شده', value: counts.checkedIn, tone: 'text-good' },
    { label: 'غایب', value: counts.absent, tone: 'text-bad' },
    { label: 'محروم', value: counts.banned, tone: 'text-bad' },
  ];

  return (
    <div className="space-y-5">
      {/* section heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">شرکت‌کننده‌ها</h2>
          <p className="mt-0.5 text-xs text-faint">
            مدیریتِ چک‌این، لیستِ انتظار، محرومیت و بازپرداختِ ورودی.
          </p>
        </div>
        <div className="flex gap-2">
          {statCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-line bg-tile px-3.5 py-2 text-center">
              <p className="text-[10px] text-faint">{c.label}</p>
              <p className={`font-display text-lg font-bold tnum ${c.tone}`}>{fmt(c.value)}</p>
            </div>
          ))}
        </div>
      </div>

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
            placeholder="جست‌وجو بر اساسِ نام…"
            className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectCls}>
          <option value="all">همه‌ی وضعیت‌ها</option>
          {(Object.keys(PARTICIPANT_FA) as ParticipantStatus[]).map((s) => (
            <option key={s} value={s}>
              {PARTICIPANT_FA[s]}
            </option>
          ))}
        </select>
        <select value={paid} onChange={(e) => setPaid(e.target.value as PaidFilter)} className={selectCls}>
          <option value="all">پرداخت: همه</option>
          <option value="paid">پرداخت‌شده</option>
          <option value="unpaid">پرداخت‌نشده</option>
        </select>
        {hasFilter && (
          <button onClick={resetFilters} className="rounded-lg border border-line px-3 py-2 text-xs text-faint hover:text-text">
            پاک‌کردنِ فیلترها
          </button>
        )}
        <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-tile">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
              <th className="p-3 font-medium">سید</th>
              <th className="p-3 font-medium">نام</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">پرداخت</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-line">
                  <td colSpan={5} className="p-3">
                    <div className="h-8 w-full animate-pulse rounded bg-white/[.04]" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center">
                  <p className="text-sm text-muted">
                    {rows.length === 0 ? 'هنوز شرکت‌کننده‌ای ثبت‌نام نکرده است' : 'شرکت‌کننده‌ای با این فیلتر پیدا نشد'}
                  </p>
                  {hasFilter && (
                    <button onClick={resetFilters} className="btn-ghost mt-3 px-4 py-2 text-xs">
                      پاک‌کردنِ فیلترها
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isWaitlisted = p.status === 'waitlisted';
                const isBanned = p.status === 'disqualified';
                const confirming = confirmKill === p.id;
                return (
                  <tr key={p.id} className="border-b border-line transition hover:bg-white/[.025]">
                    <td className="p-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-tile2 text-xs font-bold tnum text-muted">
                        {fmt(p.seed)}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3">
                      <AdminBadge label={PARTICIPANT_FA[p.status]} tone={STATUS_TONE[p.status]} />
                    </td>
                    <td className="p-3">
                      {p.paid ? (
                        <span className="chip border border-good/30 bg-good/10 text-good">پرداخت‌شده</span>
                      ) : (
                        <span className="chip border border-bad/30 bg-bad/10 text-[#fca5a5]">پرداخت‌نشده</span>
                      )}
                    </td>
                    <td className="p-3">
                      {confirming ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[11px] text-[#fca5a5]">محروم شود؟</span>
                          <button onClick={() => doDisqualify(p)} className="btn-danger px-2.5 py-1 text-[11px]">
                            تأیید
                          </button>
                          <button onClick={() => setConfirmKill(null)} className={actBtn}>
                            انصراف
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {p.status === 'registered' && (
                            <button onClick={() => doCheckIn(p)} disabled={!canManage} title={canManage ? undefined : noPerm} className={actBtn}>
                              چک‌اینِ دستی
                            </button>
                          )}
                          {isWaitlisted && (
                            <button onClick={() => doPromote(p)} disabled={!canManage} title={canManage ? undefined : noPerm} className={actBtn}>
                              ارتقا از لیستِ انتظار
                            </button>
                          )}
                          {p.paid && (
                            <button onClick={() => doRefund(p)} disabled={!canRefund} title={canRefund ? undefined : noPerm} className={actBtn}>
                              بازپرداخت
                            </button>
                          )}
                          <button onClick={() => doMessage(p)} className={actBtn}>
                            پیام
                          </button>
                          {!isBanned && (
                            <button
                              onClick={() => setConfirmKill(p.id)}
                              disabled={!canManage}
                              title={canManage ? undefined : noPerm}
                              className="rounded-lg border border-bad/30 px-2 py-1 text-[11px] font-semibold text-[#fca5a5] transition hover:bg-bad/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                              محروم‌سازی
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* audit log for this tournament's participant actions */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <h3 className="font-display text-sm font-bold">گزارشِ عملیاتِ این تورنومنت</h3>
        </div>
        <AuditLogList entries={participantAudit} limit={8} />
      </div>
    </div>
  );
}
