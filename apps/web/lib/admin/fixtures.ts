// دادهٔ mockِ منسجمِ هر تورنومنت (شرکت‌کننده/مسابقه/اختلاف) — قطعی (deterministic)
// تا جدول، اتاقِ کنترل، براکت و … همگی یک منبع را ببینند.
import type { AdminTournament } from '@/lib/admin';

export type ParticipantStatus = 'registered' | 'waitlisted' | 'checked_in' | 'no_show' | 'disqualified' | 'eliminated' | 'winner';
export const PARTICIPANT_FA: Record<ParticipantStatus, string> = {
  registered: 'ثبت‌نام‌شده',
  waitlisted: 'لیستِ انتظار',
  checked_in: 'چک‌این‌شده',
  no_show: 'غایب',
  disqualified: 'محروم',
  eliminated: 'حذف‌شده',
  winner: 'برنده',
};
export interface Participant {
  id: string;
  name: string;
  seed: number;
  status: ParticipantStatus;
  paid: boolean;
}

export type MatchStatus = 'scheduled' | 'ready' | 'live' | 'result_submitted' | 'disputed' | 'admin_review' | 'completed' | 'no_show';
export const MATCH_FA: Record<MatchStatus, string> = {
  scheduled: 'زمان‌بندی‌شده',
  ready: 'آماده',
  live: 'زنده',
  result_submitted: 'نتیجه ثبت‌شده',
  disputed: 'دارای اختلاف',
  admin_review: 'بررسیِ مدیر',
  completed: 'پایان‌یافته',
  no_show: 'عدمِ حضور',
};
export interface Match {
  id: string;
  round: number;
  slot: number;
  a: string;
  b: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  submittedBy?: string;
}

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';
export const DISPUTE_FA: Record<DisputeStatus, string> = {
  open: 'باز',
  under_review: 'در حالِ بررسی',
  resolved: 'حل‌شده',
  rejected: 'ردشده',
};
export interface Dispute {
  id: string;
  matchId: string;
  reporter: string;
  reason: string;
  status: DisputeStatus;
}

const NAMES = ['Phantom X', 'Nova', 'Apex Titans', 'Cobalt', 'Valor GG', 'Nebula', 'Storm', 'Echo', 'Drift', 'Vortex', 'Pulse', 'Rogue', 'Zenith', 'Onyx', 'Frost', 'Blaze'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function participantsFor(t: AdminTournament): Participant[] {
  const total = Math.min(t.participants || t.maxParticipants || 8, 16);
  const seed = hash(t.id);
  const out: Participant[] = [];
  for (let i = 0; i < total; i++) {
    let status: ParticipantStatus = 'registered';
    if (t.status === 'completed' || t.status === 'paid' || t.status === 'archived') status = i === 0 ? 'winner' : i < 4 ? 'eliminated' : 'eliminated';
    else if (t.status === 'live' || t.status === 'paused' || t.status === 'dispute_review') status = i < total - 2 ? 'checked_in' : i === total - 1 ? 'no_show' : 'eliminated';
    else if (t.status === 'check_in_open') status = (seed + i) % 3 === 0 ? 'registered' : 'checked_in';
    else if (t.status === 'registration_open') status = i >= total - 2 ? 'waitlisted' : 'registered';
    if ((seed + i) % 11 === 0 && status !== 'winner') status = 'disqualified';
    out.push({ id: `${t.id}-p${i}`, name: NAMES[(seed + i) % NAMES.length] + ((seed + i) % 3 ? '' : ' #' + ((i % 7) + 1)), seed: i + 1, status, paid: t.prize > 0 ? (seed + i) % 5 !== 0 : true });
  }
  return out;
}

export function matchesFor(t: AdminTournament): Match[] {
  const round = Math.max(t.currentRound ?? 0, t.status === 'completed' || t.status === 'paid' ? 4 : 0);
  if (round === 0) return [];
  const seed = hash(t.id + 'm');
  const out: Match[] = [];
  let mi = 0;
  for (let r = 1; r <= round; r++) {
    const games = Math.max(1, 8 >> r);
    for (let s = 0; s < games; s++) {
      const isCurrent = r === round && t.status !== 'completed' && t.status !== 'paid';
      let status: MatchStatus = 'completed';
      if (isCurrent) {
        const m = (seed + mi) % 5;
        status = m === 0 ? 'live' : m === 1 ? 'result_submitted' : m === 2 && t.disputes > 0 ? 'disputed' : m === 3 ? 'ready' : 'scheduled';
      }
      const sa = status === 'completed' ? ((seed + mi) % 2 ? 2 : 1) : status === 'result_submitted' || status === 'live' ? (seed + mi) % 3 : 0;
      const sb = status === 'completed' ? (sa === 2 ? (seed % 2) : 2) : status === 'live' ? (seed + mi + 1) % 3 : 0;
      out.push({
        id: `${t.id}-r${r}m${s}`,
        round: r,
        slot: s,
        a: NAMES[(seed + mi) % NAMES.length],
        b: NAMES[(seed + mi + 5) % NAMES.length],
        scoreA: sa,
        scoreB: sb,
        status,
        submittedBy: status === 'result_submitted' || status === 'disputed' ? NAMES[(seed + mi) % NAMES.length] : undefined,
      });
      mi++;
    }
  }
  return out;
}

export function disputesFor(t: AdminTournament): Dispute[] {
  if (t.disputes <= 0) return [];
  const matches = matchesFor(t).filter((m) => m.status === 'disputed' || m.status === 'result_submitted');
  const reasons = ['نتیجه‌ی ثبت‌شده اشتباه است', 'حریف حاضر نشد', 'مظنون به تقلب', 'اسکرین‌شات نامعتبر'];
  const seed = hash(t.id + 'd');
  return Array.from({ length: t.disputes }, (_, i) => {
    const m = matches[i % Math.max(matches.length, 1)];
    return {
      id: `${t.id}-d${i}`,
      matchId: m?.id ?? `${t.id}-r1m0`,
      reporter: NAMES[(seed + i) % NAMES.length],
      reason: reasons[(seed + i) % reasons.length],
      status: (i === 0 ? 'open' : 'under_review') as DisputeStatus,
    };
  });
}
