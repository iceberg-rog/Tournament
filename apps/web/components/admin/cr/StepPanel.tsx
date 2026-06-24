'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { money } from '@/lib/admin';
import {
  CRMATCH_FA,
  participantById,
  relTime,
  type CRMatch,
  type ControlRoomState,
  type RoadmapState,
  type RoadmapStep,
} from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';

const STATE_BADGE: Record<RoadmapState, string> = {
  completed: 'border-accent/40 bg-accent/15 text-accent',
  current: 'border-accent/50 bg-accent/15 text-[#5eead4]',
  blocked: 'border-bad/40 bg-bad/15 text-[#fca5a5]',
  warning: 'border-gold/40 bg-gold/15 text-gold',
  pending_admin: 'border-gold/40 bg-gold/15 text-gold',
  upcoming: 'border-line bg-tile2 text-faint',
  locked: 'border-line bg-tile2 text-faint',
};
const STATE_FA: Record<RoadmapState, string> = {
  completed: 'انجام‌شده', current: 'جاری', blocked: 'مسدود', warning: 'هشدار', pending_admin: 'نیازِ اقدام', upcoming: 'بعدی', locked: 'قفل',
};

const MATCH_TONE: Record<string, string> = {
  live: 'border-bad/40 text-[#fca5a5]', disputed: 'border-bad/40 text-[#fca5a5]', no_show: 'border-bad/40 text-[#fca5a5]',
  result_submitted: 'border-gold/35 text-gold', awaiting_opponent_confirmation: 'border-gold/35 text-gold', admin_review: 'border-gold/35 text-gold',
  completed: 'border-good/35 text-good', scheduled: 'border-line text-faint', ready: 'border-line text-muted', waiting_for_players: 'border-line text-faint', cancelled: 'border-line text-faint',
};

interface PanelCtx {
  cr: ControlRoomState;
  onRun: (a: CRAction, p?: CRPayload) => void;
  onOpenMatch: (id: string) => void;
  onOpenDispute: (id: string) => void;
  onOpenParticipant: (id: string) => void;
  onOpenChat: () => void;
  onOpenTab: (tab: 'participants' | 'bracket' | 'disputes' | 'actions') => void;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`mt-0.5 font-display text-base font-bold tnum ${tone ?? 'text-text'}`}>{value}</p>
    </div>
  );
}

function MatchRow({ m, ctx }: { m: CRMatch; ctx: PanelCtx }) {
  const a = participantById(ctx.cr, m.aId);
  const b = participantById(ctx.cr, m.bId);
  const pending = m.status === 'result_submitted' || m.status === 'awaiting_opponent_confirmation' || m.status === 'admin_review';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-faint">مسابقه‌ی #{m.number.toLocaleString('fa-IR')}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${MATCH_TONE[m.status] ?? 'border-line text-faint'}`}>{CRMATCH_FA[m.status]}</span>
      </div>
      {[{ p: a, s: m.scoreA, id: m.aId, win: m.winnerId === m.aId }, { p: b, s: m.scoreB, id: m.bId, win: m.winnerId === m.bId }].map((row, i) => (
        <button key={i} onClick={() => row.id && ctx.onOpenParticipant(row.id)} className={`flex w-full items-center gap-2 rounded-lg px-1 py-1 text-right transition hover:bg-white/[.04] ${m.winnerId ? (row.win ? 'text-accent' : 'text-faint') : 'text-text'}`}>
          <Avatar p={row.p} size={24} />
          <span className={`flex-1 truncate text-[13px] ${row.win ? 'font-bold' : ''}`}>{row.p?.name ?? 'TBD'}</span>
          <span className="tnum text-sm font-bold">{(m.aId || m.bId) ? row.s.toLocaleString('fa-IR') : '—'}</span>
        </button>
      ))}
      {m.blockerReason && <p className="mt-1.5 rounded-lg border border-bad/30 bg-bad/10 px-2 py-1 text-[11px] text-[#fca5a5]">{m.blockerReason}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button onClick={() => ctx.onOpenMatch(m.id)} className="btn-ghost px-2.5 py-1 text-[11px]">بازکردن</button>
        {pending && <button onClick={() => ctx.onRun('approve_result', { matchId: m.id })} className="btn-primary px-2.5 py-1 text-[11px]">تأییدِ نتیجه</button>}
        {m.disputeId && <button onClick={() => ctx.onOpenDispute(m.disputeId!)} className="btn-danger px-2.5 py-1 text-[11px]">حلِ اختلاف</button>}
        {(m.status === 'live' || pending) && <button onClick={() => ctx.onRun('message', { matchId: m.id })} className="btn-ghost px-2.5 py-1 text-[11px]">پیام</button>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">{title}</p>
      {children}
    </div>
  );
}

function RegistrationBody({ ctx }: { ctx: PanelCtx }) {
  const ps = ctx.cr.participants;
  const checkedIn = ps.filter((p) => p.status !== 'registered').length;
  const unpaid = ps.filter((p) => !p.paid).length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="ثبت‌نام‌شده" value={ctx.cr.totalCount.toLocaleString('fa-IR')} />
        <Stat label="چک‌این‌شده" value={checkedIn.toLocaleString('fa-IR')} tone="text-good" />
        <Stat label="پرداختِ معلق" value={unpaid.toLocaleString('fa-IR')} tone={unpaid ? 'text-gold' : undefined} />
        <Stat label="مرحله" value="بسته‌شده" tone="text-faint" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => ctx.onOpenTab('participants')} className="btn-ghost px-3 py-2 text-sm">مشاهده‌ی شرکت‌کننده‌ها</button>
        <button onClick={ctx.onOpenChat} className="btn-ghost px-3 py-2 text-sm">ارسالِ اعلان</button>
      </div>
    </div>
  );
}

