'use client';

// نمای کلیِ تورنومنت (تبِ OVERVIEW) — کنسولِ عملیاتیِ واقعی، از control board.
// وضعیتِ جاری، سلامتِ عملیاتی، مانعِ بحرانی با اقدامِ مستقیم، «بعد چه می‌شود»،
// مسابقاتِ زنده/بعدی + مهلت‌ها، و عملیاتِ اخیر (هرگز خالیِ تزئینی نیست).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { money, fmt } from '@/lib/admin';
import { useAdminRole, useTournament } from '@/lib/admin/store';
import { useControlRoom } from '@/lib/admin/useControlRoom';
import { roundName, participantById, CRMATCH_FA, type ControlRoomState, type CRMatch } from '@/lib/admin/controlRoom';

const clock = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '—'; } catch { return '—'; } };
const fa = (n: number) => n.toLocaleString('fa-IR');
const ACT_DOT: Record<string, string> = { result: 'bg-accent', dispute: 'bg-bad', admin: 'bg-gold', chat: 'bg-slate-400', payment: 'bg-good', checkin: 'bg-slate-400' };

function Stat({ label, value, sub, tone = 'text-slate-200', href }: { label: string; value: string; sub?: string; tone?: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-tile p-3.5 transition hover:border-accent-dim">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold tnum ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 line-clamp-1 text-[11px] text-faint">{sub}</p>}
    </Link>
  );
}

function MatchRow({ cr, m, base }: { cr: ControlRoomState; m: CRMatch; base: string }) {
  const a = participantById(cr, m.aId)?.name ?? 'TBD';
  const b = participantById(cr, m.bId)?.name ?? 'TBD';
  return (
    <Link href={`${base}/bracket`} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-[12px] transition hover:border-accent-dim">
      <span className="min-w-0 truncate"><span className="tnum text-faint">#{fa(m.number)}</span> {a} <span className="text-faint">—</span> {b}</span>
      <span className="flex-none text-[11px] text-faint">{m.deadline ? `مهلت ${clock(m.deadline)}` : CRMATCH_FA[m.status]}</span>
    </Link>
  );
}

