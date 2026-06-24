'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authedGet, authedPost, authedPut, isLoggedIn } from '@/lib/api';
import type { AdminTournament } from '@/lib/admin';
import type { AdminRole } from '@/lib/admin/ops';
import { appendAudit, pushToast } from '@/lib/admin/store';
import {
  buildCore,
  derive,
  roundName,
  type CRMatch,
  type ControlRoomCore,
  type ControlRoomState,
} from '@/lib/admin/controlRoom';

export type CRAction =
  | 'approve_result'
  | 'reject_result'
  | 'edit_score'
  | 'mark_no_show'
  | 'mark_double_no_show'
  | 'invalid_evidence'
  | 'disqualify'
  | 'warn'
  | 'mute'
  | 'restore'
  | 'resolve_dispute_a'
  | 'resolve_dispute_b'
  | 'reject_dispute'
  | 'request_evidence'
  | 'assign_judge'
  | 'rematch'
  | 'message'
  | 'announce'
  | 'generate_next_round'
  | 'pause'
  | 'resume'
  | 'advance_winner'
  | 'reopen_match'
  | 'release_prize';

export interface CRPayload {
  matchId?: string;
  participantId?: string;
  disputeId?: string;
  scoreA?: number;
  scoreB?: number;
  reason?: string;
  message?: string;
  target?: string;
  judge?: string;
}

const STORAGE_KEY = (id: string) => `shelter:cr:${id}:v1`;

/** اعلانِ عدمِ حضور را به‌صورتِ best-effort روی backend ثبت می‌کند (fire-and-forget). */
function notifyNoShow(tournamentId: string, absent: string, opponent: string | undefined, num: string) {
  if (!isLoggedIn()) return;
  const body = opponent
    ? `عدمِ حضور در مسابقه‌ی ${num} ثبت شد؛ ${absent} بازنده و ${opponent} صعود کرد.`
    : `${absent} به‌دلیلِ عدمِ حضور حذف شد.`;
  authedPost('/notifications-delivery', { tournamentId, channel: 'in_app', type: 'no_show', title: 'ثبتِ عدمِ حضور', body }).catch(() => {});
}

