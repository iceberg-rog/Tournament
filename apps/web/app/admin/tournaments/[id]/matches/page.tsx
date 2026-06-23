'use client';

// بخشِ «مسابقات + بازبینیِ نتایج» — فهرستِ matchesFor(t) با دور، a vs b، امتیاز و وضعیت.
// همه‌ی اکشن‌ها واقعی‌اند: patchِ ردیفِ محلی + pushToast + appendAudit(entityType:"match").

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { fmt, type Tone } from '@/lib/admin';
import { can } from '@/lib/admin/ops';
import { appendAudit, pushToast, useAdminRole, useAuditLog, useTournament } from '@/lib/admin/store';
import { MATCH_FA, matchesFor, type Match, type MatchStatus } from '@/lib/admin/fixtures';

const MATCH_TONE: Record<MatchStatus, Tone> = {
  scheduled: 'muted',
  ready: 'accent',
  live: 'bad',
  result_submitted: 'gold',
  disputed: 'bad',
  admin_review: 'gold',
  completed: 'good',
  no_show: 'muted',
};

// مسابقه‌هایی که نیاز به بازبینیِ مدیر دارند (اکشن‌پذیر).
const REVIEWABLE: MatchStatus[] = ['result_submitted', 'disputed', 'live'];
const isReviewable = (s: MatchStatus) => REVIEWABLE.includes(s);

type StatusFilter = 'all' | MatchStatus;

