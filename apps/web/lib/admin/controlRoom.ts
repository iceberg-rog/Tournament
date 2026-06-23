// مدلِ دادهٔ «اتاقِ کنترل» — generic برای همه‌ی فرمت‌ها.
// buildControlRoom(t) یک وضعیتِ کاملِ عملیاتی می‌سازد: شرکت‌کننده‌ها، مسابقات،
// اختلاف‌ها، فعالیت، roadmap، صفِ اقدامات، blockerها، خلاصه و آمادگیِ دورِ بعد.
import { FORMAT_FA, money, type AdminTournament, type TournamentFormat } from '@/lib/admin';

export type TournamentPhase =
  | 'registration'
  | 'check_in'
  | 'seeding'
  | 'bracket_generation'
  | 'round_active'
  | 'waiting_for_results'
  | 'admin_review'
  | 'dispute_review'
  | 'round_completed'
  | 'ready_for_next_round'
  | 'completed'
  | 'payout_pending'
  | 'paid';

export const PHASE_FA: Record<TournamentPhase, string> = {
  registration: 'ثبت‌نام',
  check_in: 'چک‌این',
  seeding: 'سیدبندی',
  bracket_generation: 'ساختِ براکت',
  round_active: 'دورِ فعال',
  waiting_for_results: 'در انتظارِ نتایج',
  admin_review: 'بازبینیِ مدیر',
  dispute_review: 'بررسیِ اختلاف',
  round_completed: 'دور تمام شد',
  ready_for_next_round: 'آماده‌ی دورِ بعد',
  completed: 'پایان‌یافته',
  payout_pending: 'در انتظارِ پرداخت',
  paid: 'پرداخت‌شده',
};

export type CRMatchStatus =
  | 'scheduled'
  | 'waiting_for_players'
  | 'ready'
  | 'live'
  | 'result_submitted'
  | 'awaiting_opponent_confirmation'
  | 'admin_review'
  | 'disputed'
  | 'completed'
  | 'no_show'
  | 'double_no_show'
  | 'expired'
  | 'cancelled';

export const CRMATCH_FA: Record<CRMatchStatus, string> = {
  scheduled: 'زمان‌بندی‌شده',
  waiting_for_players: 'منتظرِ بازیکنان',
  ready: 'آماده',
  live: 'زنده',
  result_submitted: 'نتیجه ثبت‌شده',
  awaiting_opponent_confirmation: 'منتظرِ تأییدِ حریف',
  admin_review: 'بازبینیِ مدیر',
  disputed: 'دارای اختلاف',
  completed: 'پایان‌یافته',
  no_show: 'عدمِ حضور',
  double_no_show: 'عدمِ حضورِ دوطرفه',
  expired: 'مهلت گذشته',
  cancelled: 'لغوشده',
};

export type CRParticipantStatus =
  | 'registered'
  | 'checked_in'
  | 'playing'
  | 'waiting'
  | 'eliminated'
  | 'winner'
  | 'no_show'
  | 'disqualified'
  | 'withdrawn';

export const CRPART_FA: Record<CRParticipantStatus, string> = {
  registered: 'ثبت‌نام‌شده',
  checked_in: 'چک‌این‌شده',
  playing: 'در حالِ بازی',
  waiting: 'منتظر',
  eliminated: 'حذف‌شده',
  winner: 'برنده',
  no_show: 'غایب',
  disqualified: 'محروم',
  withdrawn: 'انصراف',
};

export type ControlRoomBlocker =
  | 'pending_result'
  | 'open_dispute'
  | 'missing_checkin'
  | 'no_show_unresolved'
  | 'payment_issue'
  | 'admin_review_required'
  | 'schedule_not_reached';

export type StatusTone = 'good' | 'warning' | 'critical' | 'idle';

export interface CRParticipant {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: CRParticipantStatus;
  seed: number;
  currentMatchId?: string;
  lastActivity?: string;
  paid: boolean;
  reports: number;
  kyc?: 'verified' | 'pending' | 'none';
  psnId?: string;
  walletStatus?: 'ok' | 'locked' | 'empty';
  warnings?: number;
  noShows?: number;
  lastSeen?: string;
  suspicious?: boolean;
  isTeam?: boolean;
  members?: string[];
  captain?: string;
}

export interface CRMatch {
  id: string;
  number: number;
  round: number;
  roundName: string;
  aId: string | null;
  bId: string | null;
  scoreA: number;
  scoreB: number;
  status: CRMatchStatus;
  winnerId?: string;
  submittedById?: string;
  submittedAt?: string;
  deadline?: string;
  evidenceCount: number;
  chatUnread: number;
  disputeId?: string;
  blockerReason?: string;
  map?: string;
}

export type CRDisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';
export interface CRDispute {
  id: string;
  matchId: string;
  reporterId: string;
  accusedId?: string;
  reason: string;
  evidenceCount: number;
  status: CRDisputeStatus;
  assignedTo?: string;
  deadline?: string;
  suggestedAction?: string;
}

export type CRActivityKind = 'result' | 'dispute' | 'admin' | 'chat' | 'payment' | 'checkin';
export interface CRActivity {
  id: string;
  kind: CRActivityKind;
  text: string;
  at: string;
}

export type RoadmapKind = 'registration' | 'check_in' | 'bracket' | 'round' | 'verify' | 'payout';
export type RoadmapState = 'completed' | 'current' | 'blocked' | 'warning' | 'upcoming' | 'locked' | 'pending_admin';
export interface RoadmapStep {
  key: string;
  kind: RoadmapKind;
  label: string;
  state: RoadmapState;
  round?: number;
  badge?: string;
  blockerReason?: string;
  needsAction?: boolean;
}

