'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/admin/cr/Avatar';
import { Drawer } from '@/components/admin/cr/Drawer';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  CRMATCH_FA,
  participantById,
  relTime,
  type ControlRoomState,
  type CRDisputeStatus,
  type CRParticipant,
} from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';
import type { Tone } from '@/lib/admin';

const fa = (n: number) => n.toLocaleString('fa-IR');

const DSTATUS_FA: Record<CRDisputeStatus, string> = {
  open: 'باز',
  under_review: 'در حالِ بررسی',
  resolved: 'حل‌شده',
  rejected: 'نامعتبر',
};
const DSTATUS_TONE: Record<CRDisputeStatus, Tone> = {
  open: 'bad',
  under_review: 'gold',
  resolved: 'good',
  rejected: 'muted',
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function DisputeDrawer({
  cr,
  disputeId,
  onClose,
  onRun,
  onOpenParticipant,
}: {
  cr: ControlRoomState;
  disputeId: string | null;
  onClose: () => void;
  onRun: (a: CRAction, p?: CRPayload) => void;
  onOpenParticipant: (id: string) => void;
}) {
  const d = disputeId ? cr.disputes.find((x) => x.id === disputeId) : undefined;
  const m = d ? cr.matches.find((x) => x.id === d.matchId) : undefined;

  const [reason, setReason] = useState('');
  const [judge, setJudge] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmRematch, setConfirmRematch] = useState(false);
  const [confirmDq, setConfirmDq] = useState(false);

  // reset transient editors whenever the open dispute changes
  useEffect(() => {
    setReason('');
    setJudge('');
    setConfirmReject(false);
    setConfirmRematch(false);
    setConfirmDq(false);
  }, [d?.id]);

  const open = !!disputeId;

  // Drawer requires children even when dispute not found
  if (!d) {
    return (
      <Drawer open={open} onClose={onClose} title={<span className="font-display text-base font-bold text-text">اختلاف</span>}>
        <p className="rounded-2xl border border-line bg-tile2 p-4 text-sm leading-6 text-muted">
          اختلافی انتخاب نشده است. وقتی بازیکنی نتیجه‌ای را به چالش بکشد، اختلاف اینجا با مدارک و کنترل‌های حل باز می‌شود.
        </p>
      </Drawer>
    );
  }

  const a = participantById(cr, m?.aId);
  const b = participantById(cr, m?.bId);
  const reporter = participantById(cr, d.reporterId);
  const accused = participantById(cr, d.accusedId);

  const resolved = d.status === 'resolved' || d.status === 'rejected';
  const aWon = m?.status === 'completed' && m.winnerId === m.aId;
  const bWon = m?.status === 'completed' && m.winnerId === m.bId;

  const trimmedReason = reason.trim();

  const PersonRow = ({
    p,
    role,
    tone,
  }: {
    p?: CRParticipant;
    role: string;
    tone: 'reporter' | 'accused';
  }) => (
    <button
      type="button"
      disabled={!p}
      onClick={() => p && onOpenParticipant(p.id)}
      className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition ${
        tone === 'reporter' ? 'border-accent/30 bg-accent/5' : 'border-line bg-tile2'
      } ${p ? 'hover:border-accent/50' : 'cursor-default'}`}
    >
      <Avatar p={p} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-faint">{role}</span>
        <span className="block truncate text-sm font-medium text-text">{p?.name ?? 'نامشخص'}</span>
      </span>
      {p && <span className="flex-none text-faint"><Icon d="m9 18 6-6-6-6" /></span>}
    </button>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-text">
            اختلافِ مسابقه‌ی #{fa(m?.number ?? 0)}
          </span>
          {!resolved && (
            <span className="inline-flex items-center gap-1 rounded-full border border-bad/30 bg-bad/10 px-2 py-0.5 text-[10px] font-bold text-[#fca5a5]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />
              نیازمندِ رسیدگی
            </span>
          )}
          <AdminBadge label={DSTATUS_FA[d.status]} tone={DSTATUS_TONE[d.status]} />
        </div>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {m && <span>{m.roundName}</span>}
          {d.assignedTo && <span className="text-faint">داور: {d.assignedTo}</span>}
          {d.deadline && <span className="text-faint">مهلت: {relTime(d.deadline)}</span>}
        </span>
      }
    >
      <div className="space-y-4">
        {/* Resolved banner */}
        {resolved && (
          <div className="flex items-start gap-2 rounded-xl border border-line bg-tile2 p-3 text-muted">
            <span className="mt-0.5 flex-none text-good"><Icon d="M20 6 9 17l-5-5" /></span>
            <p className="text-xs leading-5">
              این اختلاف {d.status === 'resolved' ? 'حل و نتیجه نهایی شده است' : 'نامعتبر اعلام شده است'}؛ دیگر اقدامی لازم نیست.
            </p>
          </div>
        )}

        {/* Linked match */}
        <section className={`rounded-2xl border bg-tile p-4 ${resolved ? 'border-line' : 'border-bad/50'}`}>
          <h3 className="mb-2.5 flex items-center justify-between font-display text-sm font-bold text-text">
            <span className="flex items-center gap-1.5">
              <span className="text-accent"><Icon d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M15 7h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4 M12 3v18" /></span>
              مسابقه‌ی موردِ اختلاف
            </span>
            {m && <AdminBadge label={CRMATCH_FA[m.status]} tone={m.status === 'disputed' ? 'bad' : m.status === 'completed' ? 'good' : 'muted'} />}
          </h3>
          {m ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!a}
                onClick={() => a && onOpenParticipant(a.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-2 text-start transition ${
                  aWon ? 'border-good/40 bg-good/10' : bWon ? 'border-line bg-tile2/40 opacity-55' : 'border-line bg-tile2'
                } ${a ? 'hover:border-accent/40' : 'cursor-default'}`}
              >
                <Avatar p={a} size={30} />
                <span className={`min-w-0 truncate text-xs ${aWon ? 'font-display font-bold text-good' : bWon ? 'text-muted' : 'text-text'}`}>
                  {a?.name ?? 'TBD'}
                </span>
              </button>
              <div className="flex flex-none items-center gap-1.5 font-display text-xl font-bold tnum">
                <span className={aWon ? 'text-good' : bWon ? 'text-muted' : 'text-text'}>{fa(m.scoreA)}</span>
                <span className="text-sm text-faint">–</span>
                <span className={bWon ? 'text-good' : aWon ? 'text-muted' : 'text-text'}>{fa(m.scoreB)}</span>
              </div>
              <button
                type="button"
                disabled={!b}
                onClick={() => b && onOpenParticipant(b.id)}
                className={`flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl border p-2 text-end transition ${
                  bWon ? 'border-good/40 bg-good/10' : aWon ? 'border-line bg-tile2/40 opacity-55' : 'border-line bg-tile2'
                } ${b ? 'hover:border-accent/40' : 'cursor-default'}`}
              >
                <span className={`min-w-0 truncate text-xs ${bWon ? 'font-display font-bold text-good' : aWon ? 'text-muted' : 'text-text'}`}>
                  {b?.name ?? 'TBD'}
                </span>
                <Avatar p={b} size={30} />
              </button>
            </div>
          ) : (
            <p className="text-[11px] leading-5 text-faint">مسابقه‌ی مرتبط یافت نشد.</p>
          )}
        </section>

        {/* Reporter + accused */}
        <section className="grid gap-2">
          <PersonRow p={reporter} role="گزارش‌دهنده" tone="reporter" />
          <PersonRow p={accused} role="طرفِ مقابل" tone="accused" />
        </section>

        {/* Reason */}
        <section className="rounded-2xl border border-bad/40 bg-bad/5 p-4">
          <h3 className="mb-1.5 flex items-center gap-1.5 font-display text-sm font-bold text-[#fca5a5]">
            <span className="text-bad"><Icon d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></span>
            شرحِ اختلاف
          </h3>
          <p className="text-xs leading-6 text-text">{d.reason}</p>
          {d.suggestedAction && (
            <p className="mt-2 rounded-lg border border-line bg-tile2 p-2 text-[11px] leading-5 text-muted">
              <span className="font-bold text-accent">اقدامِ پیشنهادی: </span>
              {d.suggestedAction}
            </p>
          )}
        </section>

        {/* Evidence */}
        <section className="rounded-2xl border border-line bg-tile p-4">
          <h3 className="mb-2.5 flex items-center justify-between font-display text-sm font-bold text-text">
            <span className="flex items-center gap-1.5">
              <span className="text-accent"><Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" /></span>
              مدارکِ پیوست
            </span>
            <span className="text-xs text-muted tnum">{fa(d.evidenceCount)}</span>
          </h3>
          {d.evidenceCount > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: d.evidenceCount }, (_, i) => (
                <div key={i} className="grid aspect-video place-items-center rounded-lg border border-line bg-tile2 text-[11px] text-muted">
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-faint"><Icon d="M21 15l-5-5L5 21 M3 5h18v14H3z" /></span>
                    مدرک {fa(i + 1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-5 text-faint">
              هنوز مدرکی (اسکرین‌شات/کلیپ) ضمیمه نشده است؛ با «درخواستِ مدرکِ بیشتر» می‌توانید از طرفین مدرک بخواهید.
            </p>
          )}
        </section>

        {/* Resolution controls */}
        {!resolved ? (
          <>
            {/* Shared reason for resolve/reject */}
            <section className="rounded-2xl border border-line bg-tile p-4">
              <label className="mb-1.5 block text-xs font-bold text-text">
                یادداشتِ تصمیم <span className="font-normal text-faint">(برای حل یا رد ثبت می‌شود)</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثلاً: اسکرین‌شاتِ Cobalt با لاگِ سرور مطابقت دارد؛ نتیجه به‌نفعِ او نهایی شد."
                className="w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-text outline-none focus:border-accent"
              />
            </section>

            {/* Resolve in favor of A / B */}
            <section className="space-y-2">
              <p className="text-[11px] font-bold text-faint">حلِ اختلاف و نهایی‌سازیِ نتیجه</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!a}
                  onClick={() => {
                    onRun('resolve_dispute_a', { disputeId: d.id, reason: trimmedReason || undefined });
                    onClose();
                  }}
                  className="btn-primary flex items-center justify-center gap-1.5 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon d="M20 6 9 17l-5-5" />
                  <span className="truncate">به‌نفعِ {a?.name ?? 'A'}</span>
                </button>
                <button
                  type="button"
                  disabled={!b}
                  onClick={() => {
                    onRun('resolve_dispute_b', { disputeId: d.id, reason: trimmedReason || undefined });
                    onClose();
                  }}
                  className="btn-primary flex items-center justify-center gap-1.5 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon d="M20 6 9 17l-5-5" />
                  <span className="truncate">به‌نفعِ {b?.name ?? 'B'}</span>
                </button>
              </div>
            </section>

            {/* Request more evidence */}
            <button
              type="button"
              onClick={() => onRun('request_evidence', { disputeId: d.id })}
              className="btn-ghost flex w-full items-center justify-center gap-1.5 py-2 text-sm"
            >
              <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
              درخواستِ مدرکِ بیشتر
            </button>

            {/* Assign judge */}
            <section className="rounded-2xl border border-line bg-tile p-4">
              <label className="mb-1.5 block text-xs font-bold text-text">اختصاص به داور</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={judge}
                  onChange={(e) => setJudge(e.target.value)}
                  placeholder="نامِ داور"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <button
                  type="button"
                  disabled={!judge.trim()}
                  onClick={() => {
                    onRun('assign_judge', { disputeId: d.id, judge: judge.trim() });
                    setJudge('');
                  }}
                  className="btn-ghost flex-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  اختصاص
                </button>
              </div>
              {d.assignedTo && (
                <p className="mt-2 text-[11px] text-muted">
                  هم‌اکنون به <span className="font-bold text-text">{d.assignedTo}</span> اختصاص یافته است.
                </p>
              )}
            </section>

            {/* Rematch — resets the match and resolves the dispute (confirm) */}
            {confirmRematch ? (
              <section className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
                <p className="mb-2 text-xs leading-5 text-gold">
                  مسابقه‌ی موردِ اختلاف بازنشانی و برای بازیِ مجدد آماده می‌شود؛ امتیازها صفر و این اختلاف حل‌شده ثبت می‌شود. مطمئن‌اید؟
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRun('rematch', { matchId: d.matchId, reason: trimmedReason || undefined });
                      onClose();
                    }}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    تأییدِ بازیِ مجدد
                  </button>
                  <button type="button" onClick={() => setConfirmRematch(false)} className="btn-ghost px-3 py-1.5 text-xs">
                    انصراف
                  </button>
                </div>
              </section>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRematch(true)}
                className="btn-ghost flex w-full items-center justify-center gap-1.5 py-2 text-sm"
              >
                <Icon d="M3 2v6h6 M21 12a9 9 0 1 1-3-6.7L21 8" />
                بازیِ مجدد
              </button>
            )}

            {/* Disqualify accused — only when an accused party exists (confirm + reason) */}
            {accused && (
              confirmDq ? (
                <section className="rounded-2xl border border-bad/40 bg-bad/5 p-4">
                  <p className="mb-2 text-xs leading-5 text-[#fca5a5]">
                    <span className="font-bold text-text">{accused.name}</span> از تورنومنت محروم می‌شود. این اقدام نهایی است؛ مطمئن‌اید؟
                    {!trimmedReason && <span className="mt-1 block text-[11px] text-faint">پیشنهاد می‌شود دلیلِ محرومیت را در یادداشتِ تصمیم بنویسید.</span>}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onRun('disqualify', { participantId: accused.id, reason: trimmedReason || undefined });
                        onClose();
                      }}
                      className="btn-danger px-3 py-1.5 text-xs"
                    >
                      تأییدِ محرومیت
                    </button>
                    <button type="button" onClick={() => setConfirmDq(false)} className="btn-ghost px-3 py-1.5 text-xs">
                      انصراف
                    </button>
                  </div>
                </section>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDq(true)}
                  className="btn-danger flex w-full items-center justify-center gap-1.5 py-2 text-sm"
                >
                  <Icon d="M18.36 6.64A9 9 0 1 1 5.64 5.64 M12 2v10" />
                  محرومیتِ متهم
                </button>
              )
            )}

            {/* Reject (invalid) — destructive, needs confirm */}
            {confirmReject ? (
              <section className="rounded-2xl border border-bad/40 bg-bad/5 p-4">
                <p className="mb-2 text-xs leading-5 text-[#fca5a5]">
                  این اختلاف نامعتبر اعلام و نتیجه‌ی فعلیِ مسابقه نهایی می‌شود. مطمئن‌اید؟
                  {!trimmedReason && <span className="mt-1 block text-[11px] text-faint">پیشنهاد می‌شود دلیلِ رد را در یادداشتِ تصمیم بنویسید.</span>}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRun('reject_dispute', { disputeId: d.id, reason: trimmedReason || undefined });
                      onClose();
                    }}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    تأییدِ نامعتبری
                  </button>
                  <button type="button" onClick={() => setConfirmReject(false)} className="btn-ghost px-3 py-1.5 text-xs">
                    انصراف
                  </button>
                </div>
              </section>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReject(true)}
                className="btn-danger flex w-full items-center justify-center gap-1.5 py-2 text-sm"
              >
                <Icon d="M18 6 6 18M6 6l12 12" />
                اعلامِ نامعتبر
              </button>
            )}
          </>
        ) : (
          <p className="rounded-2xl border border-line bg-tile2 p-4 text-center text-[11px] leading-5 text-faint">
            این اختلاف بسته شده است؛ کنترل‌های حل غیرفعال‌اند. برای بازبینیِ تصمیم به گزارشِ ممیزی (audit) مراجعه کنید.
          </p>
        )}
      </div>
    </Drawer>
  );
}

export default DisputeDrawer;