export default function TournamentMatchesPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const auditAll = useAuditLog();

  const [actorName, setActorName] = useState('مدیر سیستم');
  const [loading, setLoading] = useState(true);
  // patchهای محلیِ روی مسابقات (وضعیت/امتیاز) — منبعِ نمایش.
  const [patches, setPatches] = useState<Record<string, Partial<Match>>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roundFilter, setRoundFilter] = useState<'all' | number>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [editA, setEditA] = useState('0');
  const [editB, setEditB] = useState('0');
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  useEffect(() => {
    const tm = setTimeout(() => setLoading(false), 300);
    if (isLoggedIn())
      apiGet<{ displayName: string }>('/users/me')
        .then((m) => m.displayName && setActorName(m.displayName))
        .catch(() => {});
    return () => clearTimeout(tm);
  }, []);

  // مسابقاتِ پایه از fixture + اعمالِ patchهای محلی.
  const baseMatches = useMemo(() => (t ? matchesFor(t) : []), [t]);
  const matches = useMemo(
    () => baseMatches.map((m) => ({ ...m, ...patches[m.id] })),
    [baseMatches, patches],
  );

  const rounds = useMemo(() => Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b), [matches]);
  const pendingCount = useMemo(() => matches.filter((m) => m.status === 'result_submitted' || m.status === 'disputed').length, [matches]);

  const filtered = useMemo(
    () =>
      matches.filter((m) => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (roundFilter !== 'all' && m.round !== roundFilter) return false;
        return true;
      }),
    [matches, statusFilter, roundFilter],
  );

  if (!t) return null; // layout صفحه‌ی not-found را نشان می‌دهد.

  const canReview = can(role, 'review_results');

  // ───────── اکشن‌ها: patchِ محلی + toast + ممیزی ─────────
  function applyPatch(m: Match, patch: Partial<Match>) {
    setPatches((p) => ({ ...p, [m.id]: { ...p[m.id], ...patch } }));
  }
  function audit(m: Match, action: string, reason?: string) {
    appendAudit({ actor: actorName, actorRole: role, action, entityType: 'match', entityId: m.id, reason });
  }

  function approve(m: Match) {
    if (!canReview) return;
    applyPatch(m, { status: 'completed' });
    pushToast({ kind: 'success', msg: `نتیجه‌ی ${m.a} در برابرِ ${m.b} تأیید شد` });
    audit(m, 'تأییدِ نتیجه', 'بازبینیِ مدیر');
  }

  function reject(m: Match) {
    if (!canReview) return;
    applyPatch(m, { status: 'ready', scoreA: 0, scoreB: 0 });
    pushToast({ kind: 'info', msg: `نتیجه‌ی ${m.a} در برابرِ ${m.b} رد و به بازی بازگردانده شد` });
    audit(m, 'ردِ نتیجه', 'نتیجه‌ی نامعتبر');
    setConfirmReject(null);
  }

  function openEditor(m: Match) {
    setEditing(m.id);
    setEditA(String(m.scoreA));
    setEditB(String(m.scoreB));
  }
  function saveEditor(m: Match) {
    const sa = Math.max(0, Math.trunc(Number(editA) || 0));
    const sb = Math.max(0, Math.trunc(Number(editB) || 0));
    applyPatch(m, { scoreA: sa, scoreB: sb, status: 'completed' });
    pushToast({ kind: 'success', msg: `امتیازِ ${m.a} ${fmt(sa)}–${fmt(sb)} ${m.b} ثبت و نهایی شد` });
    audit(m, 'ویرایشِ امتیاز', `${sa}–${sb}`);
    setEditing(null);
  }

  function markNoShow(m: Match) {
    if (!canReview) return;
    applyPatch(m, { status: 'no_show' });
    pushToast({ kind: 'info', msg: `عدمِ حضور برای مسابقه‌ی ${m.a} / ${m.b} ثبت شد` });
    audit(m, 'ثبتِ عدمِ حضور');
  }

  const noPermTitle = canReview ? undefined : 'دسترسی لازم را ندارید';
  const selectCls = 'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';
  const hasFilter = statusFilter !== 'all' || roundFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* سرفصلِ بخش */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">مسابقات و بازبینیِ نتایج</h2>
          <p className="mt-0.5 text-xs text-faint">تأیید، رد، ویرایشِ امتیاز و ثبتِ عدمِ حضور برای مسابقاتِ این تورنومنت.</p>
        </div>
        {/* خلاصه‌ی نتایجِ در انتظارِ تأیید */}
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[.07] px-3.5 py-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 text-gold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg>
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tnum text-gold">{fmt(pendingCount)}</p>
            <p className="text-[11px] text-faint">نتیجه‌ی در انتظارِ تأیید</p>
          </div>
        </div>
      </div>

      {/* نوارِ فیلتر */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
        <select value={String(statusFilter)} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectCls}>
          <option value="all">همه‌ی وضعیت‌ها</option>
          {(Object.keys(MATCH_FA) as MatchStatus[]).map((s) => (
            <option key={s} value={s}>{MATCH_FA[s]}</option>
          ))}
        </select>
        <select value={String(roundFilter)} onChange={(e) => setRoundFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className={selectCls}>
          <option value="all">همه‌ی دورها</option>
          {rounds.map((r) => (
            <option key={r} value={r}>دورِ {fmt(r)}</option>
          ))}
        </select>
        <button onClick={() => setStatusFilter('result_submitted')} className="chip border border-gold/30 bg-gold/10 text-gold hover:bg-gold/15">فقط در انتظارِ تأیید</button>
        {hasFilter && (
          <button onClick={() => { setStatusFilter('all'); setRoundFilter('all'); }} className="rounded-lg border border-line px-3 py-2 text-xs text-faint hover:text-text">پاک‌کردنِ فیلترها</button>
        )}
        <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مسابقه</span>
      </div>

      {/* فهرستِ مسابقات */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-2xl border border-line bg-white/[.03]" />
          ))}
        </div>
      ) : baseMatches.length === 0 ? (
        <div className="rounded-2xl border border-line bg-tile p-10 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-tile2 text-faint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M6 21h12" /><path d="M9 21v-4M15 21v-4" /></svg>
          </span>
          <p className="text-sm text-muted">هنوز مسابقه‌ای ساخته نشده است</p>
          <p className="mt-1 text-xs text-faint">پس از ساختِ براکت، مسابقاتِ هر دور این‌جا نمایش داده می‌شوند.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-tile p-10 text-center">
          <p className="text-sm text-muted">مسابقه‌ای با این فیلتر پیدا نشد</p>
          <button onClick={() => { setStatusFilter('all'); setRoundFilter('all'); }} className="btn-ghost mt-3 px-4 py-2 text-xs">پاک‌کردنِ فیلترها</button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((m) => {
            const reviewable = isReviewable(m.status);
            const winnerA = m.status === 'completed' && m.scoreA > m.scoreB;
            const winnerB = m.status === 'completed' && m.scoreB > m.scoreA;
            return (
              <li key={m.id} className="rounded-2xl border border-line bg-tile p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* هویتِ مسابقه */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line bg-tile2 text-[11px] font-bold tnum text-muted">
                      R{fmt(m.round)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        <span className={winnerA ? 'text-good' : ''}>{m.a}</span>
                        <span className="px-2 tnum text-faint">{fmt(m.scoreA)}–{fmt(m.scoreB)}</span>
                        <span className={winnerB ? 'text-good' : ''}>{m.b}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-faint">
                        دورِ {fmt(m.round)} · بازیِ {fmt(m.slot + 1)}
                        {m.submittedBy ? ` · ثبت‌شده توسطِ ${m.submittedBy}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    <AdminBadge label={MATCH_FA[m.status]} tone={MATCH_TONE[m.status]} dot={m.status === 'live'} />
                  </div>
                </div>

                {/* اکشن‌ها — فقط برای مسابقاتِ اکشن‌پذیر */}
                {reviewable && (
                  <div className="mt-3 border-t border-line pt-3">
                    {editing === m.id ? (
                      // ویرایشگرِ امتیازِ درون‌خطی
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">امتیاز:</span>
                        <input type="number" min={0} value={editA} onChange={(e) => setEditA(e.target.value)} aria-label={`امتیازِ ${m.a}`}
                          className="w-16 rounded-lg border border-line bg-tile2 px-2 py-1.5 text-center text-sm tnum outline-none focus:border-accent-dim" />
                        <span className="text-faint">{m.a}</span>
                        <span className="px-1 text-faint">—</span>
                        <input type="number" min={0} value={editB} onChange={(e) => setEditB(e.target.value)} aria-label={`امتیازِ ${m.b}`}
                          className="w-16 rounded-lg border border-line bg-tile2 px-2 py-1.5 text-center text-sm tnum outline-none focus:border-accent-dim" />
                        <span className="text-faint">{m.b}</span>
                        <button onClick={() => saveEditor(m)} className="btn-primary ms-auto px-3 py-1.5 text-xs">ثبت و نهایی‌سازی</button>
                        <button onClick={() => setEditing(null)} className="btn-ghost px-3 py-1.5 text-xs">انصراف</button>
                      </div>
                    ) : confirmReject === m.id ? (
                      // تأییدِ درون‌خطیِ ردِ نتیجه
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[#fca5a5]">نتیجه رد و مسابقه به وضعیتِ «آماده» بازگردانده شود؟</span>
                        <button onClick={() => reject(m)} className="btn-danger ms-auto px-3 py-1.5 text-xs">تأییدِ رد</button>
                        <button onClick={() => setConfirmReject(null)} className="btn-ghost px-3 py-1.5 text-xs">انصراف</button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => approve(m)} disabled={!canReview} title={noPermTitle}
                          className="rounded-lg border border-good/30 px-3 py-1.5 text-xs font-semibold text-good transition hover:bg-good/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                          تأییدِ نتیجه
                        </button>
                        <button onClick={() => setConfirmReject(m.id)} disabled={!canReview} title={noPermTitle}
                          className="rounded-lg border border-bad/30 px-3 py-1.5 text-xs font-semibold text-[#fca5a5] transition hover:bg-bad/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                          ردِ نتیجه
                        </button>
                        <button onClick={() => openEditor(m)} disabled={!canReview} title={noPermTitle}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                          ویرایشِ امتیاز
                        </button>
                        <button onClick={() => markNoShow(m)} disabled={!canReview} title={noPermTitle}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                          ثبتِ عدمِ حضور
                        </button>
                        {!canReview && (
                          <span className="ms-auto inline-flex items-center gap-1 text-[11px] text-faint">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                            دسترسیِ بازبینی ندارید
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* گزارشِ عملیاتِ این تورنومنت روی مسابقات */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 5h16M4 12h16M4 19h10" /></svg>
          </span>
          <h3 className="font-display text-sm font-bold">گزارشِ عملیاتِ این تورنومنت</h3>
        </div>
        {/* ممیزیِ این تورنومنت: ردیف‌های تورنومنت‌محور + اکشن‌های مسابقه (entityIdشان با idِ تورنومنت آغاز می‌شود) */}
        <AuditLogList entries={auditAll.filter((e) => e.entityId === id || e.entityId.startsWith(`${id}-`))} limit={8} />
      </div>
    </div>
  );
}