function Overview({ t, role, actorName }: { t: NonNullable<ReturnType<typeof useTournament>>; role: ReturnType<typeof useAdminRole>; actorName: string }) {
  const ctrl = useControlRoom(t, role, actorName);
  const cr = ctrl.cr;
  const id = t.id;
  const base = `/admin/tournaments/${id}`;

  const completed = cr.matches.filter((m) => m.status === 'completed').length;
  const live = cr.matches.filter((m) => m.status === 'live');
  const noShowPending = cr.matches.filter((m) => m.status === 'no_show' || m.status === 'double_no_show').length + cr.participants.filter((p) => p.status === 'no_show').length;
  const overdue = cr.matches.filter((m) => m.status === 'expired');
  const nextMatches = cr.matches.filter((m) => m.status === 'ready' || m.status === 'scheduled' || m.status === 'waiting_for_players').sort((a, b) => Date.parse(a.deadline ?? '0') - Date.parse(b.deadline ?? '0')).slice(0, 5);
  const recentResults = cr.matches.filter((m) => m.status === 'completed' && m.submittedAt).sort((a, b) => Date.parse(b.submittedAt!) - Date.parse(a.submittedAt!)).slice(0, 5);
  const openDispute = cr.disputes.find((d) => d.status === 'open' || d.status === 'under_review');
  const dm = openDispute ? cr.matches.find((m) => m.id === openDispute.matchId) : undefined;
  const needAction = cr.openDisputes + cr.pendingResults + noShowPending;

  // «بعد چه می‌شود» — مشتق از وضعیتِ واقعی
  const next: string[] = [];
  if (cr.openDisputes > 0) next.push(`حلِ ${fa(cr.openDisputes)} اختلافِ باز، مانعِ ساختِ ${cr.nextRound.label} را برمی‌دارد.`);
  if (cr.pendingResults > 0) next.push(`تأییدِ ${fa(cr.pendingResults)} نتیجه‌ی معلق، دورِ جاری را کامل می‌کند.`);
  if (overdue.length > 0) next.push(`تعیینِ تکلیفِ ${fa(overdue.length)} مسابقه‌ی مهلت‌گذشته لازم است.`);
  if (cr.nextRound.ready) next.push(`دور آماده است → می‌توانید ${cr.nextRound.label} را بسازید.`);
  if (t.escrow === 'locked') next.push(`پس از رفعِ همه‌ی موانع و تأییدِ نتایج، ${money(t.prize)} از امانت آزاد می‌شود.`);
  if (next.length === 0) next.push('همه‌چیز در جریان است؛ منتظرِ ثبتِ نتایجِ دورِ جاری هستیم.');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">نمای کلیِ عملیات</h2>
        <AdminBadge label={`${fa(needAction)} موردِ نیازمندِ اقدام`} tone={needAction > 0 ? 'gold' : 'good'} />
      </div>

      {/* وضعیتِ جاری */}
      <div className="rounded-2xl border border-line bg-tile p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><p className="text-[11px] text-faint">مرحله‌ی فعلی</p><p className="mt-0.5 font-display text-sm font-bold">{cr.roundName}</p></div>
          <div><p className="text-[11px] text-faint">پیشرفتِ دور</p><p className="mt-0.5 font-display text-sm font-bold tnum">{fa(cr.currentRoundCompleted)} / {fa(cr.currentRoundTotal)} مسابقه</p></div>
          <div><p className="text-[11px] text-faint">مسابقاتِ زنده</p><p className={`mt-0.5 font-display text-sm font-bold tnum ${live.length ? 'text-[#fca5a5]' : 'text-muted'}`}>{fa(live.length)}</p></div>
          <div><p className="text-[11px] text-faint">اقدامِ بعدی</p><p className="mt-0.5 text-[12px] font-semibold text-[#5eead4]">{cr.openDisputes ? 'حلِ اختلافِ باز' : cr.pendingResults ? 'تأییدِ نتایجِ معلق' : cr.nextRound.ready ? `ساختِ ${cr.nextRound.label}` : 'انتظارِ نتایج'}</p></div>
        </div>
      </div>

      {/* سلامتِ عملیاتی */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="تکمیل‌شده / کل" value={`${fa(completed)}/${fa(cr.matches.length)}`} href={`${base}/bracket`} tone="text-good" />
        <Stat label="نتایجِ معلق" value={fa(cr.pendingResults)} tone={cr.pendingResults ? 'text-gold' : 'text-muted'} sub={cr.pendingResults ? 'در صفِ تأیید' : 'چیزی نیست'} href={`${base}/control-room`} />
        <Stat label="اختلافِ باز" value={fa(cr.openDisputes)} tone={cr.openDisputes ? 'text-[#fca5a5]' : 'text-good'} sub={cr.openDisputes ? 'مانعِ دورِ بعد' : 'بدونِ اختلاف'} href={`${base}/disputes`} />
        <Stat label="عدمِ حضور" value={fa(noShowPending)} tone={noShowPending ? 'text-gold' : 'text-muted'} sub={noShowPending ? 'نیازِ رسیدگی' : '—'} href={`${base}/control-room`} />
        <Stat label="امانی (escrow)" value={t.escrow === 'locked' ? 'قفل' : 'آزاد'} tone={t.escrow === 'locked' ? 'text-gold' : 'text-good'} sub={money(t.prize)} href={`${base}/finance`} />
        <Stat label="پرداختِ معلق" value={fa(t.pendingPayouts)} tone={t.pendingPayouts ? 'text-gold' : 'text-good'} sub={t.pendingPayouts ? 'نیازمندِ آزادسازی' : 'تسویه'} href={`${base}/finance`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* مانعِ بحرانی */}
        <section className={`rounded-2xl border p-5 ${openDispute ? 'border-bad/35 bg-bad/[.05]' : 'border-good/25 bg-good/[.04]'}`}>
          <h3 className="mb-2 font-display text-sm font-bold">{openDispute ? 'مانعِ بحرانی' : 'مانعی وجود ندارد'}</h3>
          {openDispute ? (
            <div className="space-y-2 text-[13px]">
              <p className="font-bold text-text">اختلافِ مسابقه‌ی #{fa(dm?.number ?? 0)} مانعِ {cr.nextRound.label} است</p>
              <p className="text-muted">{openDispute.reason}</p>
              <p className="text-[#fca5a5]"><span className="text-faint">طرفین: </span>{participantById(cr, dm?.aId)?.name ?? '—'} در برابرِ {participantById(cr, dm?.bId)?.name ?? '—'}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`${base}/control-room`} className="btn-danger px-3 py-1.5 text-xs">حلِ اختلاف</Link>
                <Link href={`${base}/disputes`} className="btn-ghost px-3 py-1.5 text-xs">پرونده‌ی اختلاف</Link>
                <Link href={`${base}/bracket`} className="btn-ghost px-3 py-1.5 text-xs">مشاهده‌ی مسابقه</Link>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-good">هیچ اختلاف یا مانعِ بازی نیست؛ دور می‌تواند پیش برود.</p>
          )}
        </section>

        {/* بعد چه می‌شود */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <h3 className="mb-2 font-display text-sm font-bold">بعد چه می‌شود</h3>
          <ul className="space-y-1.5">
            {next.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-6 text-slate-200">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />{s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* زنده / بعدی + مهلت‌ها (empty stateِ actionable) */}
      <section className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">{live.length ? 'مسابقاتِ زنده' : 'مسابقاتِ بعدی و مهلت‌های نزدیک'}</h3>
          <Link href={`${base}/bracket`} className="text-xs font-semibold text-accent">همه‌ی مسابقات ←</Link>
        </div>
        {live.length > 0 ? (
          <div className="space-y-2">{live.map((m) => <MatchRow key={m.id} cr={cr} m={m} base={base} />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-faint">مسابقاتِ بعدی</p>
              {nextMatches.length ? <div className="space-y-1.5">{nextMatches.map((m) => <MatchRow key={m.id} cr={cr} m={m} base={base} />)}</div> : <p className="text-[12px] text-faint">مسابقه‌ی آماده‌ای نیست.</p>}
              {overdue.length > 0 && <p className="mt-2 text-[11px] text-[#fca5a5]">{fa(overdue.length)} مسابقه‌ی مهلت‌گذشته — <Link href={`${base}/control-room`} className="underline">رسیدگی</Link></p>}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-faint">آخرین نتایجِ ثبت‌شده</p>
              {recentResults.length ? <div className="space-y-1.5">{recentResults.map((m) => <MatchRow key={m.id} cr={cr} m={m} base={base} />)}</div> : <p className="text-[12px] text-faint">نتیجه‌ای ثبت نشده.</p>}
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${base}/control-room`} className="btn-primary px-3 py-1.5 text-xs">اتاقِ کنترل</Link>
          <Link href={`${base}/schedule`} className="btn-ghost px-3 py-1.5 text-xs">برنامه‌ی زمان‌بندی</Link>
          <Link href={`${base}/matches`} className="btn-ghost px-3 py-1.5 text-xs">بازبینیِ نتایج</Link>
        </div>
      </section>

      {/* عملیاتِ اخیر — از activityِ control board (هرگز خالیِ تزئینی نیست) */}
      <section className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">عملیاتِ اخیر</h3>
          <Link href={`${base}/control-room`} className="text-xs font-semibold text-accent">فعالیتِ کامل ←</Link>
        </div>
        {cr.activity.length === 0 ? (
          <p className="text-[12px] text-faint">رویدادی ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line">
            {cr.activity.slice(0, 8).map((e) => (
              <li key={e.id}><Link href={`${base}/control-room`} className="flex items-center gap-3 py-2 text-[13px] transition hover:bg-white/[.02]">
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${ACT_DOT[e.kind] ?? 'bg-slate-500'}`} />
                <span className="min-w-0 flex-1 truncate text-slate-200">{e.text}</span>
                <span className="flex-none text-[11px] text-faint">{clock(e.at)}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function TournamentOverviewPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');
  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);
  if (!t) return null;
  return <Overview t={t} role={role} actorName={actorName} />;
}
