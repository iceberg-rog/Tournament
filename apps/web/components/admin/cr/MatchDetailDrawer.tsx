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
  type CRMatchStatus,
  type CRParticipant,
} from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';
import type { Tone } from '@/lib/admin';

const STATUS_TONE: Record<CRMatchStatus, Tone> = {
  scheduled: 'muted',
  waiting_for_players: 'muted',
  ready: 'accent',
  live: 'good',
  result_submitted: 'gold',
  awaiting_opponent_confirmation: 'gold',
  admin_review: 'gold',
  disputed: 'bad',
  completed: 'good',
  no_show: 'bad',
  double_no_show: 'bad',
  expired: 'gold',
  cancelled: 'muted',
};

const fa = (n: number) => n.toLocaleString('fa-IR');

function Icon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function MatchDetailDrawer({
  cr,
  matchId,
  onClose,
  onRun,
  onOpenParticipant,
}: {
  cr: ControlRoomState;
  matchId: string | null;
  onClose: () => void;
  onRun: (a: CRAction, p?: CRPayload) => void;
  onOpenParticipant: (id: string) => void;
}) {
  const m = matchId ? cr.matches.find((x) => x.id === matchId) : undefined;

  const [sa, setSa] = useState(0);
  const [sb, setSb] = useState(0);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [invalidating, setInvalidating] = useState(false);
  const [evReason, setEvReason] = useState('');

  // sync editor + transient UI whenever the open match changes
  useEffect(() => {
    if (m) {
      setSa(m.scoreA);
      setSb(m.scoreB);
    }
    setRejecting(false);
    setReason('');
    setInvalidating(false);
    setEvReason('');
  }, [m?.id, m?.scoreA, m?.scoreB]);

  const open = !!matchId;
  // Drawer requires children even when match not found
  if (!m) {
    return (
      <Drawer open={open} onClose={onClose} title={<span className="font-display text-base font-bold text-text">مسابقه</span>}>
        <p className="rounded-2xl border border-line bg-tile2 p-4 text-sm text-muted">
          مسابقه‌ای انتخاب نشده است. روی یک مسابقه بزنید تا جزئیاتش اینجا باز شود.
        </p>
      </Drawer>
    );
  }

  const a = participantById(cr, m.aId);
  const b = participantById(cr, m.bId);
  const dispute = m.disputeId ? cr.disputes.find((d) => d.id === m.disputeId) : undefined;
  const submitter = participantById(cr, m.submittedById);

  const isDisputed = m.status === 'disputed' || !!dispute;
  const isLive = m.status === 'live';
  const isPending = m.status === 'result_submitted' || m.status === 'awaiting_opponent_confirmation' || m.status === 'admin_review';
  const isCompleted = m.status === 'completed';
  const aWon = isCompleted && m.winnerId === m.aId;
  const bWon = isCompleted && m.winnerId === m.bId;

  const isDoubleNoShow = m.status === 'double_no_show';
  const isAdminReview = m.status === 'admin_review';
  const isNoShowOrExpired = m.status === 'no_show' || m.status === 'expired';
  // نگرانیِ مدرک: یا در بازبینیِ مدیر است، یا blockerReason به مدرکِ نامعتبر اشاره دارد
  const evidenceConcern = isAdminReview || (!!m.blockerReason && m.blockerReason.includes('مدرک'));

  const Side = ({ p, won, lost, fallback }: { p?: CRParticipant; won: boolean; lost: boolean; fallback: string }) => (
    <button
      type="button"
      disabled={!p}
      onClick={() => p && onOpenParticipant(p.id)}
      className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition ${
        won ? 'border-good/40 bg-good/10' : lost ? 'border-line bg-tile2/40 opacity-55' : 'border-line bg-tile2'
      } ${p ? 'hover:border-accent/40' : 'cursor-default'}`}
    >
      <Avatar p={p} size={36} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${won ? 'font-display font-bold text-good' : lost ? 'text-muted' : 'font-medium text-text'}`}>
          {p?.name ?? fallback}
        </span>
        {won && <span className="text-[10px] font-bold text-good">برنده</span>}
        {lost && <span className="text-[10px] text-faint">بازنده</span>}
      </span>
    </button>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-text">مسابقه‌ی #{fa(m.number)}</span>
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full border border-good/30 bg-good/10 px-2 py-0.5 text-[10px] font-bold text-good">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
              زنده
            </span>
          )}
          <AdminBadge label={CRMATCH_FA[m.status]} tone={STATUS_TONE[m.status]} />
        </div>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span>{m.roundName}</span>
          {m.map && <span className="text-faint">نقشه: {m.map}</span>}
          {m.deadline && <span className="text-faint">مهلت: {relTime(m.deadline)}</span>}
        </span>
      }
    >
      <div className="space-y-4">
        {/* Blocker banner */}
        {m.blockerReason && (
          <div className="flex items-start gap-2 rounded-xl border border-bad/40 bg-bad/10 p-3 text-[#fca5a5]">
            <span className="mt-0.5 flex-none text-bad">
              <Icon d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </span>
            <p className="text-xs font-medium leading-5">{m.blockerReason}</p>
          </div>
        )}

        {/* Score area */}
        <section className={`rounded-2xl border bg-tile p-4 ${isDisputed ? 'border-bad/50' : 'border-line'}`}>
          <Side p={a} won={aWon} lost={bWon} fallback="بازیکنِ A — هنوز مشخص نیست" />
          <div className="my-2 flex items-center justify-center gap-3">
            <span className={`font-display text-3xl font-bold tnum ${aWon ? 'text-good' : bWon ? 'text-muted' : 'text-text'}`}>{fa(m.scoreA)}</span>
            <span className="text-lg text-faint">–</span>
            <span className={`font-display text-3xl font-bold tnum ${bWon ? 'text-good' : aWon ? 'text-muted' : 'text-text'}`}>{fa(m.scoreB)}</span>
          </div>
          <Side p={b} won={bWon} lost={aWon} fallback="بازیکنِ B — هنوز مشخص نیست" />

          <div className="mt-3 border-t border-line pt-3 text-xs text-muted">
            {submitter ? (
              <span className="flex flex-wrap items-center gap-1.5">
                <Avatar p={submitter} size={18} />
                <span className="text-text">{submitter.name}</span>
                <span>نتیجه را ثبت کرد</span>
                {m.submittedAt && <span className="text-faint">· {relTime(m.submittedAt)}</span>}
              </span>
            ) : (
              <span className="text-faint">هنوز نتیجه‌ای ثبت نشده است.</span>
            )}
          </div>
        </section>

        {/* Inline score editor */}
        <section className="rounded-2xl border border-line bg-tile p-4">
          <h3 className="mb-2.5 flex items-center gap-1.5 font-display text-sm font-bold text-text">
            <span className="text-accent"><Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></span>
            ویرایش و ثبتِ امتیاز
          </h3>
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block truncate text-[11px] text-faint">{a?.name ?? 'A'}</span>
              <input
                type="number"
                min={0}
                value={sa}
                onChange={(e) => setSa(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-center font-display text-lg tnum text-text outline-none focus:border-accent"
              />
            </label>
            <span className="pb-2 text-faint">–</span>
            <label className="flex-1">
              <span className="mb-1 block truncate text-[11px] text-faint">{b?.name ?? 'B'}</span>
              <input
                type="number"
                min={0}
                value={sb}
                onChange={(e) => setSb(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-center font-display text-lg tnum text-text outline-none focus:border-accent"
              />
            </label>
            <button
              type="button"
              onClick={() => onRun('edit_score', { matchId: m.id, scoreA: sa, scoreB: sb })}
              className="btn-primary flex-none px-4 py-2 text-sm"
            >
              ثبتِ امتیاز
            </button>
          </div>
          <p className="mt-2 text-[11px] text-faint">با ثبتِ امتیاز، نتیجه نهایی و برنده بر اساس امتیازِ بیشتر تعیین می‌شود.</p>
        </section>

        {/* Dispute */}
        {dispute && (
          <section className="rounded-2xl border border-bad/50 bg-bad/5 p-4">
            <h3 className="mb-1.5 flex items-center gap-1.5 font-display text-sm font-bold text-[#fca5a5]">
              <span className="text-bad"><Icon d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></span>
              اختلافِ باز
            </h3>
            <p className="text-xs leading-5 text-text">{dispute.reason}</p>
            {dispute.suggestedAction && <p className="mt-1.5 text-[11px] leading-5 text-muted">پیشنهاد: {dispute.suggestedAction}</p>}
            <p className="mt-2 rounded-lg border border-line bg-tile2 p-2 text-[11px] leading-5 text-muted">
              این اختلاف باید در پنلِ «اختلاف‌ها» رسیدگی و حل شود؛ تا حلِ آن، نتیجه‌ی این مسابقه نهایی نمی‌شود.
            </p>
          </section>
        )}

        {/* Evidence */}
        <section className="rounded-2xl border border-line bg-tile p-4">
          <h3 className="mb-2.5 flex items-center justify-between font-display text-sm font-bold text-text">
            <span className="flex items-center gap-1.5">
              <span className="text-accent"><Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" /></span>
              مدارک
            </span>
            <span className="text-xs text-muted tnum">{fa(m.evidenceCount)}</span>
          </h3>
          {m.evidenceCount > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: m.evidenceCount }, (_, i) => (
                <div
                  key={i}
                  className="grid aspect-video place-items-center rounded-lg border border-line bg-tile2 text-[11px] text-muted"
                >
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-faint"><Icon d="M21 15l-5-5L5 21 M3 5h18v14H3z" /></span>
                    مدرک {fa(i + 1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-5 text-faint">
              هنوز مدرکی (اسکرین‌شات/کلیپ) بارگذاری نشده است؛ مدارکِ ثبت‌شده توسط بازیکنان اینجا نمایش داده می‌شوند.
            </p>
          )}
        </section>

        {/* Chat preview */}
        <section className="rounded-2xl border border-line bg-tile p-4">
          <h3 className="mb-2 flex items-center justify-between font-display text-sm font-bold text-text">
            <span className="flex items-center gap-1.5">
              <span className="text-accent"><Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></span>
              گفت‌وگوی مسابقه
            </span>
            {m.chatUnread > 0 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-[#5eead4] tnum">{fa(m.chatUnread)} نخوانده</span>
            )}
          </h3>
          <p className="truncate rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-muted">
            {m.chatUnread > 0 ? 'پیام‌های جدیدی از بازیکنان وجود دارد…' : 'پیامِ تازه‌ای نیست.'}
          </p>
        </section>

        {/* Reject reason editor */}
        {rejecting && (
          <section className="rounded-2xl border border-bad/40 bg-bad/5 p-4">
            <label className="mb-1.5 block text-xs font-bold text-[#fca5a5]">دلیلِ ردِ نتیجه</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً: امتیازِ ثبت‌شده با اسکرین‌شات مطابقت ندارد"
              className="w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-text outline-none focus:border-bad"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onRun('reject_result', { matchId: m.id, reason: reason.trim() || undefined });
                  onClose();
                }}
                className="btn-danger px-3 py-1.5 text-xs"
              >
                تأییدِ ردِ نتیجه
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="btn-ghost px-3 py-1.5 text-xs">
                انصراف
              </button>
            </div>
          </section>
        )}

        {/* Invalid-evidence reason editor */}
        {invalidating && (
          <section className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
            <label className="mb-1.5 block text-xs font-bold text-gold">دلیلِ ابطالِ مدرک (اختیاری)</label>
            <textarea
              rows={2}
              value={evReason}
              onChange={(e) => setEvReason(e.target.value)}
              placeholder="مثلاً: اسکرین‌شات تاریخ ندارد یا مربوط به مسابقه‌ی دیگری است"
              className="w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-text outline-none focus:border-gold"
            />
            <p className="mt-1.5 text-[11px] leading-5 text-muted">با ابطالِ مدرک، از بازیکن خواسته می‌شود مدرکِ معتبر را دوباره ارسال کند.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onRun('invalid_evidence', { matchId: m.id, reason: evReason.trim() || undefined });
                  onClose();
                }}
                className="btn-danger px-3 py-1.5 text-xs"
              >
                تأییدِ ابطالِ مدرک
              </button>
              <button type="button" onClick={() => setInvalidating(false)} className="btn-ghost px-3 py-1.5 text-xs">
                انصراف
              </button>
            </div>
          </section>
        )}

        {/* Action buttons */}
        <section className="grid grid-cols-2 gap-2">
          {(isPending || isLive) && !isDisputed && (
            <button type="button" onClick={() => { onRun('approve_result', { matchId: m.id }); onClose(); }} className="btn-primary py-2 text-sm">
              تأییدِ نتیجه
            </button>
          )}
          {(isPending || isLive) && !isDisputed && !rejecting && (
            <button type="button" onClick={() => setRejecting(true)} className="btn-danger py-2 text-sm">
              ردِ نتیجه
            </button>
          )}
          {/* عدمِ حضورِ دوطرفه → اخطار به هر دو + بازبینیِ مدیر */}
          {isDoubleNoShow && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('عدمِ حضورِ دوطرفه ثبت شود؟ هر دو بازیکن اخطار می‌گیرند و مسابقه به بازبینیِ مدیر می‌رود.')) {
                  onRun('mark_double_no_show', { matchId: m.id });
                  onClose();
                }
              }}
              className="btn-danger py-2 text-sm"
            >
              ثبتِ عدمِ حضورِ دوطرفه
            </button>
          )}

          {/* ابطالِ مدرک → درخواستِ ارسالِ مجدد از بازیکن */}
          {evidenceConcern && !invalidating && (
            <button type="button" onClick={() => setInvalidating(true)} className="btn-danger py-2 text-sm">
              ابطالِ مدرک
            </button>
          )}

          {/* تأیید/ثبتِ عدمِ حضور برای حالتِ یک‌طرفه یا مهلتِ گذشته */}
          {isNoShowOrExpired && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('عدمِ حضور تأیید شود؟ بازیکنِ حاضر صعود می‌کند و بازیکنِ غایب اخطار/در صورتِ تکرار محروم می‌شود.')) {
                  onRun('mark_no_show', { matchId: m.id });
                  onClose();
                }
              }}
              className="btn-danger py-2 text-sm"
            >
              ثبت/تأییدِ عدمِ حضور
            </button>
          )}

          {/* ثبتِ عدمِ حضورِ عمومی برای سایرِ حالت‌های جریان‌دار */}
          {!isCompleted && !isNoShowOrExpired && !isDoubleNoShow && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('عدمِ حضور برای این مسابقه ثبت شود؟')) {
                  onRun('mark_no_show', { matchId: m.id });
                  onClose();
                }
              }}
              className="btn-ghost py-2 text-sm"
            >
              ثبتِ عدمِ حضور
            </button>
          )}

          {/* بازیِ مجدد — همیشه در دسترس */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('بازیِ مجدد برای این مسابقه تعیین شود؟ امتیاز و نتیجه بازنشانی می‌شوند.')) {
                onRun('rematch', { matchId: m.id });
                onClose();
              }
            }}
            className="btn-ghost py-2 text-sm"
          >
            بازیِ مجدد
          </button>

          {(isCompleted || m.status === 'no_show') && (
            <button type="button" onClick={() => onRun('reopen_match', { matchId: m.id })} className="btn-ghost py-2 text-sm">
              بازگشاییِ مسابقه
            </button>
          )}
          <button type="button" onClick={() => onRun('message', { matchId: m.id })} className="btn-ghost py-2 text-sm">
            پیام به بازیکنان
          </button>
        </section>

        {isDisputed && (
          <p className="text-center text-[11px] text-faint">
            تا حلِ اختلاف، تأیید/ردِ مستقیمِ نتیجه غیرفعال است؛ ابتدا اختلاف را در پنلِ «اختلاف‌ها» حل کنید.
          </p>
        )}
      </div>
    </Drawer>
  );
}

export default MatchDetailDrawer;
