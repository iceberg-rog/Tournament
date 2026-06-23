'use client';

// مدیریتِ اختلاف‌های تورنومنت — پرونده‌محور با drawerِ جزئیاتِ کامل.
// از مدلِ غنیِ OpsDispute (buildTournamentOps) می‌خواند؛ تصمیم‌ها state را
// (refresh-safe با useOpsSlice) تغییر می‌دهند، toast و audit می‌نویسند، و
// اثرِ آزادسازیِ دورِ بعد را اعلام می‌کنند.

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { Drawer } from '@/components/admin/cr/Drawer';
import { fmt, type Tone } from '@/lib/admin';
import { can } from '@/lib/admin/ops';
import { useAdminRole, useTournament, pushToast, appendAudit } from '@/lib/admin/store';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { buildTournamentOps, type OpsDispute } from '@/lib/admin/tournamentOps';

type DStatus = OpsDispute['status'];
const STATUS_FA: Record<DStatus, string> = { open: 'باز', under_review: 'در حالِ بررسی', resolved: 'حل‌شده', rejected: 'رد‌شده' };
const TONE: Record<DStatus, Tone> = { open: 'bad', under_review: 'gold', resolved: 'good', rejected: 'muted' };
type Filter = 'all' | DStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'open', label: STATUS_FA.open },
  { key: 'under_review', label: STATUS_FA.under_review },
  { key: 'resolved', label: STATUS_FA.resolved },
  { key: 'rejected', label: STATUS_FA.rejected },
];

interface Patch { status: DStatus; resolution?: string }
const clock = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—'; } catch { return '—'; } };

