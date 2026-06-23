'use client';

// شرکت‌کننده‌های یک تورنومنت — عملیاتِ کاملِ بازیکن با درایورِ جزئیات.
// مدلِ غنی: base = ops.participants، سپس اعمالِ patchهای محلیِ refresh-safe.
// این صفحه فقط بدنه‌ی بخش را رندر می‌کند؛ هدر/تب‌ها در layout هستند.

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTournament, useAdminRole, useAuditLog, pushToast, appendAudit } from '@/lib/admin/store';
import {
  buildTournamentOps,
  PARTICIPANT_OPS_FA,
  type OpsParticipant,
  type ParticipantOpsStatus,
} from '@/lib/admin/tournamentOps';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { Drawer } from '@/components/admin/cr/Drawer';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { can } from '@/lib/admin/ops';
import { fmt } from '@/lib/admin';
import type { Tone } from '@/lib/admin';

// patch می‌تواند فیلدِ loose «muted» هم داشته باشد (بی‌صدا کردنِ بازیکن).
type Patch = Partial<OpsParticipant> & { muted?: boolean };
type Row = OpsParticipant & { muted?: boolean };

const STATUS_TONE: Record<ParticipantOpsStatus, Tone> = {
  registered: 'muted',
  checked_in: 'good',
  playing: 'accent',
  waiting: 'muted',
  eliminated: 'muted',
  winner: 'good',
  no_show: 'bad',
  disqualified: 'bad',
  suspended: 'gold',
};

const KYC_FA: Record<OpsParticipant['kyc'], string> = { verified: 'احرازشده', pending: 'در انتظار', none: 'احرازنشده' };
const KYC_TONE: Record<OpsParticipant['kyc'], Tone> = { verified: 'good', pending: 'gold', none: 'muted' };
const WALLET_FA: Record<OpsParticipant['wallet'], string> = { ok: 'سالم', locked: 'قفل', empty: 'خالی' };
const WALLET_TONE: Record<OpsParticipant['wallet'], Tone> = { ok: 'good', locked: 'gold', empty: 'muted' };

const clock = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
};
const day = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' }); } catch { return '—'; }
};

type StatusFilter = 'all' | ParticipantOpsStatus;

const selectCls = 'rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim';
const actBtn = 'rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white';