export type ActionKind =
  | 'approve_result'
  | 'open_match'
  | 'resolve_dispute'
  | 'message'
  | 'generate_next_round'
  | 'mark_no_show'
  | 'pause'
  | 'review_evidence'
  | 'release_prize';
export interface ActionQueueItem {
  id: string;
  priority: 'critical' | 'warning' | 'normal';
  title: string;
  detail: string;
  matchId?: string;
  participantId?: string;
  disputeId?: string;
  action: ActionKind;
}

export interface StandingRow {
  id: string;
  name: string;
  color: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  diff: number;
  points: number;
}
export interface LeaderboardRow {
  id: string;
  name: string;
  color: string;
  placementPts: number;
  killPts: number;
  total: number;
}

export interface CRSummary {
  leadingId?: string;
  currentMatchId?: string;
  blockers: string[];
  nextAction?: string;
  estimatedNext?: string;
  championId?: string;
  runnerUpId?: string;
  finalScore?: string;
  payoutStatus?: string;
  missingResults?: number;
  deadline?: string;
}

export interface ControlRoomCore {
  tournamentId: string;
  title: string;
  game: string;
  format: TournamentFormat;
  prize: number;
  phase: TournamentPhase;
  currentRound: number;
  totalRounds: number;
  roundName: string;
  nextScheduled?: string;
  estimatedFinish?: string;
  participants: CRParticipant[];
  matches: CRMatch[];
  disputes: CRDispute[];
  activity: CRActivity[];
}

export interface ControlRoomState extends ControlRoomCore {
  statusTone: StatusTone;
  activeCount: number;
  totalCount: number;
  currentRoundCompleted: number;
  currentRoundTotal: number;
  pendingResults: number;
  openDisputes: number;
  roadmap: RoadmapStep[];
  actionQueue: ActionQueueItem[];
  summary: CRSummary;
  nextRound: { ready: boolean; reasons: string[]; label: string };
  standings?: StandingRow[];
  leaderboard?: LeaderboardRow[];
}

// ───────── helpers ─────────
const NOW = 1750680000000; // پایه‌ی زمانیِ ثابت (۲۰۲۶-۰۶-۲۳) برای زمان‌های نسبی
const minsAgo = (m: number) => new Date(NOW - m * 60000).toISOString();
const minsAhead = (m: number) => new Date(NOW + m * 60000).toISOString();

export function relTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.parse(iso) - NOW;
  const past = diff < 0;
  const m = Math.round(Math.abs(diff) / 60000);
  const fa = (n: number) => n.toLocaleString('fa-IR');
  let txt: string;
  if (m < 1) txt = 'هم‌اکنون';
  else if (m < 60) txt = `${fa(m)} دقیقه`;
  else if (m < 1440) txt = `${fa(Math.round(m / 60))} ساعت`;
  else txt = `${fa(Math.round(m / 1440))} روز`;
  if (m < 1) return txt;
  return past ? `${txt} پیش` : `${txt} دیگر`;
}