export default function DisputesPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t]);

  const [patches, setPatches] = useOpsSlice<Record<string, Patch>>(id, 'dispute-status', {});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<string | null>(null);

  const disputes = ops?.disputes ?? [];
  const eff = (d: OpsDispute): DStatus => patches[d.id]?.status ?? d.status;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return disputes.filter((d) => {
      if (filter !== 'all' && eff(d) !== filter) return false;
      if (q && !`${d.reporter} ${d.accused} ${d.reason} #${d.number}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [disputes, filter, search, patches]);

  if (!t || !ops) return null;

  const canReview = can(role, 'review_disputes');
  const openCount = disputes.filter((d) => eff(d) === 'open' || eff(d) === 'under_review').length;
  const selected = sel ? disputes.find((d) => d.id === sel) ?? null : null;

  function audit(action: string, dispId: string, reason?: string) {
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action, entityType: 'dispute', entityId: dispId, reason });
  }
  function setStatus(d: OpsDispute, status: DStatus, resolution?: string) {
    setPatches((prev) => ({ ...prev, [d.id]: { status, resolution } }));
  }

  // ───────── تصمیم‌ها ─────────
  function requestEvidence(d: OpsDispute) {
    if (!canReview) return;
    setStatus(d, 'under_review');
    pushToast({ kind: 'info', msg: `درخواستِ مدرکِ بیشتر برای ${d.reporter} و ${d.accused} ارسال شد` });
    audit('درخواستِ مدرک برای اختلاف', d.id, `مسابقه #${fmt(d.number)}`);
  }
  function resolveFor(d: OpsDispute, who: string) {
    if (!canReview) return;
    if (!window.confirm(`اختلافِ مسابقه #${fmt(d.number)} به‌نفعِ «${who}» نهایی شود؟ نتیجه قطعی می‌شود و دورِ بعد آزاد می‌گردد.`)) return;
    setStatus(d, 'resolved', `به‌نفعِ ${who}`);
    pushToast({ kind: 'success', msg: `اختلاف حل شد؛ نتیجه نهایی شد و مانعِ دورِ بعد برداشته شد` });
    audit('حلِ اختلاف', d.id, `رأی: به‌نفعِ ${who} — مسابقه #${fmt(d.number)}`);
    setSel(null);
  }
  function editScore(d: OpsDispute) {
    if (!canReview) return;
    const sc = window.prompt('امتیازِ اصلاح‌شده را وارد کنید (مثلاً ۳-۱):', '')?.trim();
    if (!sc) return;
    setStatus(d, 'resolved', `امتیاز اصلاح شد: ${sc}`);
    pushToast({ kind: 'success', msg: `امتیازِ مسابقه #${fmt(d.number)} به ${sc} اصلاح و نهایی شد` });
    audit('اصلاحِ دستیِ امتیاز', d.id, `امتیازِ جدید: ${sc}`);
    setSel(null);
  }
  function rematch(d: OpsDispute) {
    if (!canReview) return;
    setStatus(d, 'under_review', 'بازیِ مجدد برنامه‌ریزی شد');
    pushToast({ kind: 'info', msg: `بازیِ مجددِ مسابقه #${fmt(d.number)} برنامه‌ریزی شد` });
    audit('دستورِ بازیِ مجدد', d.id, `مسابقه #${fmt(d.number)}`);
  }
  function reject(d: OpsDispute) {
    if (!canReview) return;
    if (!window.confirm('این اختلاف رد شود؟ گزارش‌دهنده مطلع خواهد شد.')) return;
    const reason = window.prompt('دلیلِ رد (اختیاری):', '')?.trim() || undefined;
    setStatus(d, 'rejected', reason);
    pushToast({ kind: 'info', msg: 'اختلاف رد شد' });
    audit('ردِ اختلاف', d.id, reason);
    setSel(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold">مدیریتِ اختلاف‌ها</h2>
          <p className="mt-0.5 text-xs text-faint">
            {openCount > 0 ? `${fmt(openCount)} اختلافِ باز — پیش از آزادسازیِ جایزه و ساختِ دورِ بعد باید حل شوند.` : 'هیچ اختلافِ بازی وجود ندارد.'}
          </p>
        </div>
        {!canReview && <span className="rounded-lg border border-line bg-tile2 px-2.5 py-1.5 text-[11px] text-faint">فقط مشاهده — دسترسیِ بررسیِ اختلاف ندارید</span>}
      </div>

      {disputes.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-line bg-tile px-6 py-16 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-tile2 text-good">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <p className="text-base font-bold">اختلافی ثبت نشده است</p>
          <p className="mt-1 max-w-sm text-xs text-faint">هر اختلافی که شرکت‌کننده‌ها روی نتیجه‌ی مسابقه‌ها ثبت کنند اینجا برای رسیدگی نمایش داده می‌شود.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجو: گزارش‌دهنده، حریف، دلیل، مسابقه…" className="min-w-[200px] flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" />
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${filter === f.key ? 'border-accent-dim bg-accent/10 text-white' : 'border-line text-muted hover:text-white'}`}>{f.label}</button>
              ))}
            </div>
            <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-tile p-10 text-center">
              <p className="text-sm text-muted">اختلافی با این فیلتر پیدا نشد</p>
              <button onClick={() => { setSearch(''); setFilter('all'); }} className="btn-ghost mt-3 px-4 py-2 text-xs">پاک‌کردنِ فیلترها</button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((d) => {
                const st = eff(d);
                const res = patches[d.id]?.resolution;
                const overdue = (() => { try { return Date.parse(d.deadline) < 1750680000000; } catch { return false; } })();
                return (
                  <li key={d.id} className="overflow-hidden rounded-2xl border border-line bg-tile">
                    <button onClick={() => setSel(d.id)} className="block w-full p-5 text-right transition hover:bg-white/[.02]">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminBadge label={STATUS_FA[st]} tone={TONE[st]} dot={st === 'open'} />
                        <span className="rounded-md border border-line bg-tile2 px-2 py-0.5 text-[11px] text-muted">مسابقه #<span className="tnum text-slate-200">{fmt(d.number)}</span> · {d.round}</span>
                        {d.severity === 'critical' && st !== 'resolved' && st !== 'rejected' && <span className="rounded-md border border-bad/30 bg-bad/10 px-2 py-0.5 text-[11px] text-[#fca5a5]">مانعِ دورِ بعد</span>}
                        <span className={`ms-auto rounded-md border px-2 py-0.5 text-[11px] ${overdue ? 'border-bad/30 bg-bad/10 text-[#fca5a5]' : 'border-line bg-tile2 text-faint'}`}>مهلت: {clock(d.deadline)}{overdue ? ' (گذشته)' : ''}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200"><span className="text-faint">گزارش‌دهنده: </span><span className="font-semibold">{d.reporter}</span> <span className="text-faint"> در برابرِ </span><span className="font-semibold">{d.accused}</span></p>
                      <p className="mt-0.5 text-[13px] text-muted">«{d.reason}»</p>
                      <p className="mt-1 text-[12px] text-[#fca5a5]"><span className="text-faint">اثر: </span>{d.impact}</p>
                      {res && <p className="mt-2 rounded-lg border border-good/30 bg-good/5 px-3 py-1.5 text-xs text-good">رأیِ نهایی: {res}</p>}
                      <p className="mt-2 text-[11px] font-semibold text-accent">بازکردنِ پرونده ←</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* dispute case drawer */}
      <Drawer open={!!selected} onClose={() => setSel(null)} width={500}
        title={selected ? <span className="font-display text-base font-bold">پرونده‌ی اختلاف · مسابقه #{fmt(selected.number)}</span> : ''}
        subtitle={selected?.round}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <AdminBadge label={STATUS_FA[eff(selected)]} tone={TONE[eff(selected)]} dot={eff(selected) === 'open'} />
              {selected.severity === 'critical' && <span className="rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 text-[10px] text-[#fca5a5]">بحرانی</span>}
              <span className="rounded-full border border-line bg-tile2 px-2 py-0.5 text-[10px] text-faint">مهلت: {clock(selected.deadline)}</span>
            </div>

            {/* طرفین */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-accent/25 bg-accent/[.05] p-3"><p className="text-[11px] text-faint">گزارش‌دهنده</p><p className="mt-0.5 text-sm font-bold">{selected.reporter}</p><p className="mt-1 text-[11px] text-muted">ادعا: {selected.claim}</p></div>
              <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">طرفِ مقابل</p><p className="mt-0.5 text-sm font-bold">{selected.accused}</p><p className="mt-1 text-[11px] text-muted">ثبت‌شده: {selected.submitted}</p></div>
            </div>

            <div className="rounded-xl border border-line bg-tile2 p-3 text-[13px] leading-6"><span className="text-faint">دلیلِ اعتراض: </span>{selected.reason}</div>
            <div className="rounded-xl border border-bad/25 bg-bad/[.06] p-3 text-[13px] leading-6 text-[#fca5a5]"><span className="text-faint">اثر روی تورنومنت: </span>{selected.impact}</div>

            {/* مدارک */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted">مدارک ({fmt(selected.evidence.length)})</p>
              <ul className="space-y-1.5">
                {selected.evidence.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-[12px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-none text-faint"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m3 15 5-5 4 4 3-3 6 6" /></svg>
                    <span className="flex-1">{e.label}</span>
                    <span className="text-faint">{e.by}</span>
                  </li>
                ))}
                {selected.evidence.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-2 text-[12px] text-faint">مدرکی پیوست نشده — می‌توانید درخواستِ مدرک بدهید.</li>}
              </ul>
            </div>

            <div className="rounded-xl border border-gold/25 bg-gold/[.05] p-3 text-[12px] text-gold"><span className="text-faint">پیشنهادِ سیستم: </span>{selected.suggested}</div>
            <Link href={`/admin/tournaments/${id}/control-room`} className="block text-center text-[12px] text-accent hover:underline">مشاهده‌ی مسابقه در اتاقِ کنترل ←</Link>

            {/* تصمیم */}
            {!canReview ? (
              <p className="rounded-xl border border-line bg-tile2 p-3 text-center text-xs text-faint">دسترسیِ بررسیِ اختلاف ندارید.</p>
            ) : eff(selected) === 'resolved' || eff(selected) === 'rejected' ? (
              <p className="rounded-xl border border-good/25 bg-good/[.05] p-3 text-center text-xs text-good">این پرونده رسیدگی شده است{patches[selected.id]?.resolution ? ` — ${patches[selected.id]?.resolution}` : ''}.</p>
            ) : (
              <div className="space-y-2 border-t border-line pt-3">
                <p className="text-xs font-semibold text-muted">تصمیم</p>
                <button onClick={() => requestEvidence(selected)} className="btn-ghost w-full px-3.5 py-2.5 text-sm">درخواستِ مدرکِ بیشتر</button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => resolveFor(selected, selected.reporter)} className="btn-primary px-3 py-2.5 text-[13px]">حل به‌نفعِ {selected.reporter}</button>
                  <button onClick={() => resolveFor(selected, selected.accused)} className="btn-primary px-3 py-2.5 text-[13px]">حل به‌نفعِ {selected.accused}</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => editScore(selected)} className="btn-ghost px-3 py-2.5 text-[13px]">اصلاحِ امتیاز</button>
                  <button onClick={() => rematch(selected)} className="btn-ghost px-3 py-2.5 text-[13px]">بازیِ مجدد</button>
                </div>
                <button onClick={() => reject(selected)} className="btn-danger w-full px-3.5 py-2.5 text-sm">ردِ اختلاف</button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* audit log */}
      <div className="rounded-2xl border border-line bg-tile p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-accent"><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg>
          گزارشِ عملیاتِ این تورنومنت
        </h3>
        <AuditLogList entityId={id} />
      </div>
    </div>
  );
}