function CheckInBody({ ctx }: { ctx: PanelCtx }) {
  const ps = ctx.cr.participants;
  const checkedIn = ps.filter((p) => p.status !== 'registered' && p.status !== 'no_show').length;
  const missing = ps.filter((p) => p.status === 'registered');
  const noShow = ps.filter((p) => p.status === 'no_show');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="چک‌این‌شده" value={checkedIn.toLocaleString('fa-IR')} tone="text-good" />
        <Stat label="باقی‌مانده" value={missing.length.toLocaleString('fa-IR')} tone={missing.length ? 'text-gold' : undefined} />
        <Stat label="غایب" value={noShow.length.toLocaleString('fa-IR')} tone={noShow.length ? 'text-[#fca5a5]' : undefined} />
      </div>
      {noShow.length > 0 && (
        <Section title="نامزدهای عدمِ حضور">
          <div className="space-y-1.5">
            {noShow.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] p-2">
                <Avatar p={p} size={26} />
                <span className="flex-1 truncate text-[13px]">{p.name}</span>
                <button onClick={() => ctx.onRun('restore', { participantId: p.id })} className="btn-ghost px-2 py-1 text-[11px]">بازگردانی</button>
              </div>
            ))}
          </div>
        </Section>
      )}
      <button onClick={() => ctx.onOpenTab('participants')} className="btn-ghost px-3 py-2 text-sm">چک‌اینِ دستی / مدیریتِ شرکت‌کننده‌ها</button>
    </div>
  );
}

function BracketBody({ ctx }: { ctx: PanelCtx }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="براکت" value="ساخته‌شده" tone="text-good" />
        <Stat label="سیدبندی" value="کامل" tone="text-good" />
        <Stat label="وضعیت" value="قفل‌شده" />
        <Stat label="شرکت‌کننده" value={ctx.cr.totalCount.toLocaleString('fa-IR')} />
      </div>
      <button onClick={() => ctx.onOpenTab('bracket')} className="btn-ghost px-3 py-2 text-sm">مشاهده‌ی براکتِ کامل</button>
    </div>
  );
}

