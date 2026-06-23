'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { Drawer } from '@/components/admin/cr/Drawer';
import { useAdminRole, useEnsureAdminRole, useTournaments, appendAudit, pushToast } from '@/lib/admin/store';
import { ADMIN_ROLE_FA, type AdminRole } from '@/lib/admin/ops';
import { fmt } from '@/lib/admin';
import {
  buildActionQueue,
  roleCanSee,
  slaLabel,
  GROUP_META,
  TYPE_FA,
  type AdminActionItem,
  type AdminActionPriority,
  type AdminActionStatus,
  type AdminActionType,
  type ActionGroup,
} from '@/lib/admin/actionQueue';

const PRI: Record<AdminActionPriority, { rail: string; chip: string; label: string }> = {
  critical: { rail: 'bg-bad', chip: 'border-bad/40 bg-bad/15 text-[#fca5a5]', label: 'بحرانی' },
  urgent: { rail: 'bg-[#fb923c]', chip: 'border-[#fb923c]/40 bg-[#fb923c]/15 text-[#fdba74]', label: 'فوری' },
  normal: { rail: 'bg-accent', chip: 'border-accent/30 bg-accent/15 text-[#5eead4]', label: 'عادی' },
  low: { rail: 'bg-slate-500', chip: 'border-line bg-tile2 text-muted', label: 'کم‌اولویت' },
};
const STATUS_FA: Record<AdminActionStatus, string> = { open: 'باز', in_review: 'در حالِ بررسی', waiting_external: 'منتظرِ پاسخ', resolved: 'رسیدگی‌شده', dismissed: 'نادیده', };
const STATUS_TONE: Record<AdminActionStatus, string> = { open: 'text-muted', in_review: 'text-gold', waiting_external: 'text-accent', resolved: 'text-good', dismissed: 'text-faint' };
const OPEN_STATES: AdminActionStatus[] = ['open', 'in_review', 'waiting_external'];

