'use client';

// مالیِ تورنومنت — تایل‌های کلیدی، توزیعِ جایزه، دفترِ مالیِ مرتبط با همین تورنومنت،
// و اکشن‌های آزادسازی/بازپرداختِ جایزه (از طریقِ runActionِ store، با مجوز و اعتبارسنجی).

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import {
  LEDGER_FA,
  PAYMENT_STATUS_META,
  money,
  fmt,
  type EscrowStatus,
  type LedgerType,
  type Tone,
} from '@/lib/admin';
import { can } from '@/lib/admin/ops';
import {
  useAdminRole,
  useAdminState,
  useTournament,
  runAction,
} from '@/lib/admin/store';

const ESCROW_META: Record<EscrowStatus, { label: string; tone: Tone }> = {
  none: { label: 'بدونِ escrow', tone: 'muted' },
  locked: { label: 'قفل‌شده', tone: 'gold' },
  released: { label: 'آزادشده', tone: 'good' },
  refunded: { label: 'بازپرداخت‌شده', tone: 'muted' },
};

const dfa = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 10);
  }
};

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </div>
  );
}

export default function TournamentFinancePage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const { ledger } = useAdminState();

  const [actorName, setActorName] = useState('مدیر سیستم');
  const [confirm, setConfirm] = useState<null | 'release_prizes' | 'refund'>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | LedgerType>('all');

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  // ledger مرتبط با همین تورنومنت (ref شاملِ t.id) — قبل از هر return شرطی (قانونِ هوک‌ها)
  const tid = t?.id ?? '';
  const rows = useMemo(() => {
    let list = ledger.filter((e) => e.ref.toLowerCase().includes(tid.toLowerCase()));
    if (ledgerFilter !== 'all') list = list.filter((e) => e.type === ledgerFilter);
    return list;
  }, [ledger, tid, ledgerFilter]);

  const ledgerTypes = useMemo(
    () => Array.from(new Set(ledger.filter((e) => e.ref.toLowerCase().includes(tid.toLowerCase())).map((e) => e.type))),
    [ledger, tid],
  );

  if (!t) return null;

  const escrow = ESCROW_META[t.escrow];
  const canRelease = can(role, 'release_prizes');
  const canRefund = can(role, 'refund');

  // توزیعِ جایزه: ۵۰٪ / ۳۰٪ / ۲۰٪
  const dist = [
    { rank: '#۱', pct: 50, amount: Math.round(t.prize * 0.5) },
    { rank: '#۲', pct: 30, amount: Math.round(t.prize * 0.3) },
    { rank: '#۳', pct: 20, amount: Math.round(t.prize * 0.2) },
  ];

  const tiles = [
    { label: 'جایزه‌ی کل', value: money(t.prize), tone: 'text-gold' as const, badge: null },
    { label: 'وضعیتِ escrow', value: null, badge: <AdminBadge label={escrow.label} tone={escrow.tone} />, tone: '' as const },
    { label: 'پرداختِ معلق', value: fmt(t.pendingPayouts), tone: t.pendingPayouts > 0 ? ('text-gold' as const) : ('text-muted' as const), badge: null },
    { label: 'اختلافِ باز', value: fmt(t.disputes), tone: t.disputes > 0 ? ('text-bad' as const) : ('text-good' as const), badge: null },
  ];

  function doConfirm() {
    if (!confirm || !t) return;
    if (confirm === 'refund' && !reason.trim()) return;
    setBusy(true);
    setTimeout(() => {
      runAction(confirm, t, { role, actorName, reason: reason.trim() || undefined });
      setBusy(false);
      setConfirm(null);
      setReason('');
    }, 300);
  }

  function openConfirm(action: 'release_prizes' | 'refund') {
    setReason('');
    setConfirm(action);
  }

  return (
    <div className="space-y-5">
      {/* ───────── تایل‌های کلیدی ───────── */}
      <section className="space-y-3">
        <SectionHeading title="نمای مالی" hint="ارقام به تومان" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-line bg-tile p-5">
              <p className="text-[11px] text-faint">{tile.label}</p>
              {tile.badge ? (
                <div className="mt-2">{tile.badge}</div>
              ) : (
                <p className={`mt-1 font-display text-xl font-bold tnum ${tile.tone}`}>{tile.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────── توزیعِ جایزه + اکشن‌ها ───────── */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3 rounded-2xl border border-line bg-tile p-5">
          <SectionHeading title="توزیعِ جایزه" hint="۵۰٪ / ۳۰٪ / ۲۰٪" />
          <ul className="space-y-2.5">
            {dist.map((d) => (
              <li key={d.rank}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-gold/30 to-accent/20 font-display text-xs font-bold text-white tnum">{d.rank}</span>
                    <span className="text-muted">رتبه‌ی {d.rank}</span>
                    <span className="chip tnum">{fmt(d.pct)}٪</span>
                  </span>
                  <span className="font-semibold tnum text-gold">{money(d.amount)}</span>
                </div>
                <div className="pbar"><span style={{ width: `${d.pct}%` }} /></div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="text-faint">جمعِ کل</span>
            <span className="font-display font-bold tnum text-gold">{money(t.prize)}</span>
          </div>
        </section>

        {/* اکشن‌های مالی */}
        <section className="space-y-3 rounded-2xl border border-line bg-tile p-5">
          <SectionHeading title="اقدامِ مالی" />
          <p className="flex items-start gap-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-[11px] text-faint">
            <svg className="mt-0.5 flex-none text-gold" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <span>آزادسازیِ جایزه نیازمندِ وضعیتِ «در انتظارِ پرداخت» و نبودِ اختلافِ باز است؛ این شرط‌ها هنگامِ اجرا بررسی می‌شوند.</span>
          </p>

          <button
            onClick={() => openConfirm('release_prizes')}
            disabled={!canRelease}
            title={canRelease ? undefined : 'دسترسی لازم را ندارید'}
            className="btn-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            آزادسازیِ جایزه
          </button>
          <button
            onClick={() => openConfirm('refund')}
            disabled={!canRefund}
            title={canRefund ? undefined : 'دسترسی لازم را ندارید'}
            className="btn-danger w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            بازپرداخت
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="rounded-lg border border-line bg-tile2 px-2 py-2">
              <p className="text-[10px] text-faint">escrow</p>
              <div className="mt-1 flex justify-center"><AdminBadge label={escrow.label} tone={escrow.tone} /></div>
            </div>
            <div className="rounded-lg border border-line bg-tile2 px-2 py-2">
              <p className="text-[10px] text-faint">اختلافِ باز</p>
              <p className={`mt-1 font-display text-base font-bold tnum ${t.disputes > 0 ? 'text-bad' : 'text-good'}`}>{fmt(t.disputes)}</p>
            </div>
          </div>
        </section>
      </div>

      {/* ───────── دفترِ مالی ───────── */}
      <section className="space-y-3 rounded-2xl border border-line bg-tile p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading title="دفترِ مالی" hint={`${fmt(rows.length)} تراکنشِ مرتبط`} />
          <select
            value={ledgerFilter}
            onChange={(e) => setLedgerFilter(e.target.value as 'all' | LedgerType)}
            className="rounded-lg border border-line bg-tile2 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-accent-dim"
          >
            <option value="all">همه‌ی انواع</option>
            {ledgerTypes.map((ty) => (
              <option key={ty} value={ty}>{LEDGER_FA[ty]}</option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 py-10 text-center">
            <svg className="text-faint" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" />
            </svg>
            <p className="text-sm text-muted">تراکنشی برای این تورنومنت ثبت نشده است.</p>
            {ledgerFilter !== 'all' && (
              <button onClick={() => setLedgerFilter('all')} className="btn-ghost mt-1 px-3 py-1.5 text-xs">حذفِ فیلتر</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
                  <th className="p-2.5 font-medium">نوع</th>
                  <th className="p-2.5 font-medium">کاربر</th>
                  <th className="p-2.5 font-medium">مبلغ</th>
                  <th className="p-2.5 font-medium">وضعیت</th>
                  <th className="p-2.5 font-medium">مرجع</th>
                  <th className="p-2.5 font-medium">زمان</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const meta = PAYMENT_STATUS_META[e.status];
                  return (
                    <tr key={e.id} className="border-b border-line transition hover:bg-white/[.025]">
                      <td className="p-2.5 text-xs text-slate-200">{LEDGER_FA[e.type]}</td>
                      <td className="p-2.5 text-xs text-muted">{e.user}</td>
                      <td className={`p-2.5 text-xs font-semibold tnum ${e.amount > 0 ? 'text-good' : 'text-bad'}`}>
                        {e.amount > 0 ? '+' : '−'}{money(Math.abs(e.amount))}
                      </td>
                      <td className="p-2.5"><AdminBadge label={meta.label} tone={meta.tone} /></td>
                      <td className="p-2.5 text-[11px] text-faint tnum">{e.ref}</td>
                      <td className="p-2.5 text-[11px] text-faint">{dfa(e.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ───────── گزارشِ عملیات ───────── */}
      <section className="space-y-3 rounded-2xl border border-line bg-tile p-5">
        <SectionHeading title="گزارشِ عملیاتِ مالی" hint="مرتبط با این تورنومنت" />
        <AuditLogList entityId={t.id} limit={8} />
      </section>

      {/* ───────── دیالوگِ تأیید ───────── */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => !busy && setConfirm(null)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-tile p-5 shadow-[0_30px_70px_-25px_rgba(0,0,0,.9)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${confirm === 'refund' ? 'bg-bad/15 text-[#fca5a5]' : 'bg-accent/15 text-accent'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {confirm === 'refund'
                    ? <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 5 5v2" /></>
                    : <><path d="M20 6 9 17l-5-5" /></>}
                </svg>
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  {confirm === 'refund' ? 'تأییدِ بازپرداختِ جایزه' : 'تأییدِ آزادسازیِ جایزه'}
                </h3>
                <p className="text-[11px] text-faint">{t.title} · {money(t.prize)}</p>
              </div>
            </div>

            <p className="mb-3 rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-muted">
              {confirm === 'refund'
                ? 'وجهِ قفل‌شده در escrow به شرکت‌کنندگان بازگردانده می‌شود. این اقدام برگشت‌پذیر نیست.'
                : `جایزه (${money(t.prize)}) آزاد و وضعیتِ تورنومنت «پرداخت‌شده» می‌شود. نیازمندِ نبودِ اختلافِ باز.`}
            </p>

            {confirm === 'refund' && (
              <div className="mb-3">
                <label className="mb-1 block text-xs text-faint">دلیلِ بازپرداخت (الزامی)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="مثلاً: لغوِ تورنومنت به‌دلیلِ نرسیدن به حدِنصاب"
                  className="w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} disabled={busy} className="btn-ghost px-4 py-2 text-sm">انصراف</button>
              <button
                onClick={doConfirm}
                disabled={busy || (confirm === 'refund' && !reason.trim())}
                className={`${confirm === 'refund' ? 'btn-danger' : 'btn-primary'} px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {busy ? 'در حالِ اجرا…' : confirm === 'refund' ? 'بازپرداخت' : 'آزادسازی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