export default function Page() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const auditAll = useAuditLog();
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t]);

  // وضعیتِ پایدارِ patchها (refresh-safe).
  const [patches, setPatches] = useOpsSlice(id, 'participant-patches', {} as Record<string, Patch>);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [onlyKycPending, setOnlyKycPending] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState<string | null>(null); // برای درایور
  const [confirmBulkKill, setConfirmBulkKill] = useState(false);

  useEffect(() => {
    const tid = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(tid);
  }, []);

  const base = ops?.participants ?? [];
  const rows: Row[] = useMemo(() => base.map((p) => ({ ...p, ...patches[p.id] })), [base, patches]);

  const counts = useMemo(() => {
    const c = { total: rows.length, checkedIn: 0, playing: 0, eliminated: 0, noShow: 0, banned: 0 };
    for (const p of rows) {
      if (p.status === 'checked_in') c.checkedIn++;
      else if (p.status === 'playing') c.playing++;
      else if (p.status === 'eliminated') c.eliminated++;
      else if (p.status === 'no_show') c.noShow++;
      else if (p.status === 'disqualified') c.banned++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (onlyUnpaid && p.paid) return false;
      if (onlyKycPending && p.kyc !== 'pending') return false;
      if (q) {
        const hay = [p.displayName, p.username, p.realName, p.email, p.gameId, p.inGameName ?? '']
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, status, onlyUnpaid, onlyKycPending]);

  const hasFilter = !!search || status !== 'all' || onlyUnpaid || onlyKycPending;
  function resetFilters() {
    setSearch(''); setStatus('all'); setOnlyUnpaid(false); setOnlyKycPending(false);
  }

  if (!t || !ops) return null;

  const canBan = can(role, 'manual_check_in'); // محرومیت/تعلیق پشتِ همان مجوزِ مدیریتِ شرکت‌کننده

  // ───────── helpers: patch + audit ─────────
  function audit(action: string, entityId: string, reason?: string) {
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action, entityType: 'participant', entityId, reason });
  }
  function patchOne(pid: string, patch: Patch) {
    setPatches((prev) => ({ ...prev, [pid]: { ...prev[pid], ...patch } }));
  }
  function patchMany(ids: string[], patch: Patch | ((p: Row) => Patch)) {
    setPatches((prev) => {
      const next = { ...prev };
      for (const pid of ids) {
        const cur = rows.find((r) => r.id === pid);
        const delta = typeof patch === 'function' ? (cur ? patch(cur) : {}) : patch;
        next[pid] = { ...next[pid], ...delta };
      }
      return next;
    });
  }

  // ───────── single-row actions ─────────
  function messageOne(p: Row) {
    const text = typeof window !== 'undefined' ? window.prompt(`پیام به «${p.displayName}»:`) : null;
    if (text == null) return;
    const msg = text.trim();
    if (!msg) return;
    pushToast({ kind: 'success', msg: `پیام به «${p.displayName}» ارسال شد` });
    audit('ارسالِ پیام به بازیکن', p.id, msg.slice(0, 60));
  }
  function warnOne(p: Row) {
    patchOne(p.id, { warnings: p.warnings + 1 });
    pushToast({ kind: 'info', msg: `اخطار برای «${p.displayName}» ثبت شد` });
    audit('ثبتِ اخطار', p.id, `اخطارِ شماره ${fmt(p.warnings + 1)}`);
  }
  function toggleMute(p: Row) {
    const next = !p.muted;
    patchOne(p.id, { muted: next });
    pushToast({ kind: 'info', msg: next ? `«${p.displayName}» بی‌صدا شد` : `«${p.displayName}» از حالتِ بی‌صدا خارج شد` });
    audit(next ? 'بی‌صدا کردنِ بازیکن' : 'رفعِ بی‌صدا', p.id);
  }
  function noShowOne(p: Row) {
    patchOne(p.id, { status: 'no_show', noShows: p.noShows + 1 });
    pushToast({ kind: 'info', msg: `عدمِ حضورِ «${p.displayName}» ثبت شد` });
    audit('ثبتِ عدمِ حضور', p.id);
  }
  function suspendOne(p: Row) {
    if (!canBan) { pushToast({ kind: 'error', msg: 'دسترسی لازم را ندارید' }); return; }
    patchOne(p.id, { status: 'suspended' });
    pushToast({ kind: 'info', msg: `«${p.displayName}» تعلیق شد` });
    audit('تعلیقِ بازیکن', p.id, 'تصمیمِ مدیر');
  }
  function disqualifyOne(p: Row) {
    if (!canBan) { pushToast({ kind: 'error', msg: 'دسترسی لازم را ندارید' }); return; }
    patchOne(p.id, { status: 'disqualified' });
    pushToast({ kind: 'info', msg: `«${p.displayName}» محروم شد` });
    audit('محروم‌سازیِ بازیکن', p.id, 'تصمیمِ مدیر');
    setConfirmKill(null);
  }
  function restoreOne(p: Row) {
    patchOne(p.id, { status: 'registered' });
    pushToast({ kind: 'success', msg: `«${p.displayName}» بازگردانده شد` });
    audit('بازگردانیِ بازیکن', p.id);
  }

  // ───────── bulk actions ─────────
  const selectedRows = filtered.filter((p) => selected.has(p.id));
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  function toggleSel(pid: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n; });
  }
  function toggleSelectAll() {
    setSelected((prev) => {
      if (filtered.every((p) => prev.has(p.id))) {
        const n = new Set(prev); filtered.forEach((p) => n.delete(p.id)); return n;
      }
      const n = new Set(prev); filtered.forEach((p) => n.add(p.id)); return n;
    });
  }
  function clearSel() { setSelected(new Set()); }

  function bulkMessage() {
    const text = typeof window !== 'undefined' ? window.prompt(`پیام به ${fmt(selectedRows.length)} بازیکنِ منتخب:`) : null;
    if (text == null) return;
    const msg = text.trim();
    if (!msg) return;
    selectedRows.forEach((p) => audit('ارسالِ پیامِ گروهی', p.id, msg.slice(0, 60)));
    pushToast({ kind: 'success', msg: `پیام به ${fmt(selectedRows.length)} بازیکن ارسال شد` });
  }
  function bulkCheckIn() {
    const ids = selectedRows.map((p) => p.id);
    patchMany(ids, { status: 'checked_in' });
    ids.forEach((pid) => audit('چک‌اینِ گروهی', pid));
    pushToast({ kind: 'success', msg: `${fmt(ids.length)} بازیکن چک‌این شدند` });
  }
  function bulkWarn() {
    const ids = selectedRows.map((p) => p.id);
    patchMany(ids, (p) => ({ warnings: p.warnings + 1 }));
    ids.forEach((pid) => audit('اخطارِ گروهی', pid));
    pushToast({ kind: 'info', msg: `اخطار برای ${fmt(ids.length)} بازیکن ثبت شد` });
  }
  function bulkDisqualify() {
    if (!canBan) { pushToast({ kind: 'error', msg: 'دسترسی لازم را ندارید' }); return; }
    const ids = selectedRows.map((p) => p.id);
    patchMany(ids, { status: 'disqualified' });
    ids.forEach((pid) => audit('محروم‌سازیِ گروهی', pid, 'تصمیمِ مدیر'));
    pushToast({ kind: 'info', msg: `${fmt(ids.length)} بازیکن محروم شدند` });
    setConfirmBulkKill(false);
    clearSel();
  }
  function bulkExportCsv() {
    const header = ['displayName', 'username', 'email', 'phone', 'gameId', 'inGameName', 'status'];
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.join(',')];
    for (const p of selectedRows) {
      lines.push([p.displayName, p.username, p.email, p.phone, p.gameId, p.inGameName ?? '', PARTICIPANT_OPS_FA[p.status]].map(esc).join(','));
    }
    const csv = '﻿' + lines.join('\n');
    if (typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    selectedRows.forEach((p) => audit('خروجیِ CSV', p.id));
    pushToast({ kind: 'success', msg: `خروجیِ CSV برای ${fmt(selectedRows.length)} بازیکن ساخته شد` });
  }

  // رویدادهای ممیزیِ شرکت‌کننده‌ها
  const participantAudit = auditAll.filter((e) => e.entityType === 'participant');

  const active = openId ? rows.find((p) => p.id === openId) ?? null : null;

  const statCards: { label: string; value: number; tone: string }[] = [
    { label: 'کل', value: counts.total, tone: 'text-slate-200' },
    { label: 'چک‌این‌شده', value: counts.checkedIn, tone: 'text-good' },
    { label: 'در حالِ بازی', value: counts.playing, tone: 'text-accent' },
    { label: 'حذف‌شده', value: counts.eliminated, tone: 'text-muted' },
    { label: 'غایب', value: counts.noShow, tone: 'text-bad' },
    { label: 'محروم', value: counts.banned, tone: 'text-bad' },
  ];

  return (
    <div className="space-y-5">
      {/* heading */}
      <div>
        <h2 className="font-display text-lg font-bold">شرکت‌کننده‌ها</h2>
        <p className="mt-0.5 text-xs text-faint">اطلاعاتِ کامل، چک‌این، اخطار، پیام و محرومیت.</p>
      </div>

      {/* summary row */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-tile p-4 text-center">
            <p className="text-[10px] text-faint">{c.label}</p>
            <p className={`font-display text-xl font-bold tnum ${c.tone}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-tile p-3">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-faint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجو: نام، یوزرنیم، ایمیل، Game ID…"
            className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectCls}>
          <option value="all">همه‌ی وضعیت‌ها</option>
          {(Object.keys(PARTICIPANT_OPS_FA) as ParticipantOpsStatus[]).map((s) => (
            <option key={s} value={s}>{PARTICIPANT_OPS_FA[s]}</option>
          ))}
        </select>
        <button
          onClick={() => setOnlyUnpaid((v) => !v)}
          className={`chip border px-3 py-2 ${onlyUnpaid ? 'border-bad/40 bg-bad/10 text-[#fca5a5]' : 'border-line text-faint hover:text-text'}`}
        >
          پرداخت‌نشده
        </button>
        <button
          onClick={() => setOnlyKycPending((v) => !v)}
          className={`chip border px-3 py-2 ${onlyKycPending ? 'border-gold/40 bg-gold/10 text-gold' : 'border-line text-faint hover:text-text'}`}
        >
          KYC در انتظار
        </button>
        {hasFilter && (
          <button onClick={resetFilters} className="rounded-lg border border-line px-3 py-2 text-xs text-faint hover:text-text">
            پاک‌کردنِ فیلترها
          </button>
        )}
        <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>
      </div>

      {/* bulk bar */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-dim bg-accent/10 p-3">
          <span className="text-sm font-semibold text-accent tnum">{fmt(selectedRows.length)} انتخاب‌شده</span>
          <span className="mx-1 h-4 w-px bg-line" />
          <button onClick={bulkMessage} className={actBtn}>پیام به منتخب‌ها</button>
          <button onClick={bulkCheckIn} className={actBtn}>ثبتِ چک‌این</button>
          <button onClick={bulkWarn} className={actBtn}>اخطار</button>
          {confirmBulkKill ? (
            <span className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#fca5a5]">محروم شوند؟</span>
              <button onClick={bulkDisqualify} className="btn-danger px-2.5 py-1 text-[11px]">تأیید</button>
              <button onClick={() => setConfirmBulkKill(false)} className={actBtn}>انصراف</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmBulkKill(true)}
              disabled={!canBan}
              title={canBan ? undefined : 'دسترسی لازم را ندارید'}
              className="rounded-lg border border-bad/30 px-2.5 py-1 text-[11px] font-semibold text-[#fca5a5] transition hover:bg-bad/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              محروم‌سازی
            </button>
          )}
          <button onClick={bulkExportCsv} className={actBtn}>خروجیِ CSV</button>
          <button onClick={clearSel} className="ms-auto text-xs text-faint hover:text-text">لغوِ انتخاب</button>
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-tile">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="انتخابِ همه"
                  className="h-4 w-4 cursor-pointer accent-[#2dd4bf]"
                />
              </th>
              <th className="p-3 font-medium">سید</th>
              <th className="p-3 font-medium">بازیکن</th>
              <th className="p-3 font-medium">وضعیت</th>
              <th className="p-3 font-medium">Game ID</th>
              <th className="p-3 font-medium">KYC</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-line">
                  <td colSpan={7} className="p-3"><div className="h-9 w-full animate-pulse rounded bg-white/[.04]" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <p className="text-sm text-muted">
                    {rows.length === 0 ? 'هنوز هیچ شرکت‌کننده‌ای ثبت‌نام نکرده است' : 'شرکت‌کننده‌ای با این فیلتر پیدا نشد'}
                  </p>
                  {hasFilter && (
                    <button onClick={resetFilters} className="btn-ghost mt-3 px-4 py-2 text-xs">پاک‌کردنِ فیلترها</button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setOpenId(p.id)}
                  className="cursor-pointer border-b border-line transition hover:bg-white/[.025]"
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSel(p.id)}
                      aria-label={`انتخابِ ${p.displayName}`}
                      className="h-4 w-4 cursor-pointer accent-[#2dd4bf]"
                    />
                  </td>
                  <td className="p-3">
                    <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-tile2 text-xs font-bold tnum text-muted">
                      {fmt(p.seed)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 flex-none place-items-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.displayName}</p>
                        <p className="truncate text-[11px] text-faint">{p.username}</p>
                        {p.inGameName && (
                          <span className="mt-0.5 inline-block rounded bg-tile2 px-1.5 py-px text-[10px] text-muted">
                            نامِ نمایشی: {p.inGameName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      <AdminBadge label={PARTICIPANT_OPS_FA[p.status]} tone={STATUS_TONE[p.status]} />
                      {p.muted && <span className="chip border border-gold/30 bg-gold/10 text-gold">بی‌صدا</span>}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted" dir="ltr">{p.gameId}</td>
                  <td className="p-3">
                    <AdminBadge label={KYC_FA[p.kyc]} tone={KYC_TONE[p.kyc]} />
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => messageOne(p)} className={actBtn}>پیام</button>
                      <button onClick={() => setOpenId(p.id)} className={actBtn}>جزئیات</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* audit log */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <h3 className="font-display text-sm font-bold">گزارشِ عملیاتِ شرکت‌کننده‌ها</h3>
        </div>
        <AuditLogList entries={participantAudit} limit={8} />
      </div>

      {/* ───────── Player Drawer ───────── */}
      <Drawer
        open={!!active}
        onClose={() => { setOpenId(null); setConfirmKill(null); }}
        width={520}
        title={
          active ? (
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: active.color }}
              >
                {active.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold">{active.displayName}</p>
                <p className="truncate text-xs text-faint">{active.username}</p>
              </div>
            </div>
          ) : null
        }
        subtitle={active ? <AdminBadge label={PARTICIPANT_OPS_FA[active.status]} tone={STATUS_TONE[active.status]} /> : undefined}
      >
        {active && (
          <div className="space-y-5">
            {/* هویت */}
            <Section title="هویت">
              <p className="mb-2 rounded-lg border border-accent-dim bg-accent/5 px-3 py-2 text-[11px] text-muted">
                اطلاعاتِ تماسِ واقعی فقط برای مدیران قابلِ مشاهده است.
              </p>
              <Field label="نامِ واقعی" value={active.realName} />
              <Field label="ایمیل" value={active.email} ltr />
              <Field label="تلفن" value={active.phone} ltr />
              <Field label="Game ID" value={active.gameId} ltr />
              <Field label="نامِ نمایشی" value={active.inGameName ?? '—'} />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-faint">KYC</span>
                <AdminBadge label={KYC_FA[active.kyc]} tone={KYC_TONE[active.kyc]} />
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-faint">کیفِ پول</span>
                <AdminBadge label={WALLET_FA[active.wallet]} tone={WALLET_TONE[active.wallet]} />
              </div>
            </Section>

            {/* وضعیت در تورنومنت */}
            <Section title="وضعیت در تورنومنت">
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-faint">وضعیت</span>
                <AdminBadge label={PARTICIPANT_OPS_FA[active.status]} tone={STATUS_TONE[active.status]} />
              </div>
              <Field label="سید" value={fmt(active.seed)} />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-faint">مسابقه‌ی جاری</span>
                {active.currentMatch ? (
                  <Link href={`/admin/tournaments/${id}/control-room`} className="text-accent hover:underline">
                    مشاهده در اتاقِ کنترل
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
              <Field label="آخرین فعالیت" value={`${day(active.lastSeen)} · ${clock(active.lastSeen)}`} />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-faint">پرداختِ ورودی</span>
                {active.paid ? (
                  <span className="chip border border-good/30 bg-good/10 text-good">پرداخت‌شده</span>
                ) : (
                  <span className="chip border border-bad/30 bg-bad/10 text-[#fca5a5]">پرداخت‌نشده</span>
                )}
              </div>
            </Section>

            {/* پرچم‌ها */}
            <Section title="پرچم‌ها">
              <div className="grid grid-cols-3 gap-2">
                <Flag label="اخطار" value={active.warnings} tone={active.warnings > 0 ? 'text-gold' : 'text-muted'} />
                <Flag label="عدمِ حضور" value={active.noShows} tone={active.noShows > 0 ? 'text-bad' : 'text-muted'} />
                <Flag label="گزارش" value={active.reports} tone={active.reports > 0 ? 'text-bad' : 'text-muted'} />
              </div>
              {active.notes && (
                <p className="mt-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">{active.notes}</p>
              )}
            </Section>

            {/* اقدامات */}
            <Section title="اقداماتِ مدیریتی">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => messageOne(active)} className="btn-ghost px-3 py-2 text-xs">پیام</button>
                <button onClick={() => warnOne(active)} className="btn-ghost px-3 py-2 text-xs">اخطار</button>
                <button onClick={() => toggleMute(active)} className="btn-ghost px-3 py-2 text-xs">
                  {active.muted ? 'رفعِ بی‌صدا' : 'بی‌صدا'}
                </button>
                <button onClick={() => noShowOne(active)} className="btn-ghost px-3 py-2 text-xs">ثبتِ عدمِ حضور</button>
                <button
                  onClick={() => suspendOne(active)}
                  disabled={!canBan}
                  title={canBan ? undefined : 'دسترسی لازم را ندارید'}
                  className="rounded-lg border border-gold/30 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  تعلیق
                </button>
                {confirmKill === active.id ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#fca5a5]">محروم شود؟</span>
                    <button onClick={() => disqualifyOne(active)} className="btn-danger px-2.5 py-2 text-xs">تأیید</button>
                    <button onClick={() => setConfirmKill(null)} className="btn-ghost px-2.5 py-2 text-xs">انصراف</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmKill(active.id)}
                    disabled={!canBan}
                    title={canBan ? undefined : 'دسترسی لازم را ندارید'}
                    className="btn-danger px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    محروم‌سازی
                  </button>
                )}
                <button onClick={() => restoreOne(active)} className="btn-ghost px-3 py-2 text-xs">بازگردانی</button>
                <Link href="/admin/users" className="btn-ghost px-3 py-2 text-xs">پروفایلِ کامل</Link>
              </div>
            </Section>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-tile2 p-4">
      <h4 className="mb-2 font-display text-sm font-bold text-text">{title}</h4>
      {children}
    </div>
  );
}

function Field({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="flex-none text-faint">{label}</span>
      <span className={`min-w-0 truncate text-slate-200 ${ltr ? 'font-mono text-xs' : ''}`} dir={ltr ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

function Flag({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-tile p-3 text-center">
      <p className={`font-display text-lg font-bold tnum ${tone}`}>{fmt(value)}</p>
      <p className="text-[10px] text-faint">{label}</p>
    </div>
  );
}