const PALETTE = ['#2dd4bf', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#34d399', '#fb7185', '#f59e0b', '#22d3ee', '#c084fc', '#4ade80', '#fca5a5'];
const initials = (name: string) => name.replace(/[#\d]/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
const mk = (name: string, i: number, status: CRParticipantStatus, extra: Partial<CRParticipant> = {}): CRParticipant => ({
  id: `p-${name.replace(/\s+/g, '').toLowerCase()}`,
  name,
  initials: initials(name),
  color: PALETTE[i % PALETTE.length],
  status,
  seed: i + 1,
  paid: true,
  reports: 0,
  kyc: 'verified',
  ...extra,
});

export function roundName(format: TournamentFormat, round: number, total: number): string {
  if (format === 'league') return `هفته ${round.toLocaleString('fa-IR')}`;
  if (format === 'battle_royale') return `مَچ ${round.toLocaleString('fa-IR')}`;
  if (format === 'round_robin' || format === 'swiss') return `دور ${round.toLocaleString('fa-IR')}`;
  // elimination
  if (round === total) return 'فینال';
  if (round === total - 1) return 'نیمه‌نهایی';
  if (round === total - 2) return 'یک‌چهارمِ نهایی';
  const teams = Math.pow(2, total - round + 1);
  return `مرحله‌ی ${teams.toLocaleString('fa-IR')}تایی`;
}

// ───────── سناریوی شاخص: Valorant Champions Arena (t1) ─────────
function buildValorant(t: AdminTournament): ControlRoomCore {
  const P = [
    mk('Phantom X', 0, 'playing', { currentMatchId: 'm5', lastActivity: minsAgo(2) }),
    mk('Apex Titans', 7, 'eliminated', { lastActivity: minsAgo(95) }),
    mk('Valor GG', 3, 'playing', { currentMatchId: 'm5', lastActivity: minsAgo(4) }),
    mk('Vortex', 4, 'eliminated', { lastActivity: minsAgo(110) }),
    mk('Nebula', 1, 'waiting', { currentMatchId: 'm6', lastActivity: minsAgo(8) }),
    mk('Pulse', 6, 'eliminated', { lastActivity: minsAgo(120) }),
    mk('Echo', 2, 'waiting', { currentMatchId: 'm4', lastActivity: minsAgo(12), reports: 1 }),
    mk('Cobalt', 5, 'waiting', { currentMatchId: 'm4', lastActivity: minsAgo(15) }),
  ];
  const id = (n: string) => `p-${n.replace(/\s+/g, '').toLowerCase()}`;
  const matches: CRMatch[] = [
    { id: 'm1', number: 1, round: 1, roundName: 'یک‌چهارمِ نهایی', aId: id('Phantom X'), bId: id('Apex Titans'), scoreA: 2, scoreB: 1, status: 'completed', winnerId: id('Phantom X'), evidenceCount: 2, chatUnread: 0, submittedById: id('Phantom X'), submittedAt: minsAgo(70) },
    { id: 'm2', number: 2, round: 1, roundName: 'یک‌چهارمِ نهایی', aId: id('Valor GG'), bId: id('Vortex'), scoreA: 2, scoreB: 0, status: 'completed', winnerId: id('Valor GG'), evidenceCount: 1, chatUnread: 0, submittedById: id('Valor GG'), submittedAt: minsAgo(64) },
    { id: 'm3', number: 3, round: 1, roundName: 'یک‌چهارمِ نهایی', aId: id('Nebula'), bId: id('Pulse'), scoreA: 2, scoreB: 0, status: 'completed', winnerId: id('Nebula'), evidenceCount: 1, chatUnread: 0, submittedById: id('Nebula'), submittedAt: minsAgo(58) },
    { id: 'm4', number: 4, round: 1, roundName: 'یک‌چهارمِ نهایی', aId: id('Echo'), bId: id('Cobalt'), scoreA: 1, scoreB: 2, status: 'disputed', submittedById: id('Cobalt'), submittedAt: minsAgo(20), deadline: minsAhead(25), evidenceCount: 1, chatUnread: 2, disputeId: 'd1', blockerReason: 'اختلافِ باز: اسکرین‌شاتِ نتیجه نامعتبر اعلام شده', map: 'Ascent' },
    { id: 'm5', number: 5, round: 2, roundName: 'نیمه‌نهایی', aId: id('Phantom X'), bId: id('Valor GG'), scoreA: 13, scoreB: 9, status: 'live', evidenceCount: 0, chatUnread: 1, deadline: minsAhead(15), map: 'Haven' },
    { id: 'm6', number: 6, round: 2, roundName: 'نیمه‌نهایی', aId: id('Nebula'), bId: null, scoreA: 0, scoreB: 0, status: 'waiting_for_players', evidenceCount: 0, chatUnread: 0, blockerReason: 'منتظرِ برنده‌ی مسابقه‌ی #۴ (اختلاف باز)' },
    { id: 'm7', number: 7, round: 3, roundName: 'فینال', aId: null, bId: null, scoreA: 0, scoreB: 0, status: 'scheduled', evidenceCount: 0, chatUnread: 0 },
  ];
  const disputes: CRDispute[] = [
    { id: 'd1', matchId: 'm4', reporterId: id('Echo'), accusedId: id('Cobalt'), reason: 'اسکرین‌شاتِ نتیجه نامعتبر است و امتیازِ نقشه‌ی دوم اشتباه ثبت شده', evidenceCount: 1, status: 'open', deadline: minsAhead(25), suggestedAction: 'بازبینیِ اسکرین‌شات و درخواستِ مدرکِ تکمیلی از Cobalt' },
  ];
  const activity: CRActivity[] = [
    { id: 'a1', kind: 'result', text: 'Phantom X نتیجه‌ی مسابقه‌ی #۱ را ثبت کرد', at: minsAgo(2) },
    { id: 'a2', kind: 'result', text: 'Valor GG نتیجه‌ی مسابقه‌ی #۲ را تأیید کرد', at: minsAgo(6) },
    { id: 'a3', kind: 'dispute', text: 'Echo برای مسابقه‌ی #۴ اختلاف باز کرد', at: minsAgo(18) },
    { id: 'a4', kind: 'admin', text: 'ادمین مسابقه‌ی #۴ را متوقف کرد', at: minsAgo(19) },
    { id: 'a5', kind: 'checkin', text: 'Nebula چک‌این کرد', at: minsAgo(40) },
    { id: 'a6', kind: 'admin', text: 'داور نتیجه‌ی مسابقه‌ی #۲ را تأیید کرد', at: minsAgo(60) },
    { id: 'a7', kind: 'admin', text: 'دورِ ۱ ساخته شد', at: minsAgo(130) },
  ];
  return {
    tournamentId: t.id, title: t.title, game: t.game, format: t.format, prize: t.prize,
    phase: 'dispute_review', currentRound: 2, totalRounds: 3, roundName: 'نیمه‌نهایی',
    nextScheduled: minsAhead(20), estimatedFinish: minsAhead(95),
    participants: P, matches, disputes, activity,
  };
}

// ───────── generic builder برای بقیه‌ی فرمت‌ها ─────────
const NAMES = ['Phantom X', 'Nova', 'Apex Titans', 'Cobalt', 'Valor GG', 'Nebula', 'Storm', 'Echo', 'Drift', 'Vortex', 'Pulse', 'Rogue'];

function genParticipants(t: AdminTournament, count: number, finished: boolean): CRParticipant[] {
  return Array.from({ length: count }, (_, i) => {
    let status: CRParticipantStatus = 'checked_in';
    if (finished) status = i === 0 ? 'winner' : 'eliminated';
    else if (t.status === 'registration_open') status = i >= count - 2 ? 'registered' : 'checked_in';
    else if (t.status === 'live' || t.status === 'paused') status = i < 2 ? 'playing' : i < count - 1 ? 'waiting' : 'no_show';
    return mk(NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i}` : ''), i, status, {
      lastActivity: minsAgo(5 + i * 7),
      paid: t.prize > 0 ? i % 5 !== 0 : true,
      reports: i % 6 === 0 && i > 0 ? 1 : 0,
    });
  });
}

function buildEliminationGeneric(t: AdminTournament): ControlRoomCore {
  const n = Math.min(Math.max(t.participants || 8, 4), 8);
  const finished = t.status === 'completed' || t.status === 'paid' || t.status === 'archived';
  const total = Math.max(Math.ceil(Math.log2(n)), 1);
  const cur = finished ? total : Math.min(Math.max(t.currentRound || 1, 1), total);
  const P = genParticipants(t, n, finished);
  const matches: CRMatch[] = [];
  let num = 0;
  for (let r = 1; r <= cur; r++) {
    const games = Math.max(1, n >> r);
    for (let s = 0; s < games; s++) {
      const done = finished || r < cur;
      matches.push({
        id: `m${++num}`, number: num, round: r, roundName: roundName(t.format, r, total),
        aId: P[(s * 2) % n]?.id ?? null, bId: P[(s * 2 + 1) % n]?.id ?? null,
        scoreA: done ? 2 : r === cur && s === 0 ? 1 : 0, scoreB: done ? (s % 2) : r === cur && s === 0 ? 1 : 0,
        status: done ? 'completed' : r === cur && s === 0 ? 'live' : r === cur && s === 1 ? 'result_submitted' : 'scheduled',
        winnerId: done ? P[(s * 2) % n]?.id : undefined,
        evidenceCount: done ? 1 : 0, chatUnread: r === cur ? (s === 0 ? 1 : 0) : 0,
        submittedById: r === cur && s === 1 ? P[(s * 2) % n]?.id : undefined,
        deadline: r === cur ? minsAhead(20) : undefined,
      });
    }
  }
  const champion = finished ? P[0] : undefined;
  return {
    tournamentId: t.id, title: t.title, game: t.game, format: t.format, prize: t.prize,
    phase: finished ? (t.status === 'paid' ? 'paid' : 'completed') : t.status === 'registration_open' ? 'check_in' : 'round_active',
    currentRound: cur, totalRounds: total, roundName: roundName(t.format, cur, total),
    nextScheduled: finished ? undefined : minsAhead(20), estimatedFinish: finished ? undefined : minsAhead(120),
    participants: P, matches,
    disputes: [],
    activity: finished
      ? [{ id: 'g1', kind: 'admin', text: `${champion?.name} قهرمان شد`, at: minsAgo(30) }, { id: 'g2', kind: 'admin', text: 'فینال تأیید شد', at: minsAgo(35) }]
      : [{ id: 'g1', kind: 'checkin', text: 'شرکت‌کننده‌ها چک‌این کردند', at: minsAgo(20) }],
  };
}

function buildBattleRoyale(t: AdminTournament): ControlRoomCore {
  const P = genParticipants(t, 12, true);
  return {
    tournamentId: t.id, title: t.title, game: t.game, format: t.format, prize: t.prize,
    phase: t.status === 'payout_pending' ? 'payout_pending' : 'completed',
    currentRound: t.currentRound || 6, totalRounds: 6, roundName: 'رده‌بندیِ نهایی',
    participants: P, matches: [], disputes: [],
    activity: [
      { id: 'b1', kind: 'admin', text: 'امتیازهای نهایی محاسبه شد', at: minsAgo(15) },
      { id: 'b2', kind: 'payment', text: 'جایزه آماده‌ی آزادسازی است', at: minsAgo(10) },
    ],
  };
}

function buildRoundRobin(t: AdminTournament): ControlRoomCore {
  const live = t.status === 'live' || t.status === 'paused';
  const P = genParticipants(t, 6, t.status === 'completed');
  const matches: CRMatch[] = live
    ? Array.from({ length: 3 }, (_, i) => ({
        id: `m${i + 1}`, number: i + 1, round: t.currentRound || 1, roundName: roundName(t.format, t.currentRound || 1, 5),
        aId: P[i * 2 % 6]?.id ?? null, bId: P[(i * 2 + 1) % 6]?.id ?? null, scoreA: i, scoreB: 1,
        status: i === 0 ? 'live' : i === 1 ? 'result_submitted' : 'scheduled', evidenceCount: 0, chatUnread: 0,
        deadline: minsAhead(30),
      }))
    : [];
  return {
    tournamentId: t.id, title: t.title, game: t.game, format: t.format, prize: t.prize,
    phase: t.status === 'registration_open' ? 'check_in' : live ? 'round_active' : 'completed',
    currentRound: t.currentRound || (t.status === 'registration_open' ? 0 : 1), totalRounds: 5,
    roundName: roundName(t.format, t.currentRound || 1, 5),
    nextScheduled: minsAhead(30),
    participants: P, matches, disputes: [],
    activity: [{ id: 'r1', kind: 'checkin', text: 'ثبت‌نام در جریان است', at: minsAgo(25) }],
  };
}

// ───────── سناریوی شاخص: FC26 Champions Cup با ۱۲۸ بازیکن ─────────
const FC_NAMES = ['Ronaldo', 'Messi', 'Mbappé', 'Haaland', 'Vinicius', 'Bellingham', 'Salah', 'Kane', 'Neymar', 'Modric', 'De Bruyne', 'Lewandowski', 'Foden', 'Rodri', 'Saka', 'Musiala', 'Pedri', 'Gavi', 'Valverde', 'Rúben', 'Griezmann', 'Osimhen', 'Leão', 'Kvara', 'Bruno', 'Ødegaard', 'Wirtz', 'Yamal', 'Endrick', 'Güler', 'Cubarsí', 'Zaire'];

function fcParticipant(i: number): CRParticipant {
  const base = FC_NAMES[i % FC_NAMES.length];
  const name = `${base}${i >= FC_NAMES.length ? '_' + Math.floor(i / FC_NAMES.length) : ''}`;
  // وضعیت‌های متنوع
  let status: CRParticipantStatus = 'checked_in';
  if (i >= 120) status = 'waiting'; // ۸ نفرِ لیستِ انتظار
  else if (i % 17 === 0) status = 'no_show';
  else if (i % 23 === 0) status = 'registered'; // چک‌این‌نکرده
  const kyc: CRParticipant['kyc'] = i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'pending' : 'none';
  const noShows = i % 17 === 0 ? 2 : i % 9 === 0 ? 1 : 0;
  const warnings = i % 13 === 0 ? 1 : 0;
  const suspicious = i % 31 === 0;
  return {
    id: `fc-p${i}`,
    name,
    initials: initials(name),
    color: PALETTE[(i * 7 + 3) % PALETTE.length],
    status,
    seed: i + 1,
    paid: i % 19 !== 0,
    reports: suspicious ? 2 : warnings,
    kyc,
    psnId: `${base.replace(/[^a-zA-Z]/g, '')}_${(1000 + i).toString()}`,
    walletStatus: i % 19 === 0 ? 'empty' : kyc === 'verified' ? 'ok' : 'locked',
    warnings,
    noShows,
    suspicious,
    lastSeen: minsAgo((i % 40) + 1),
    lastActivity: minsAgo((i % 40) + 1),
  };
}

function buildFC26(t: AdminTournament): ControlRoomCore {
  const P = Array.from({ length: 128 }, (_, i) => fcParticipant(i));
  const id = (i: number) => P[i % 128].id;
  const total = 7; // 128→64→32→16→8→4→2→1
  const current = 3; // مرحله‌ی ۳۲تایی در جریان است
  const matches: CRMatch[] = [];
  let num = 0;

  for (let r = 1; r <= current; r++) {
    const games = 128 / Math.pow(2, r);
    for (let s = 0; s < games; s++) {
      num++;
      const rn = roundName(t.format, r, total);
      const aId = id(s * 2);
      const bId = id(s * 2 + 1);
      const base: CRMatch = { id: `fc-r${r}m${s}`, number: num, round: r, roundName: rn, aId, bId, scoreA: 0, scoreB: 0, status: 'completed', evidenceCount: 1, chatUnread: 0 };

      if (r < current) {
        // دورهای قبلی همه کامل
        matches.push({ ...base, scoreA: 3, scoreB: (s % 2) + 0, winnerId: aId, submittedById: aId, submittedAt: minsAgo(200 - r * 30 - s) });
        continue;
      }
      // مرحله‌ی جاری (۳۲تایی) — حالت‌های چالشی
      switch (s) {
        case 0: // اختلافِ نتیجه ۳-۱ در برابرِ ادعای ۲-۲
          matches.push({ ...base, scoreA: 3, scoreB: 1, status: 'disputed', submittedById: aId, submittedAt: minsAgo(18), deadline: minsAhead(20), evidenceCount: 1, chatUnread: 3, disputeId: 'fc-d1', blockerReason: 'اختلافِ باز: حریف نتیجه را ۲-۲ اعلام کرده است' });
          break;
        case 1: // مهلتِ گذشته، بدونِ نتیجه
          matches.push({ ...base, status: 'expired', deadline: minsAgo(8), blockerReason: 'مهلتِ ثبتِ نتیجه گذشته و هیچ نتیجه‌ای ثبت نشده' });
          break;
        case 2: // فقط یک بازیکن حاضر → عدمِ حضورِ حریف
          matches.push({ ...base, scoreA: 3, scoreB: 0, status: 'no_show', submittedById: aId, submittedAt: minsAgo(12), blockerReason: `${P[s * 2 + 1].name} حاضر نشد` });
          break;
        case 3: // هر دو غایب
          matches.push({ ...base, status: 'double_no_show', deadline: minsAgo(5), blockerReason: 'هیچ‌یک از دو بازیکن حاضر نشدند — نیازِ بررسیِ مدیر' });
          break;
        case 4: // نتیجه ثبت‌شده، منتظرِ تأییدِ حریف
          matches.push({ ...base, scoreA: 2, scoreB: 1, status: 'result_submitted', submittedById: aId, submittedAt: minsAgo(4), deadline: minsAhead(6), chatUnread: 1 });
          break;
        case 5: // مدرکِ نامعتبر → بازبینیِ مدیر
          matches.push({ ...base, scoreA: 4, scoreB: 2, status: 'admin_review', submittedById: aId, submittedAt: minsAgo(9), evidenceCount: 1, blockerReason: 'مدرکِ ارسالی نامعتبر است؛ نیازِ ارسالِ مجدد' });
          break;
        case 6: // زنده
          matches.push({ ...base, scoreA: 1, scoreB: 1, status: 'live', deadline: minsAhead(14), chatUnread: 2 });
          break;
        case 7:
          matches.push({ ...base, status: 'ready', deadline: minsAhead(25) });
          break;
        default: // بقیه کامل
          matches.push({ ...base, scoreA: 3, scoreB: s % 3, winnerId: aId, submittedById: aId, submittedAt: minsAgo(30 + s) });
      }
    }
  }

  const disputes: CRDispute[] = [
    { id: 'fc-d1', matchId: 'fc-r3m0', reporterId: id(1), accusedId: id(0), reason: 'نتیجه ۲-۲ بوده ولی حریف ۳-۱ ثبت کرده؛ اسکرین‌شاتِ پایانِ بازی پیوست است', evidenceCount: 2, status: 'open', deadline: minsAhead(20), suggestedAction: 'مقایسه‌ی اسکرین‌شاتِ پایانِ بازیِ هر دو طرف' },
  ];

  const activity: CRActivity[] = [
    { id: 'fc-a1', kind: 'dispute', text: `${P[1].name} برای مسابقه‌ی #${(2 * 16 + 1).toLocaleString('fa-IR')} اختلاف باز کرد`, at: minsAgo(18) },
    { id: 'fc-a2', kind: 'admin', text: 'مسابقه‌ی دارای مدرکِ نامعتبر به بازبینیِ مدیر رفت', at: minsAgo(9) },
    { id: 'fc-a3', kind: 'result', text: `${P[8].name} نتیجه را ثبت کرد`, at: minsAgo(4) },
    { id: 'fc-a4', kind: 'admin', text: 'هشدارِ مهلتِ گذشته برای ۱ مسابقه صادر شد', at: minsAgo(8) },
    { id: 'fc-a5', kind: 'admin', text: 'مرحله‌ی ۶۴تایی تکمیل شد', at: minsAgo(60) },
  ];

  return {
    tournamentId: t.id, title: t.title, game: t.game, format: t.format, prize: t.prize,
    phase: 'dispute_review', currentRound: current, totalRounds: total, roundName: roundName(t.format, current, total),
    nextScheduled: minsAhead(20), estimatedFinish: minsAhead(180),
    participants: P, matches, disputes, activity,
  };
}

export function buildCore(t: AdminTournament): ControlRoomCore {
  if (t.id === 't1') return buildValorant(t);
  if (t.id === 't7') return buildFC26(t);
  if (t.format === 'battle_royale') return buildBattleRoyale(t);
  if (t.format === 'round_robin' || t.format === 'league') return buildRoundRobin(t);
  return buildEliminationGeneric(t);
}

// ───────── derive: محاسبه‌ی همه‌ی موارد مشتق ─────────
const ACTIVE_STATES: CRParticipantStatus[] = ['registered', 'checked_in', 'playing', 'waiting'];
const PENDING_MATCH: CRMatchStatus[] = ['result_submitted', 'awaiting_opponent_confirmation', 'admin_review'];

function computeStandings(core: ControlRoomCore): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const p of core.participants) map.set(p.id, { id: p.id, name: p.name, color: p.color, played: 0, win: 0, draw: 0, loss: 0, diff: 0, points: 0 });
  for (const m of core.matches) {
    if (m.status !== 'completed' || !m.aId || !m.bId) continue;
    const a = map.get(m.aId); const b = map.get(m.bId);
    if (!a || !b) continue;
    a.played++; b.played++; a.diff += m.scoreA - m.scoreB; b.diff += m.scoreB - m.scoreA;
    if (m.scoreA > m.scoreB) { a.win++; a.points += 3; b.loss++; }
    else if (m.scoreA < m.scoreB) { b.win++; b.points += 3; a.loss++; }
    else { a.draw++; b.draw++; a.points++; b.points++; }
  }
  return [...map.values()].sort((x, y) => y.points - x.points || y.diff - x.diff);
}

function computeLeaderboard(core: ControlRoomCore): LeaderboardRow[] {
  return core.participants
    .map((p, i) => {
      const placementPts = Math.max(0, 100 - i * 7);
      const killPts = ((i * 13 + 7) % 20) + 3;
      return { id: p.id, name: p.name, color: p.color, placementPts, killPts, total: placementPts + killPts };
    })
    .sort((a, b) => b.total - a.total);
}

function buildRoadmap(core: ControlRoomCore, openDisputes: number, missingResults: number): RoadmapStep[] {
  const fa = (n: number) => n.toLocaleString('fa-IR');
  const finished = core.phase === 'completed' || core.phase === 'paid';
  const noShow = core.participants.filter((p) => p.status === 'no_show').length;
  const bracketLabel = core.format === 'battle_royale' ? 'آماده‌سازیِ لابی' : 'ساختِ براکت';

  // فازهای پیش از شروع
  if (core.phase === 'registration' || core.phase === 'check_in') {
    const rounds: RoadmapStep[] = [];
    for (let r = 1; r <= core.totalRounds; r++) rounds.push({ key: `r${r}`, kind: 'round', round: r, label: roundName(core.format, r, core.totalRounds), state: 'upcoming' });
    return [
      { key: 'reg', kind: 'registration', label: 'ثبت‌نام', state: core.phase === 'registration' ? 'current' : 'completed', needsAction: core.phase === 'registration' },
      { key: 'checkin', kind: 'check_in', label: 'چک‌این', state: core.phase === 'check_in' ? 'current' : 'upcoming', needsAction: core.phase === 'check_in' },
      { key: 'bracket', kind: 'bracket', label: bracketLabel, state: 'upcoming' },
      ...rounds,
      { key: 'verify', kind: 'verify', label: 'تأییدِ نتایج', state: 'upcoming' },
      { key: 'payout', kind: 'payout', label: 'پرداختِ جایزه', state: 'locked', badge: 'بعد از پایان' },
    ];
  }

  const pre: RoadmapStep[] = [
    { key: 'reg', kind: 'registration', label: 'ثبت‌نام', state: 'completed' },
    { key: 'checkin', kind: 'check_in', label: 'چک‌این', state: 'completed' },
    { key: 'bracket', kind: 'bracket', label: bracketLabel, state: 'completed' },
  ];

  const rounds: RoadmapStep[] = [];
  for (let r = 1; r <= core.totalRounds; r++) {
    let state: RoadmapState = 'upcoming';
    let badge: string | undefined;
    let blockerReason: string | undefined;
    let needsAction = false;
    if (finished || r < core.currentRound) state = 'completed';
    else if (r === core.currentRound) {
      if (openDisputes > 0) { state = 'blocked'; badge = `${fa(openDisputes)} اختلافِ باز`; blockerReason = 'اختلافِ باز مانعِ ادامه است'; needsAction = true; }
      else if (missingResults > 0) { state = 'warning'; badge = `${fa(missingResults)} نتیجه‌ی معلق`; needsAction = true; }
      else if (noShow > 0) { state = 'warning'; badge = `${fa(noShow)} غایب`; needsAction = true; }
      else { state = 'current'; badge = 'در جریان'; }
    } else if (r === core.currentRound + 1) {
      if (openDisputes > 0 || missingResults > 0) { state = 'locked'; badge = 'منتظرِ حلِ مانع'; }
      else state = 'upcoming';
    }
    rounds.push({ key: `r${r}`, kind: 'round', round: r, label: roundName(core.format, r, core.totalRounds), state, badge, blockerReason, needsAction });
  }

  const verifyState: RoadmapState = finished || core.phase === 'payout_pending' ? 'completed' : missingResults > 0 ? 'warning' : 'upcoming';
  let payoutState: RoadmapState = 'locked';
  let payoutBadge: string | undefined = 'بعد از پایانِ تورنومنت';
  if (core.phase === 'paid') { payoutState = 'completed'; payoutBadge = undefined; }
  else if (core.phase === 'payout_pending') {
    if (openDisputes > 0) { payoutState = 'blocked'; payoutBadge = 'اختلافِ باز'; }
    else { payoutState = 'pending_admin'; payoutBadge = 'آماده‌ی آزادسازی'; }
  }

  const post: RoadmapStep[] = [
    { key: 'verify', kind: 'verify', label: 'تأییدِ نتایج', state: verifyState, badge: verifyState === 'warning' ? `${fa(missingResults)} معلق` : undefined, needsAction: verifyState === 'warning' },
    { key: 'payout', kind: 'payout', label: 'پرداختِ جایزه', state: payoutState, badge: payoutBadge, needsAction: payoutState === 'pending_admin' },
  ];

  return [...pre, ...rounds, ...post];
}

function buildActionQueue(core: ControlRoomCore): ActionQueueItem[] {
  const out: ActionQueueItem[] = [];
  for (const d of core.disputes) {
    if (d.status === 'open' || d.status === 'under_review') {
      const m = core.matches.find((x) => x.id === d.matchId);
      out.push({ id: `aq-${d.id}`, priority: 'critical', title: `حلِ اختلافِ مسابقه‌ی #${(m?.number ?? 0).toLocaleString('fa-IR')}`, detail: d.reason, disputeId: d.id, matchId: d.matchId, action: 'resolve_dispute' });
    }
  }
  for (const m of core.matches) {
    if (PENDING_MATCH.includes(m.status)) {
      out.push({ id: `aq-res-${m.id}`, priority: 'warning', title: `تأییدِ نتیجه‌ی مسابقه‌ی #${m.number.toLocaleString('fa-IR')}`, detail: m.submittedById ? 'نتیجه ثبت شده، منتظرِ تأیید' : 'بازبینیِ نتیجه', matchId: m.id, action: 'approve_result' });
    }
    if (m.status === 'no_show') {
      out.push({ id: `aq-ns-${m.id}`, priority: 'warning', title: `عدمِ حضور در مسابقه‌ی #${m.number.toLocaleString('fa-IR')}`, detail: 'تأییدِ عدمِ حضور و صعودِ حریف', matchId: m.id, action: 'mark_no_show' });
    }
    if (m.status === 'double_no_show') {
      out.push({ id: `aq-dns-${m.id}`, priority: 'warning', title: `عدمِ حضورِ دوطرفه در مسابقه‌ی #${m.number.toLocaleString('fa-IR')}`, detail: 'هر دو غایب — اخطار به طرفین و تصمیمِ مدیر', matchId: m.id, action: 'open_match' });
    }
    if (m.status === 'expired' || (m.deadline && Date.parse(m.deadline) < NOW && (m.status === 'scheduled' || m.status === 'ready' || m.status === 'live'))) {
      out.push({ id: `aq-exp-${m.id}`, priority: 'warning', title: `مهلتِ مسابقه‌ی #${m.number.toLocaleString('fa-IR')} گذشته`, detail: 'هیچ نتیجه‌ای ثبت نشده — بررسی یا عدمِ حضور', matchId: m.id, action: 'open_match' });
    }
  }
  const noShow = core.participants.filter((p) => p.status === 'no_show');
  for (const p of noShow) out.push({ id: `aq-nsp-${p.id}`, priority: 'warning', title: `${p.name} غایب است`, detail: 'تعیینِ تکلیف یا جایگزینی', participantId: p.id, action: 'mark_no_show' });

  if (core.phase === 'payout_pending') out.push({ id: 'aq-payout', priority: 'normal', title: 'آزادسازیِ جایزه', detail: `${money(core.prize)} آماده‌ی پرداخت است`, action: 'release_prize' });

  const order = { critical: 0, warning: 1, normal: 2 } as const;
  return out.sort((a, b) => order[a.priority] - order[b.priority]);
}

function nextRoundReadiness(core: ControlRoomCore): { ready: boolean; reasons: string[]; label: string } {
  const reasons: string[] = [];
  const curMatches = core.matches.filter((m) => m.round === core.currentRound);
  const openDisputes = core.disputes.filter((d) => d.status === 'open' || d.status === 'under_review');
  for (const d of openDisputes) {
    const m = core.matches.find((x) => x.id === d.matchId);
    reasons.push(`مسابقه‌ی #${(m?.number ?? 0).toLocaleString('fa-IR')} اختلافِ باز دارد`);
  }
  for (const m of curMatches) {
    if (m.status !== 'completed' && m.status !== 'cancelled' && !reasons.some((r) => r.includes(`#${m.number.toLocaleString('fa-IR')}`)))
      reasons.push(`مسابقه‌ی #${m.number.toLocaleString('fa-IR')} هنوز کامل نشده (${CRMATCH_FA[m.status]})`);
  }
  const noShow = core.participants.filter((p) => p.status === 'no_show');
  if (noShow.length) reasons.push(`${noShow.length.toLocaleString('fa-IR')} بازیکنِ غایبِ بدونِ تعیینِ تکلیف`);

  const last = core.currentRound >= core.totalRounds;
  const label = last ? 'پایانِ تورنومنت' : core.currentRound + 1 === core.totalRounds ? 'شروعِ فینال' : `ساختِ ${roundName(core.format, core.currentRound + 1, core.totalRounds)}`;
  return { ready: reasons.length === 0 && curMatches.length > 0, reasons, label };
}

function buildSummary(core: ControlRoomCore, standings?: StandingRow[], leaderboard?: LeaderboardRow[]): CRSummary {
  const finished = core.phase === 'completed' || core.phase === 'paid';
  if (finished) {
    const champ = core.participants.find((p) => p.status === 'winner') ?? core.participants[0];
    const finalM = [...core.matches].reverse().find((m) => m.status === 'completed');
    return {
      championId: champ?.id,
      runnerUpId: core.matches.find((m) => m.winnerId === champ?.id && (m.aId === champ?.id ? m.bId : m.aId))?.[champ?.id ? 'bId' : 'aId'] ?? undefined,
      finalScore: finalM ? `${finalM.scoreA.toLocaleString('fa-IR')} - ${finalM.scoreB.toLocaleString('fa-IR')}` : undefined,
      payoutStatus: core.phase === 'paid' ? 'پرداخت‌شده' : 'در انتظارِ پرداخت',
      blockers: [],
    };
  }
  if (core.phase === 'payout_pending') {
    const champ = leaderboard?.[0] ?? core.participants[0];
    return { championId: champ?.id, payoutStatus: 'در انتظارِ آزادسازیِ جایزه', blockers: ['جایزه هنوز آزاد نشده'], nextAction: 'آزادسازیِ جایزه' };
  }
  const live = core.matches.find((m) => m.status === 'live');
  const openD = core.disputes.filter((d) => d.status === 'open' || d.status === 'under_review');
  const missing = core.matches.filter((m) => m.round === core.currentRound && PENDING_MATCH.includes(m.status)).length;
  const blockers = [
    ...openD.map((d) => {
      const m = core.matches.find((x) => x.id === d.matchId);
      return `اختلافِ بازِ مسابقه‌ی #${(m?.number ?? 0).toLocaleString('fa-IR')}`;
    }),
    ...(missing ? [`${missing.toLocaleString('fa-IR')} نتیجه در انتظارِ تأیید`] : []),
  ];
  let leadingId: string | undefined;
  if (live) leadingId = live.scoreA >= live.scoreB ? live.aId ?? undefined : live.bId ?? undefined;
  else if (standings?.length) leadingId = standings[0].id;
  return {
    leadingId,
    currentMatchId: live?.id,
    blockers,
    nextAction: openD.length ? 'حلِ اختلافِ باز' : missing ? 'تأییدِ نتایجِ معلق' : 'ادامه‌ی دور',
    estimatedNext: core.nextScheduled ? relTime(core.nextScheduled) : undefined,
    missingResults: missing,
    deadline: core.matches.find((m) => m.deadline)?.deadline,
  };
}

export function derive(core: ControlRoomCore): ControlRoomState {
  const totalCount = core.participants.length;
  const activeCount = core.participants.filter((p) => ACTIVE_STATES.includes(p.status)).length;
  const curMatches = core.matches.filter((m) => m.round === core.currentRound);
  const currentRoundTotal = curMatches.length;
  const currentRoundCompleted = curMatches.filter((m) => m.status === 'completed').length;
  const pendingResults = core.matches.filter((m) => PENDING_MATCH.includes(m.status)).length;
  const openDisputes = core.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;

  let statusTone: StatusTone = 'good';
  if (core.phase === 'completed' || core.phase === 'paid' || core.phase === 'payout_pending') statusTone = 'idle';
  if (pendingResults > 0 || core.participants.some((p) => p.status === 'no_show')) statusTone = 'warning';
  if (openDisputes > 0) statusTone = 'critical';

  const standings = core.format === 'round_robin' || core.format === 'league' || core.format === 'swiss' ? computeStandings(core) : undefined;
  const leaderboard = core.format === 'battle_royale' ? computeLeaderboard(core) : undefined;

  return {
    ...core,
    statusTone,
    activeCount,
    totalCount,
    currentRoundCompleted,
    currentRoundTotal,
    pendingResults,
    openDisputes,
    roadmap: buildRoadmap(core, openDisputes, pendingResults),
    actionQueue: buildActionQueue(core),
    summary: buildSummary(core, standings, leaderboard),
    nextRound: nextRoundReadiness(core),
    standings,
    leaderboard,
  };
}

export function buildControlRoom(t: AdminTournament): ControlRoomState {
  return derive(buildCore(t));
}

export const FORMAT_LABEL = FORMAT_FA;
export function participantById(cr: ControlRoomState, id?: string | null): CRParticipant | undefined {
  if (!id) return undefined;
  return cr.participants.find((p) => p.id === id);
}