function RoundBody({ step, ctx }: { step: RoadmapStep; ctx: PanelCtx }) {
  const matches = ctx.cr.matches.filter((m) => m.round === step.round);
  const completed = matches.filter((m) => m.status === 'completed').length;
  const pending = matches.filter((m) => ['result_submitted', 'awaiting_opponent_confirmation', 'admin_review'].includes(m.status)).length;
  const disputed = matches.filter((m) => m.status === 'disputed').length;
  const locked = step.state === 'locked' || step.state === 'upcoming';

  if (locked) {
    const blockers = ctx.cr.nextRound.blockers;
    const isNextRound = step.round === ctx.cr.currentRound + 1;
    const fa = (n: number) => n.toLocaleString('fa-IR');
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-tile2 p-4 text-center">
          <p className="font-display text-sm font-bold">{isNextRound && blockers.length > 0 ? `${step.label} منتظرِ تکمیلِ دورِ جاری است` : `${step.label} هنوز شروع نشده`}</p>
          <p className="mt-1 text-xs text-faint">{isNextRound ? `با حل/تکمیلِ ${fa(blockers.length)} موردِ زیر، این مرحله به‌صورتِ خودکار فعال می‌شود.` : 'پس از تکمیلِ مراحلِ قبل ساخته می‌شود.'}</p>
        </div>
        {isNextRound && blockers.length > 0 && (
          <Section title={`موانعِ شروع (${fa(blockers.length)})`}>
            <div className="space-y-2">
              {blockers.map((b, i) => (
                <div key={b.matchId ?? `b${i}`} className="rounded-xl border border-bad/25 bg-bad/[.05] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-text">{b.number ? `مسابقه #${fa(b.number)}` : 'بازیکن'}{b.aName ? ` · ${b.aName}${b.bName ? ` در برابرِ ${b.bName}` : ''}` : ''}</span>
                    <span className="rounded-md border border-bad/30 bg-bad/10 px-2 py-0.5 text-[10px] text-[#fca5a5]">{b.status === 'participant' ? 'غایب' : CRMATCH_FA[b.status]}</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-muted">{b.reason}</p>
                  {b.matchId && (
                    <button onClick={() => ctx.onOpenMatch(b.matchId!)} className="btn-ghost mt-2 px-3 py-1.5 text-[11px]">{b.action}</button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
        <button disabled className="btn-primary w-full cursor-not-allowed py-2 text-sm opacity-40">{step.label} (خودکار فعال می‌شود)</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="کامل‌شده" value={`${completed.toLocaleString('fa-IR')}/${matches.length.toLocaleString('fa-IR')}`} />
        <Stat label="معلق" value={pending.toLocaleString('fa-IR')} tone={pending ? 'text-gold' : undefined} />
        <Stat label="اختلاف" value={disputed.toLocaleString('fa-IR')} tone={disputed ? 'text-[#fca5a5]' : undefined} />
      </div>
      <Section title="مسابقاتِ این مرحله">
        <div className="space-y-2">
          {matches.length ? matches.map((m) => <MatchRow key={m.id} m={m} ctx={ctx} />) : <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-faint">مسابقه‌ای برای این مرحله نیست.</p>}
        </div>
      </Section>
    </div>
  );
}

function VerifyBody({ ctx }: { ctx: PanelCtx }) {
  const pending = ctx.cr.matches.filter((m) => ['result_submitted', 'awaiting_opponent_confirmation', 'admin_review'].includes(m.status));
  const disputed = ctx.cr.matches.filter((m) => m.status === 'disputed');
  const approveAll = () => pending.forEach((m) => ctx.onRun('approve_result', { matchId: m.id }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="در انتظارِ تأیید" value={pending.length.toLocaleString('fa-IR')} tone={pending.length ? 'text-gold' : 'text-good'} />
        <Stat label="دارای اختلاف" value={disputed.length.toLocaleString('fa-IR')} tone={disputed.length ? 'text-[#fca5a5]' : undefined} />
      </div>
      {pending.length > 0 && (
        <button onClick={approveAll} className="btn-primary w-full py-2 text-sm">تأییدِ همه‌ی مواردِ سالم</button>
      )}
      {(pending.length > 0 || disputed.length > 0) ? (
        <Section title="موارد">
          <div className="space-y-2">{[...disputed, ...pending].map((m) => <MatchRow key={m.id} m={m} ctx={ctx} />)}</div>
        </Section>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-faint">نتیجه‌ای در انتظارِ تأیید نیست؛ همه‌ی نتایج نهایی شده‌اند.</p>
      )}
    </div>
  );
}

function PayoutBody({ step, ctx }: { step: RoadmapStep; ctx: PanelCtx }) {
  const champ = participantById(ctx.cr, ctx.cr.summary.championId ?? ctx.cr.summary.leadingId);
  const runner = participantById(ctx.cr, ctx.cr.summary.runnerUpId);
  const blockers: string[] = [];
  if (ctx.cr.openDisputes > 0) blockers.push('اختلافِ باز وجود دارد');
  if (ctx.cr.phase !== 'payout_pending' && ctx.cr.phase !== 'paid') blockers.push('تورنومنت هنوز به مرحله‌ی پرداخت نرسیده');
  const canRelease = ctx.cr.phase === 'payout_pending' && ctx.cr.openDisputes === 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="جایزه‌ی کل" value={money(ctx.cr.prize)} tone="text-gold" />
        <Stat label="وضعیت" value={ctx.cr.phase === 'paid' ? 'پرداخت‌شده' : ctx.cr.phase === 'payout_pending' ? 'در انتظار' : 'قفل'} tone={ctx.cr.phase === 'paid' ? 'text-good' : 'text-faint'} />
      </div>
      {(champ || runner) && (
        <div className="space-y-1.5">
          {champ && <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 p-2"><Avatar p={champ} size={26} /><span className="flex-1 truncate text-[13px] font-bold">{champ.name}</span><span className="text-[11px] text-gold">قهرمان</span></div>}
          {runner && <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] p-2"><Avatar p={runner} size={26} /><span className="flex-1 truncate text-[13px]">{runner.name}</span><span className="text-[11px] text-faint">نایب‌قهرمان</span></div>}
        </div>
      )}
      {blockers.length > 0 && (
        <Section title="موانعِ پرداخت">
          <ul className="space-y-1.5">{blockers.map((b, i) => <li key={i} className="rounded-lg border border-bad/25 bg-bad/[.06] px-3 py-2 text-[12px] text-[#fca5a5]">{b}</li>)}</ul>
        </Section>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => ctx.onRun('release_prize')} disabled={!canRelease} className="btn-primary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">آزادسازیِ جایزه</button>
        <Link href={`/admin/tournaments/${ctx.cr.tournamentId}/finance`} className="btn-ghost px-3 py-2 text-sm">مشاهده‌ی ledger</Link>
      </div>
    </div>
  );
}

export function StepPanel({
  cr,
  step,
  onClose,
  onRun,
  onOpenMatch,
  onOpenDispute,
  onOpenParticipant,
  onOpenChat,
  onOpenTab,
}: {
  cr: ControlRoomState;
  step: RoadmapStep | null;
  onClose: () => void;
} & Omit<PanelCtx, 'cr'>) {
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  if (!step) return null;
  const ctx: PanelCtx = { cr, onRun, onOpenMatch, onOpenDispute, onOpenParticipant, onOpenChat, onOpenTab };

  return (
    <div className="fixed inset-0 z-[115]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-white/10 bg-[rgba(16,18,24,.86)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,.8)] backdrop-blur-2xl animate-[fade-up_.2s_ease] md:inset-y-0 md:bottom-auto md:end-0 md:h-full md:max-h-none md:w-[460px] md:rounded-t-none md:border-s md:border-t-0">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold">{step.label}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATE_BADGE[step.state]}`}>{STATE_FA[step.state]}</span>
            </div>
            {step.badge && <p className="mt-0.5 text-[11px] text-faint">{step.badge}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-white/10 text-faint hover:text-text" aria-label="بستن">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* blocker banner */}
        {(step.state === 'blocked' || step.blockerReason) && step.blockerReason && (
          <div className="mx-4 mt-3 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-[12px] text-[#fca5a5]">{step.blockerReason}</div>
        )}

        {/* body — کلیک روی اکشن‌ها پنل را می‌بندد تا drawer/تب باز شود */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4" onClickCapture={(e) => { if ((e.target as HTMLElement).closest('button,a')) onClose(); }}>
          {step.kind === 'registration' && <RegistrationBody ctx={ctx} />}
          {step.kind === 'check_in' && <CheckInBody ctx={ctx} />}
          {step.kind === 'bracket' && <BracketBody ctx={ctx} />}
          {step.kind === 'round' && <RoundBody step={step} ctx={ctx} />}
          {step.kind === 'verify' && <VerifyBody ctx={ctx} />}
          {step.kind === 'payout' && <PayoutBody step={step} ctx={ctx} />}
        </div>
      </div>
    </div>
  );
}