export function useControlRoom(t: AdminTournament, role: AdminRole, actorName: string) {
  const [core, setCore] = useState<ControlRoomCore>(() => buildCore(t));
  const cr = useMemo<ControlRoomState>(() => derive(core), [core]);

  // ماندگاری: بُردِ عملیات روی دیتابیس ذخیره می‌شود (بین‌دستگاهی)، با کشِ محلی برای resilience.
  const [ready, setReady] = useState(false);
  const cache = (c: ControlRoomCore) => {
    try { window.localStorage.setItem(STORAGE_KEY(t.id), JSON.stringify(c)); } catch { /* ignore */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isLoggedIn()) {
        try {
          const remote = await authedGet<ControlRoomCore | null>(`/control-board/${t.id}`);
          if (cancelled) return;
          if (remote && Array.isArray((remote as { matches?: unknown }).matches)) {
            setCore(remote);
            setReady(true);
            return;
          }
          // هنوز بُردی نیست → با نمونه‌ی پیش‌فرض seed کن
          authedPut(`/control-board/${t.id}`, buildCore(t)).catch(() => {});
          setReady(true);
          return;
        } catch {
          /* خطای شبکه/دسترسی → سقوط به کشِ محلی */
        }
      }
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY(t.id));
        if (raw && !cancelled) setCore(JSON.parse(raw) as ControlRoomCore);
      } catch { /* ignore */ }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id]);

  // ذخیره (با debounce) روی API + کشِ محلی
  useEffect(() => {
    if (!ready) return;
    cache(core);
    if (!isLoggedIn()) return;
    const id = setTimeout(() => { authedPut(`/control-board/${t.id}`, core).catch(() => {}); }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core, ready, t.id]);

  const reset = useCallback(() => {
    const def = buildCore(t);
    try { window.localStorage.removeItem(STORAGE_KEY(t.id)); } catch { /* ignore */ }
    setCore(def);
    if (isLoggedIn()) authedPut(`/control-board/${t.id}`, def).catch(() => {});
    pushToast({ kind: 'info', msg: 'اتاقِ کنترل به نمونه‌ی اولیه بازنشانی شد' });
  }, [t]);

  const [matchId, setMatchId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const audit = useCallback(
    (action: string, entityType: string, entityId: string, reason?: string) => appendAudit({ actor: actorName, actorRole: role, action, entityType, entityId, reason }),
    [actorName, role],
  );

  const patchMatch = (id: string, patch: Partial<CRMatch>) => setCore((c) => ({ ...c, matches: c.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const patchParticipant = (id: string, fn: (p: ControlRoomCore['participants'][number]) => ControlRoomCore['participants'][number]) =>
    setCore((c) => ({ ...c, participants: c.participants.map((x) => (x.id === id ? fn(x) : x)) }));
  const addActivity = (kind: ControlRoomCore['activity'][number]['kind'], text: string) =>
    setCore((c) => ({ ...c, activity: [{ id: `la-${Date.now()}`, kind, text, at: new Date().toISOString() }, ...c.activity] }));

  const run = useCallback(
    (action: CRAction, p: CRPayload = {}) => {
      const m = p.matchId ? core.matches.find((x) => x.id === p.matchId) : undefined;
      const num = m ? `#${m.number.toLocaleString('fa-IR')}` : '';
      const ok = (msg: string) => pushToast({ kind: 'success', msg });
      const err = (msg: string) => pushToast({ kind: 'error', msg });

      switch (action) {
        case 'approve_result':
          if (!m) return;
          patchMatch(m.id, { status: 'completed', winnerId: m.scoreA >= m.scoreB ? m.aId ?? undefined : m.bId ?? undefined, blockerReason: undefined });
          audit('تأییدِ نتیجه', 'match', m.id);
          addActivity('admin', `نتیجه‌ی مسابقه‌ی ${num} تأیید شد`);
          ok(`نتیجه‌ی مسابقه‌ی ${num} تأیید شد`);
          break;
        case 'reject_result':
          if (!m) return;
          patchMatch(m.id, { status: 'ready', submittedById: undefined, scoreA: 0, scoreB: 0 });
          audit('ردِ نتیجه', 'match', m.id, p.reason);
          addActivity('admin', `نتیجه‌ی مسابقه‌ی ${num} رد شد`);
          ok(`نتیجه‌ی مسابقه‌ی ${num} رد شد — منتظرِ ثبتِ مجدد`);
          break;
        case 'edit_score':
          if (!m) return;
          patchMatch(m.id, { scoreA: p.scoreA ?? m.scoreA, scoreB: p.scoreB ?? m.scoreB, status: 'completed', winnerId: (p.scoreA ?? m.scoreA) >= (p.scoreB ?? m.scoreB) ? m.aId ?? undefined : m.bId ?? undefined });
          audit('ویرایشِ امتیاز', 'match', m.id, `${p.scoreA}-${p.scoreB}`);
          ok(`امتیازِ مسابقه‌ی ${num} ویرایش شد`);
          break;
        case 'mark_no_show':
          if (m) {
            const present = m.submittedById ?? m.aId ?? undefined;
            const absent = present === m.aId ? m.bId : m.aId;
            patchMatch(m.id, { status: 'completed', winnerId: present, blockerReason: undefined });
            let disqualified = false;
            const absentName = core.participants.find((x) => x.id === absent)?.name ?? 'بازیکنِ غایب';
            const presentName = core.participants.find((x) => x.id === present)?.name ?? 'حریف';
            if (absent) {
              const cur = core.participants.find((x) => x.id === absent);
              const ns = (cur?.noShows ?? 0) + 1;
              disqualified = ns >= 2; // عدمِ حضورِ دوم → محرومیت
              patchParticipant(absent, (x) => ({ ...x, noShows: ns, warnings: (x.warnings ?? 0) + 1, status: disqualified ? 'disqualified' : 'eliminated' }));
            }
            audit('ثبتِ عدمِ حضور', 'match', m.id, absent && disqualified ? 'عدمِ حضورِ دوم — محرومیت' : undefined);
            addActivity('admin', `${absentName} در مسابقه‌ی ${num} حاضر نشد؛ ${presentName} صعود کرد`);
            notifyNoShow(core.tournamentId, absentName, presentName, num);
            ok(`عدمِ حضور ثبت شد؛ ${presentName} صعود کرد${disqualified ? ` و ${absentName} محروم شد` : ''}`);
          } else if (p.participantId) {
            // غیبتِ بازیکن را نهایی می‌کنیم: حذف (یا محرومیت در no-showِ دوم) →
            // وضعیت دیگر no_show نیست، پس آیتم از صفِ اقدامات خارج می‌شود.
            const cur = core.participants.find((x) => x.id === p.participantId);
            const ns = (cur?.noShows ?? 0) + 1;
            const disq = ns >= 2;
            patchParticipant(p.participantId, (x) => ({ ...x, status: disq ? 'disqualified' : 'eliminated', noShows: ns, warnings: (x.warnings ?? 0) + 1 }));
            audit('ثبتِ عدمِ حضور و حذف', 'participant', p.participantId, disq ? 'no-showِ دوم — محرومیت' : 'حذف به‌دلیلِ عدمِ حضور');
            addActivity('admin', `${cur?.name ?? 'بازیکن'} به‌دلیلِ عدمِ حضور حذف شد${disq ? ' و محروم شد' : ''}`);
            notifyNoShow(core.tournamentId, cur?.name ?? 'بازیکن', undefined, num);
            ok(`${cur?.name ?? 'بازیکن'} حذف شد${disq ? ' و محروم شد' : ''}`);
          }
          break;
        case 'mark_double_no_show':
          if (!m) return;
          patchMatch(m.id, { status: 'admin_review', blockerReason: 'هر دو غایب — اخطار صادر شد، نیازِ تصمیمِ مدیر' });
          if (m.aId) patchParticipant(m.aId, (x) => ({ ...x, warnings: (x.warnings ?? 0) + 1, noShows: (x.noShows ?? 0) + 1 }));
          if (m.bId) patchParticipant(m.bId, (x) => ({ ...x, warnings: (x.warnings ?? 0) + 1, noShows: (x.noShows ?? 0) + 1 }));
          audit('عدمِ حضورِ دوطرفه', 'match', m.id);
          addActivity('admin', `عدمِ حضورِ دوطرفه در مسابقه‌ی ${num}؛ هر دو اخطار گرفتند`);
          ok(`هر دو بازیکنِ مسابقه‌ی ${num} اخطار گرفتند؛ مسابقه به بازبینیِ مدیر رفت`);
          break;
        case 'invalid_evidence':
          if (!m) return;
          patchMatch(m.id, { status: 'ready', submittedById: undefined, scoreA: 0, scoreB: 0, evidenceCount: 0, blockerReason: 'مدرکِ نامعتبر — منتظرِ ثبتِ مجددِ نتیجه با مدرکِ معتبر' });
          audit('ابطالِ مدرک', 'match', m.id, p.reason);
          addActivity('admin', `مدرکِ مسابقه‌ی ${num} نامعتبر اعلام شد`);
          ok('به بازیکن اطلاع داده شد مدرک نامعتبر است؛ مهلتِ ثبتِ مجدد داده شد');
          break;
        case 'warn':
          if (!p.participantId) return;
          patchParticipant(p.participantId, (x) => ({ ...x, warnings: (x.warnings ?? 0) + 1 }));
          audit('اخطار به بازیکن', 'participant', p.participantId, p.reason);
          ok('اخطار به بازیکن ثبت شد');
          break;
        case 'mute':
          if (!p.participantId) return;
          audit('بی‌صداکردنِ بازیکن', 'participant', p.participantId, p.reason);
          ok('بازیکن در چت بی‌صدا شد');
          break;
        case 'rematch':
          if (!m) return;
          patchMatch(m.id, { status: 'ready', scoreA: 0, scoreB: 0, winnerId: undefined, submittedById: undefined, disputeId: undefined, blockerReason: undefined });
          if (m.disputeId) setCore((c) => ({ ...c, disputes: c.disputes.map((d) => (d.id === m.disputeId ? { ...d, status: 'resolved' } : d)) }));
          audit('بازیِ مجدد', 'match', m.id, p.reason);
          addActivity('admin', `برای مسابقه‌ی ${num} بازیِ مجدد تعیین شد`);
          ok(`مسابقه‌ی ${num} برای بازیِ مجدد بازنشانی شد`);
          break;
        case 'disqualify':
          if (!p.participantId) return;
          setCore((c) => ({ ...c, participants: c.participants.map((x) => (x.id === p.participantId ? { ...x, status: 'disqualified' } : x)) }));
          audit('محروم‌سازی', 'participant', p.participantId, p.reason);
          ok('بازیکن محروم شد');
          break;
        case 'restore':
          if (!p.participantId) return;
          setCore((c) => ({ ...c, participants: c.participants.map((x) => (x.id === p.participantId ? { ...x, status: 'checked_in' } : x)) }));
          audit('بازگردانی', 'participant', p.participantId);
          ok('بازیکن بازگردانده شد');
          break;
        case 'resolve_dispute_a':
        case 'resolve_dispute_b': {
          if (!p.disputeId) return;
          const d = core.disputes.find((x) => x.id === p.disputeId);
          if (!d) return;
          const dm = core.matches.find((x) => x.id === d.matchId);
          const winner = action === 'resolve_dispute_a' ? dm?.aId : dm?.bId;
          setCore((c) => ({
            ...c,
            disputes: c.disputes.map((x) => (x.id === p.disputeId ? { ...x, status: 'resolved' } : x)),
            matches: c.matches.map((x) => (x.id === d.matchId ? { ...x, status: 'completed', winnerId: winner ?? undefined, disputeId: undefined, blockerReason: undefined } : x)),
          }));
          audit('حلِ اختلاف', 'dispute', d.id, p.reason);
          addActivity('dispute', `اختلافِ مسابقه‌ی #${(dm?.number ?? 0).toLocaleString('fa-IR')} حل شد`);
          ok('اختلاف حل شد و نتیجه نهایی شد');
          break;
        }
        case 'reject_dispute': {
          if (!p.disputeId) return;
          const d = core.disputes.find((x) => x.id === p.disputeId);
          setCore((c) => ({
            ...c,
            disputes: c.disputes.map((x) => (x.id === p.disputeId ? { ...x, status: 'rejected' } : x)),
            matches: c.matches.map((x) => (d && x.id === d.matchId ? { ...x, status: 'completed', disputeId: undefined, blockerReason: undefined } : x)),
          }));
          audit('ردِ اختلاف', 'dispute', p.disputeId, p.reason);
          ok('اختلاف نامعتبر اعلام شد');
          break;
        }
        case 'request_evidence':
          if (!p.disputeId) return;
          setCore((c) => ({ ...c, disputes: c.disputes.map((x) => (x.id === p.disputeId ? { ...x, status: 'under_review' } : x)) }));
          audit('درخواستِ مدرک', 'dispute', p.disputeId);
          ok('درخواستِ مدرکِ بیشتر ارسال شد');
          break;
        case 'assign_judge':
          if (!p.disputeId) return;
          setCore((c) => ({ ...c, disputes: c.disputes.map((x) => (x.id === p.disputeId ? { ...x, status: 'under_review', assignedTo: p.judge ?? 'داور' } : x)) }));
          audit('اختصاصِ داور', 'dispute', p.disputeId, p.judge);
          ok(`اختلاف به ${p.judge ?? 'داور'} اختصاص یافت`);
          break;
        case 'message':
          audit('پیام به بازیکن', 'participant', p.participantId ?? '—');
          ok('پیام ارسال شد');
          break;
        case 'announce':
          addActivity('chat', `اعلانِ عمومی ارسال شد: ${p.message ?? ''}`.trim());
          audit('ارسالِ اعلان', 'tournament', core.tournamentId, p.target);
          ok('اعلان ارسال شد');
          break;
        case 'pause':
          setCore((c) => ({ ...c, phase: 'admin_review' }));
          audit('توقفِ تورنومنت', 'tournament', core.tournamentId, p.reason);
          addActivity('admin', 'ادمین تورنومنت را متوقف کرد');
          ok('تورنومنت متوقف شد');
          break;
        case 'resume':
          setCore((c) => ({ ...c, phase: 'round_active' }));
          audit('ادامه‌ی تورنومنت', 'tournament', core.tournamentId);
          addActivity('admin', 'تورنومنت از سر گرفته شد');
          ok('تورنومنت ادامه یافت');
          break;
        case 'reopen_match':
          if (!m) return;
          patchMatch(m.id, { status: 'ready', winnerId: undefined });
          audit('بازگشاییِ مسابقه', 'match', m.id);
          ok(`مسابقه‌ی ${num} بازگشایی شد`);
          break;
        case 'release_prize':
          setCore((c) => ({ ...c, phase: 'paid' }));
          audit('آزادسازیِ جایزه', 'tournament', core.tournamentId);
          addActivity('payment', 'جایزه آزاد شد');
          ok('جایزه آزاد شد');
          break;
        case 'generate_next_round': {
          const st = derive(core);
          if (!st.nextRound.ready) {
            err(`دورِ بعدی آماده نیست: ${st.nextRound.reasons[0] ?? 'موانعِ باز وجود دارد'}`);
            return;
          }
          if (core.currentRound >= core.totalRounds) {
            setCore((c) => ({ ...c, phase: 'completed' }));
            audit('پایانِ تورنومنت', 'tournament', core.tournamentId);
            ok('تورنومنت پایان یافت');
            break;
          }
          const winners = core.matches.filter((x) => x.round === core.currentRound && x.winnerId).map((x) => x.winnerId!) as string[];
          const nr = core.currentRound + 1;
          const rn = roundName(core.format, nr, core.totalRounds);
          let n = Math.max(...core.matches.map((x) => x.number), 0);
          const newMatches: CRMatch[] = [];
          for (let i = 0; i < winners.length; i += 2) {
            n++;
            newMatches.push({ id: `m${n}`, number: n, round: nr, roundName: rn, aId: winners[i] ?? null, bId: winners[i + 1] ?? null, scoreA: 0, scoreB: 0, status: i + 1 < winners.length ? 'ready' : 'waiting_for_players', evidenceCount: 0, chatUnread: 0 });
          }
          setCore((c) => ({ ...c, currentRound: nr, roundName: rn, phase: 'round_active', matches: [...c.matches, ...newMatches] }));
          audit('ساختِ دورِ بعد', 'tournament', core.tournamentId, rn);
          addActivity('admin', `${rn} ساخته شد`);
          ok(`${rn} ساخته شد`);
          break;
        }
      }
    },
    [core, audit],
  );

  const closeDrawers = useCallback(() => {
    setMatchId(null);
    setParticipantId(null);
    setDisputeId(null);
  }, []);

  return {
    cr,
    run,
    matchId,
    participantId,
    disputeId,
    chatOpen,
    openMatch: (id: string) => {
      setParticipantId(null);
      setDisputeId(null);
      setMatchId(id);
    },
    openParticipant: (id: string) => {
      setMatchId(null);
      setDisputeId(null);
      setParticipantId(id);
    },
    openDispute: (id: string) => {
      setMatchId(null);
      setParticipantId(null);
      setDisputeId(id);
    },
    setChatOpen,
    closeDrawers,
    reset,
  };
}