interface Decision { label: string; kind: 'resolve' | 'review' | 'wait' | 'dismiss' | 'link'; href?: string; danger?: boolean; }
function decisionsFor(item: AdminActionItem): Decision[] {
  const open = { label: 'بازکردن در ابزار', kind: 'link' as const, href: item.href };
  switch (item.type) {
    case 'dispute':
      return [
        { label: `حل به‌نفعِ ${item.playerNames?.a ?? 'A'}`, kind: 'resolve' },
        { label: `حل به‌نفعِ ${item.playerNames?.b ?? 'B'}`, kind: 'resolve' },
        { label: 'درخواستِ مدرکِ بیشتر', kind: 'wait' },
        open,
        { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true },
      ];
    case 'missing_result':
      return [{ label: 'ثبتِ عدمِ حضور', kind: 'resolve' }, { label: 'انتقال به بازبینیِ مدیر', kind: 'review' }, open, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
    case 'no_show':
      return [{ label: 'تأییدِ عدمِ حضور و صعودِ حریف', kind: 'resolve' }, { label: 'ارسالِ اخطار', kind: 'resolve' }, open, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
    case 'double_no_show':
      return [{ label: 'اخطار به هر دو و بازبینی', kind: 'resolve' }, open, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
    case 'invalid_evidence':
      return [{ label: 'ابطالِ مدرک و درخواستِ مجدد', kind: 'wait' }, open, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
    case 'payout':
      return [{ label: 'مشاهده‌ی موانعِ پرداخت', kind: 'link', href: item.href }, { label: 'نگه‌داشتنِ پرداخت', kind: 'wait' }, { label: 'درخواستِ KYC', kind: 'wait' }, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
    case 'tournament_approval':
      return [{ label: 'تأییدِ تورنومنت', kind: 'resolve' }, { label: 'ردِ تورنومنت', kind: 'resolve', danger: true }, { label: 'درخواستِ اصلاح', kind: 'wait' }, open];
    case 'organizer_request':
      return [{ label: 'تأییدِ درخواست', kind: 'resolve' }, { label: 'ردِ درخواست', kind: 'resolve', danger: true }, { label: 'درخواستِ اطلاعات', kind: 'wait' }, open];
    case 'kyc':
      return [{ label: 'تأییدِ احرازِ هویت', kind: 'resolve' }, { label: 'ردِ احرازِ هویت', kind: 'resolve', danger: true }, { label: 'درخواستِ اطلاعات', kind: 'wait' }, open];
    case 'report':
      return [{ label: 'اقدام و بستن', kind: 'resolve' }, { label: 'ردِ گزارش', kind: 'dismiss' }, open];
    default:
      return [{ label: 'رسیدگی‌شده', kind: 'resolve' }, open, { label: 'نادیده‌گرفتن', kind: 'dismiss', danger: true }];
  }
}

function Console({ role, actorName }: { role: AdminRole; actorName: string }) {
  const router = useRouter();
  const tournaments = useTournaments();
  const all = useMemo(() => buildActionQueue(tournaments).filter((i) => roleCanSee(role, i.type)), [tournaments, role]);

  const [status, setStatus] = useState<Record<string, AdminActionStatus>>({});
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [fPriority, setFPriority] = useState<'all' | AdminActionPriority>('all');
  const [fType, setFType] = useState<'all' | AdminActionType>('all');
  const [fStatus, setFStatus] = useState<'open' | 'all' | 'resolved'>('open');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ live_ops: false });
  const [sel, setSel] = useState<string | null>(null);

  const eff = (i: AdminActionItem): AdminActionStatus => status[i.id] ?? i.status;
  const isOpen = (i: AdminActionItem) => OPEN_STATES.includes(eff(i));

  const summary = useMemo(() => {
    const open = all.filter(isOpen);
    return {
      open: open.length,
      critical: open.filter((i) => i.priority === 'critical').length,
      urgent: open.filter((i) => i.priority === 'urgent').length,
      overdue: open.filter((i) => i.sla === 'overdue').length,
      mine: open.filter((i) => assigned[i.id] === actorName).length,
      finance: open.filter((i) => i.group === 'finance' || (i.group === 'critical_blockers' && i.type === 'payout')).length,
      moderation: open.filter((i) => i.group === 'moderation').length,
      tournament: open.filter((i) => i.group === 'tournament_review').length,
    };
  }, [all, status, assigned]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      const s = eff(i);
      if (fStatus === 'open' && !OPEN_STATES.includes(s)) return false;
      if (fStatus === 'resolved' && OPEN_STATES.includes(s)) return false;
      if (fPriority !== 'all' && i.priority !== fPriority) return false;
      if (fType !== 'all' && i.type !== fType) return false;
      if (q && !`${i.title} ${i.entityLine} ${i.reason ?? ''} ${TYPE_FA[i.type]}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, status, fPriority, fType, fStatus, search]);

  const groups = useMemo(() => {
    const map = new Map<ActionGroup, AdminActionItem[]>();
    for (const i of filtered) {
      if (!map.has(i.group)) map.set(i.group, []);
      map.get(i.group)!.push(i);
    }
    return [...map.entries()].sort((a, b) => GROUP_META[a[0]].order - GROUP_META[b[0]].order);
  }, [filtered]);

  const selected = sel ? all.find((i) => i.id === sel) ?? null : null;
  const types = useMemo(() => Array.from(new Set(all.map((i) => i.type))), [all]);

  function openItem(id: string) {
    setSel(id);
    setStatus((m) => (m[id] && m[id] !== 'open' ? m : { ...m, [id]: 'in_review' }));
  }
  function decide(item: AdminActionItem, dec: Decision) {
    if (dec.kind === 'link') {
      if (dec.href) router.push(dec.href);
      return;
    }
    const ns: AdminActionStatus = dec.kind === 'resolve' ? 'resolved' : dec.kind === 'wait' ? 'waiting_external' : dec.kind === 'review' ? 'in_review' : 'dismissed';
    setStatus((m) => ({ ...m, [item.id]: ns }));
    appendAudit({ actor: actorName, actorRole: role, action: dec.label, entityType: item.matchId ? 'match' : item.tournamentId ? 'tournament' : 'action', entityId: item.matchId ?? item.tournamentId ?? item.id });
    pushToast({ kind: dec.danger ? 'info' : 'success', msg: `${dec.label} — ${item.title}` });
    if (ns === 'resolved' || ns === 'dismissed') setSel(null);
  }

  const overview = [
    { key: 'critical', label: 'بحرانی', value: summary.critical, tone: 'text-[#fca5a5]', hint: 'مانعِ ادامه‌ی تورنومنت یا پرداخت', set: () => setFPriority('critical') },
    { key: 'urgent', label: 'فوری', value: summary.urgent, tone: 'text-[#fdba74]', hint: 'نیازِ رسیدگیِ سریع', set: () => setFPriority('urgent') },
    { key: 'open', label: 'در انتظارِ تصمیم', value: summary.open, tone: 'text-text', hint: 'کلِ اقدام‌های باز', set: () => { setFPriority('all'); setFType('all'); setFStatus('open'); } },
    { key: 'overdue', label: 'Overdue', value: summary.overdue, tone: 'text-[#fca5a5]', hint: 'مهلت گذشته', set: () => {} },
    { key: 'finance', label: 'مالی', value: summary.finance, tone: 'text-gold', hint: 'پرداخت/بازپرداخت', set: () => setFType('payout') },
    { key: 'moderation', label: 'نظارت', value: summary.moderation, tone: 'text-gold', hint: 'گزارش‌ها', set: () => setFType('report') },
    { key: 'tournament', label: 'تورنومنت', value: summary.tournament, tone: 'text-accent', hint: 'تأییدِ تورنومنت', set: () => setFType('tournament_approval') },
  ];

  const selCls = 'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';
  const hasFilter = fPriority !== 'all' || fType !== 'all' || fStatus !== 'open' || !!search;

  return (
    <div className="space-y-5">
      <PageHeader
        title="صفِ اقدامات"
        subtitle="کارهایی که همین حالا نیاز به تصمیمِ مدیر دارند؛ به ترتیبِ اولویت و اثر روی عملیات."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border border-gold/30 bg-gold/10 text-gold">QA / Mock</span>
            <Link href="/admin" className="btn-ghost px-3 py-2 text-sm">نمای داشبورد</Link>
            <button onClick={() => { setFPriority('critical'); setFStatus('open'); }} className="btn-ghost px-3 py-2 text-sm">فقط بحرانی‌ها</button>
          </div>
        }
      />

      {/* خلاصه‌ی header */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="chip border border-line bg-tile2 text-muted">بازِ کل: <b className="tnum text-text">{fmt(summary.open)}</b></span>
        <span className="chip border border-bad/30 bg-bad/10 text-[#fca5a5]">بحرانی: <b className="tnum">{fmt(summary.critical)}</b></span>
        <span className="chip border border-[#fb923c]/30 bg-[#fb923c]/10 text-[#fdba74]">فوری: <b className="tnum">{fmt(summary.urgent)}</b></span>
        <span className="chip border border-line bg-tile2 text-muted">Overdue: <b className="tnum">{fmt(summary.overdue)}</b></span>
        <span className="chip border border-accent/30 bg-accent/10 text-accent">واگذارشده به من: <b className="tnum">{fmt(summary.mine)}</b></span>
      </div>

      {/* نمای اولویت */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {overview.map((c) => (
          <button key={c.key} onClick={c.set} className="rounded-2xl border border-line bg-tile p-3.5 text-right transition hover:border-accent-dim">
            <p className="text-[11px] text-faint">{c.label}</p>
            <p className={`mt-1 font-display text-xl font-bold tnum ${c.tone}`}>{fmt(c.value)}</p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-faint">{c.hint}</p>
          </button>
        ))}
      </div>

      {/* فیلترها */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جست‌وجو: عنوان، تورنومنت، بازیکن…" className="min-w-[180px] flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" />
        <select value={fPriority} onChange={(e) => setFPriority(e.target.value as 'all' | AdminActionPriority)} className={selCls}>
          <option value="all">همه‌ی اولویت‌ها</option><option value="critical">بحرانی</option><option value="urgent">فوری</option><option value="normal">عادی</option><option value="low">کم‌اولویت</option>
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value as 'all' | AdminActionType)} className={selCls}>
          <option value="all">همه‌ی انواع</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_FA[t]}</option>)}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value as 'open' | 'all' | 'resolved')} className={selCls}>
          <option value="open">باز</option><option value="resolved">رسیدگی‌شده</option><option value="all">همه</option>
        </select>
        {hasFilter && <button onClick={() => { setFPriority('all'); setFType('all'); setFStatus('open'); setSearch(''); }} className="rounded-lg border border-line px-3 py-2 text-xs text-faint hover:text-text">پاک‌کردنِ فیلترها</button>}
        <span className="ms-auto text-xs text-faint tnum">{fmt(filtered.length)} مورد</span>
      </div>

      {/* صفِ گروه‌بندی‌شده */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-tile2 p-12 text-center">
          <p className="font-display text-sm font-bold">{hasFilter ? 'موردی با این فیلتر پیدا نشد' : 'اقدامِ بازی وجود ندارد'}</p>
          <p className="mt-1 text-xs text-faint">{hasFilter ? 'فیلترها را پاک کن.' : 'همه‌ی عملیات‌های ضروری رسیدگی شده‌اند.'}</p>
          {hasFilter && <button onClick={() => { setFPriority('all'); setFType('all'); setFStatus('open'); setSearch(''); }} className="btn-ghost mt-3 px-4 py-2 text-xs">پاک‌کردنِ فیلترها</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([g, items]) => {
            const isCol = collapsed[g];
            return (
              <section key={g} className="overflow-hidden rounded-2xl border border-line bg-tile">
                <button onClick={() => setCollapsed((m) => ({ ...m, [g]: !m[g] }))} className="flex w-full items-center justify-between px-4 py-3 text-right">
                  <span className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`text-faint transition ${isCol ? '' : 'rotate-90'}`}><path d="M9 6l6 6-6 6" /></svg>
                    <span className="font-display text-sm font-bold">{GROUP_META[g].label}</span>
                    <span className="tnum rounded-full bg-tile2 px-2 text-[11px] text-muted">{fmt(items.length)}</span>
                  </span>
                  {g === 'critical_blockers' && items.length > 0 && <span className="text-[11px] text-[#fca5a5]">قفل‌کننده‌ی سیستم</span>}
                </button>
                {!isCol && (
                  <ul className="space-y-2 border-t border-line p-3">
                    {items.map((i) => {
                      const p = PRI[i.priority];
                      const s = eff(i);
                      return (
                        <li key={i.id} className="relative overflow-hidden rounded-xl border border-line bg-tile2">
                          <span className={`absolute inset-y-2 start-0 w-1 rounded-full ${p.rail}`} />
                          <button onClick={() => openItem(i.id)} className="block w-full p-3.5 ps-4 text-right transition hover:bg-white/[.02]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${p.chip}`}>{p.label}</span>
                              <span className="rounded-full border border-line bg-tile px-2 py-0.5 text-[10px] text-muted">{TYPE_FA[i.type]}</span>
                              {i.sla === 'overdue' && <span className="rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 text-[10px] text-[#fca5a5]">{slaLabel(i)}</span>}
                              {i.sla === 'due_soon' && <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">{slaLabel(i)}</span>}
                              <span className={`ms-auto text-[10px] ${STATUS_TONE[s]}`}>{STATUS_FA[s]}</span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-text">{i.title}</p>
                            <p className="mt-0.5 text-[11px] text-faint">{i.entityLine}</p>
                            {i.impact && <p className="mt-1.5 text-[11.5px] text-[#fca5a5]"><span className="text-faint">اثر: </span>{i.impact}</p>}
                          </button>
                          <div className="flex items-center gap-2 border-t border-line px-3.5 py-2">
                            <button onClick={() => openItem(i.id)} className="btn-primary px-3 py-1.5 text-xs">{i.primaryLabel}</button>
                            <Link href={i.href} onClick={(e) => e.stopPropagation()} className="btn-ghost px-3 py-1.5 text-xs">بازکردن در ابزار</Link>
                            {assigned[i.id] !== actorName && <button onClick={() => setAssigned((m) => ({ ...m, [i.id]: actorName }))} className="ms-auto text-[11px] text-faint hover:text-text">واگذاری به من</button>}
                            {assigned[i.id] === actorName && <span className="ms-auto text-[11px] text-accent">به من واگذار شده</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* drawer */}
      <Drawer open={!!selected} onClose={() => setSel(null)} width={460}
        title={selected ? <span className="font-display text-base font-bold">{TYPE_FA[selected.type]}</span> : ''}
        subtitle={selected?.entityLine}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRI[selected.priority].chip}`}>{PRI[selected.priority].label}</span>
              <span className={`rounded-full border border-line bg-tile2 px-2 py-0.5 text-[10px] ${STATUS_TONE[eff(selected)]}`}>{STATUS_FA[eff(selected)]}</span>
              <span className="rounded-full border border-line bg-tile2 px-2 py-0.5 text-[10px] text-faint">{slaLabel(selected)}</span>
            </div>
            <h3 className="font-display text-[15px] font-bold leading-snug">{selected.title}</h3>
            {selected.reason && <div className="rounded-xl border border-line bg-tile2 p-3 text-[13px] leading-6"><span className="text-faint">دلیل: </span>{selected.reason}</div>}
            {selected.impact && <div className="rounded-xl border border-bad/25 bg-bad/[.06] p-3 text-[13px] leading-6 text-[#fca5a5]"><span className="text-faint">اثر: </span>{selected.impact}</div>}
            {selected.playerNames?.a && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">طرفِ A</p><p className="mt-0.5 text-sm font-bold">{selected.playerNames.a}</p></div>
                <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">طرفِ B</p><p className="mt-0.5 text-sm font-bold">{selected.playerNames.b ?? 'TBD'}</p></div>
              </div>
            )}
            <p className="text-[11px] text-faint">{assigned[selected.id] ? `واگذارشده به: ${assigned[selected.id]}` : 'واگذارنشده'}</p>
            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-xs font-semibold text-muted">تصمیم</p>
              <div className="flex flex-col gap-2">
                {decisionsFor(selected).map((dec, idx) => (
                  <button key={idx} onClick={() => decide(selected, dec)}
                    className={`px-3.5 py-2.5 text-sm ${dec.kind === 'link' ? 'btn-ghost' : dec.danger ? 'btn-danger' : dec.kind === 'resolve' ? 'btn-primary' : 'btn-ghost'}`}>
                    {dec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function ActionQueuePage() {
  useEnsureAdminRole();
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');
  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);
  return (
    <AdminGuard>
      <Console role={role} actorName={actorName} />
    </AdminGuard>
  );
}
