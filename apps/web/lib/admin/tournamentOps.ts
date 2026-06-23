// هسته‌ی دادهٔ عملیاتِ تورنومنت — شرکت‌کننده‌های غنی، برنامه‌ی زمان‌بندی،
// طرحِ notification، چت/اعلان‌ها، اختلاف‌ها و استریم. منبعِ واحدِ همه‌ی تب‌ها.
// FC26 سناریوی کامل؛ بقیه fallbackِ سبک. (mock، adapter-ready، refresh-safe با opsStore)

import type { AdminTournament } from '@/lib/admin';
import { buildControlRoom, type CRParticipant } from '@/lib/admin/controlRoom';

// ───────── enums ─────────
export type ParticipantOpsStatus = 'registered' | 'checked_in' | 'playing' | 'waiting' | 'eliminated' | 'winner' | 'no_show' | 'disqualified' | 'suspended';
export type ChatPolicy = 'everyone_can_chat' | 'admins_only' | 'participants_read_only' | 'muted_until_match_start';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'chat';
export type NotificationDeliveryStatus = 'scheduled' | 'sent' | 'failed' | 'read' | 'unanswered';
export type RoundOpsStatus = 'completed' | 'current' | 'blocked' | 'warning' | 'locked' | 'upcoming';
export type StreamStatus = 'offline' | 'starting' | 'live' | 'degraded' | 'ended';
export type StreamVisibility = 'public' | 'participants' | 'admins';

// ───────── types ─────────
export interface OpsParticipant {
  id: string;
  displayName: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  gameId: string; // PSN/EA ID
  inGameName?: string; // نامِ نمایشیِ اختیاری در براکت
  initials: string;
  color: string;
  status: ParticipantOpsStatus;
  kyc: 'verified' | 'pending' | 'none';
  wallet: 'ok' | 'locked' | 'empty';
  paid: boolean;
  warnings: number;
  noShows: number;
  reports: number;
  seed: number;
  currentMatch?: string;
  lastSeen: string;
  notes?: string;
}

export interface NotificationStep { offset: string; channels: NotificationChannel[]; status: NotificationDeliveryStatus; }
export interface ScheduleRound {
  round: number;
  name: string;
  status: RoundOpsStatus;
  startAt: string;
  checkInStart: string;
  checkInDeadline: string;
  matchDeadline: string;
  resultDeadline: string;
  disputeDeadline: string;
  nextRoundGen: string;
  matches: number;
  notifications: NotificationStep[];
}

export interface ChatMessage { id: string; author: string; role: 'admin' | 'system' | 'player'; text: string; at: string; pinned?: boolean; flagged?: boolean; muted?: boolean; }
export interface Announcement { id: string; title: string; body: string; target: string; channels: NotificationChannel[]; schedule: 'now' | 'before_match' | 'later'; status: NotificationDeliveryStatus; at: string; }
export interface MatchChatThread { matchId: string; number: number; a: string; b: string; unread: number; flagged: boolean; }

export interface DisputeEvidence { id: string; label: string; by: string; }
export interface OpsDispute {
  id: string; matchId: string; number: number; round: string;
  reporter: string; accused: string; claim: string; submitted: string;
  reason: string; evidence: DisputeEvidence[]; deadline: string; status: 'open' | 'under_review' | 'resolved' | 'rejected'; severity: 'critical' | 'warning';
  impact: string; suggested: string;
}

export interface StreamSession { matchId: string; number: string; a: string; b: string; status: StreamStatus; viewers: number; bitrate: number; latency: number; dropped: number; caster?: string; }
export interface StreamConfig {
  enabled: boolean; source: 'internal_mock_stream' | 'rtmp' | 'hls' | 'custom'; title: string;
  streamKey: string; ingestUrl: string; playbackUrl: string; latency: 'low' | 'normal';
  visibility: StreamVisibility; recording: boolean; vod: boolean; chatOverlay: boolean;
}

export interface TournamentOps {
  participants: OpsParticipant[];
  schedule: ScheduleRound[];
  chat: { policy: ChatPolicy; messages: ChatMessage[]; matchThreads: MatchChatThread[] };
  announcements: Announcement[];
  disputes: OpsDispute[];
  stream: { config: StreamConfig; sessions: StreamSession[] };
}

// ───────── helpers ─────────
const NOW = 1750680000000;
const at = (mins: number) => new Date(NOW + mins * 60000).toISOString();
const FIRST = ['علی', 'مهدی', 'رضا', 'حسین', 'سینا', 'آرش', 'کیان', 'پارسا', 'امیر', 'نیما', 'سام', 'بردیا', 'یاسین', 'دانیال', 'متین', 'پویا'];
const LAST = ['رضایی', 'کریمی', 'محمدی', 'احمدی', 'موسوی', 'حسینی', 'نوری', 'صادقی', 'قاسمی', 'یوسفی'];
const HANDLE = ['Phantom', 'Nova', 'Apex', 'Cobalt', 'Valor', 'Nebula', 'Storm', 'Echo', 'Drift', 'Vortex', 'Pulse', 'Rogue', 'Zenith', 'Onyx', 'Frost', 'Blaze'];

function enrich(p: CRParticipant, i: number): OpsParticipant {
  const first = FIRST[(i * 3 + 1) % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  const handle = HANDLE[i % HANDLE.length] + (i % 4 ? '_' + ((i % 90) + 10) : '');
  const status = (p.status === 'registered' ? 'registered' : p.status === 'checked_in' ? 'checked_in' : p.status === 'playing' ? 'playing' : p.status === 'waiting' ? 'waiting' : p.status === 'winner' ? 'winner' : p.status === 'eliminated' ? 'eliminated' : p.status === 'no_show' ? 'no_show' : p.status === 'disqualified' ? 'disqualified' : 'registered') as ParticipantOpsStatus;
  return {
    id: p.id,
    displayName: p.name,
    username: `@${handle.toLowerCase()}`,
    realName: `${first} ${last}`,
    email: `${handle.toLowerCase()}@example.com`,
    phone: `+98 9${(120000000 + i * 137).toString().slice(0, 9)}`,
    gameId: p.psnId ?? `${handle}_${1000 + i}`,
    inGameName: i % 3 === 0 ? `${handle}GG` : undefined,
    initials: p.initials,
    color: p.color,
    status,
    kyc: p.kyc ?? 'none',
    wallet: p.walletStatus ?? 'locked',
    paid: p.paid,
    warnings: p.warnings ?? 0,
    noShows: p.noShows ?? 0,
    reports: p.reports,
    seed: p.seed,
    currentMatch: p.currentMatchId,
    lastSeen: p.lastSeen ?? at(-(i % 40) - 1),
    notes: p.suspicious ? 'پرچمِ مشکوک — بررسیِ چنددستگاهی' : undefined,
  };
}

const ROUND_NAMES = ['مرحله‌ی ۱۲۸تایی', 'مرحله‌ی ۶۴تایی', 'مرحله‌ی ۳۲تایی', 'مرحله‌ی ۱۶تایی', 'یک‌چهارمِ نهایی', 'نیمه‌نهایی', 'فینال'];
function buildSchedule(current: number): ScheduleRound[] {
  return ROUND_NAMES.map((name, idx) => {
    const r = idx + 1;
    const base = (r - 3) * 90; // دقیقه نسبت به اکنون
    const status: RoundOpsStatus = r < current ? 'completed' : r === current ? (current === 3 ? 'blocked' : 'current') : r === current + 1 ? 'locked' : 'upcoming';
    return {
      round: r, name, status,
      startAt: at(base), checkInStart: at(base - 30), checkInDeadline: at(base - 10),
      matchDeadline: at(base + 20), resultDeadline: at(base + 25), disputeDeadline: at(base + 35), nextRoundGen: at(base + 40),
      matches: 128 / Math.pow(2, r),
      notifications: [
        { offset: '۲۴ ساعت قبل', channels: ['in_app', 'email'], status: r <= current ? 'sent' : 'scheduled' },
        { offset: '۱ ساعت قبل', channels: ['in_app', 'push'], status: r <= current ? 'sent' : 'scheduled' },
        { offset: '۱۰ دقیقه قبل', channels: ['in_app', 'chat'], status: r < current ? 'read' : r === current ? 'unanswered' : 'scheduled' },
        { offset: '۵ دقیقه قبل از مهلتِ نتیجه', channels: ['in_app'], status: r === current ? 'unanswered' : 'scheduled' },
      ],
    };
  });
}

function buildFC26Ops(t: AdminTournament): TournamentOps {
  const cr = buildControlRoom(t);
  const participants = cr.participants.map(enrich);
  const byId = (id?: string | null) => participants.find((p) => p.id === id);

  // چتِ گروهی
  const messages: ChatMessage[] = [
    { id: 'c1', author: 'سیستم', role: 'system', text: 'به FC26 Champions Cup خوش آمدید — لطفاً ۳۰ دقیقه قبل از شروع چک‌این کنید.', at: at(-120), pinned: true },
    { id: 'c2', author: 'مدیر سیستم', role: 'admin', text: 'مرحله‌ی ۳۲تایی در حالِ اجراست. نتایج را با اسکرین‌شات ثبت کنید.', at: at(-40) },
    { id: 'c3', author: participants[1]?.displayName ?? 'Nova', role: 'player', text: 'حریفم هنوز نیومده، چیکار کنم؟', at: at(-12) },
    { id: 'c4', author: participants[7]?.displayName ?? 'Echo', role: 'player', text: 'نتیجه‌ی من اشتباه ثبت شده، اعتراض دارم.', at: at(-10), flagged: true },
    { id: 'c5', author: 'مدیر سیستم', role: 'admin', text: 'Echo عزیز، اختلافت ثبت شد و در حالِ بررسی است.', at: at(-8) },
  ];
  const matchThreads: MatchChatThread[] = cr.matches.filter((m) => m.chatUnread > 0).slice(0, 5).map((m) => ({
    matchId: m.id, number: m.number, a: byId(m.aId)?.displayName ?? 'TBD', b: byId(m.bId)?.displayName ?? 'TBD', unread: m.chatUnread, flagged: m.status === 'disputed',
  }));

  const announcements: Announcement[] = [
    { id: 'an1', title: 'شروعِ مرحله‌ی ۳۲تایی', body: 'مسابقات شروع شد؛ ۲۰ دقیقه مهلتِ ثبتِ نتیجه دارید.', target: 'دورِ جاری', channels: ['in_app', 'chat', 'email'], schedule: 'now', status: 'sent', at: at(-40) },
    { id: 'an2', title: 'یادآوریِ چک‌این', body: 'مرحله‌ی ۱۶تایی تا ۹۰ دقیقه‌ی دیگر؛ چک‌این فراموش نشود.', target: 'چک‌این‌شده‌ها', channels: ['in_app', 'push'], schedule: 'later', status: 'scheduled', at: at(60) },
  ];

  const disputes: OpsDispute[] = cr.disputes.map((d) => {
    const m = cr.matches.find((x) => x.id === d.matchId);
    return {
      id: d.id, matchId: d.matchId, number: m?.number ?? 0, round: m?.roundName ?? '—',
      reporter: byId(d.reporterId)?.displayName ?? 'Echo', accused: byId(d.accusedId)?.displayName ?? 'Cobalt',
      claim: 'نتیجه ۲-۲ بوده', submitted: '۳-۱ (توسطِ حریف)', reason: d.reason,
      evidence: [{ id: 'e1', label: 'اسکرین‌شاتِ پایانِ بازی', by: byId(d.reporterId)?.displayName ?? 'Echo' }, { id: 'e2', label: 'اسکرین‌شاتِ امتیاز', by: byId(d.accusedId)?.displayName ?? 'Cobalt' }],
      deadline: d.deadline ?? at(20), status: d.status, severity: 'critical',
      impact: 'تا حلِ اختلاف، دورِ بعد و پرداختِ جایزه قفل است.', suggested: d.suggestedAction ?? 'مقایسه‌ی اسکرین‌شاتِ پایانِ بازی',
    };
  });

  const sessions: StreamSession[] = cr.matches.filter((m) => m.status === 'live' || m.status === 'result_submitted').slice(0, 3).map((m, i) => ({
    matchId: m.id, number: `#${m.number.toLocaleString('fa-IR')}`, a: byId(m.aId)?.displayName ?? 'TBD', b: byId(m.bId)?.displayName ?? 'TBD',
    status: m.status === 'live' ? 'live' : 'offline', viewers: m.status === 'live' ? 1240 - i * 180 : 0,
    bitrate: m.status === 'live' ? 6000 : 0, latency: m.status === 'live' ? 2.1 : 0, dropped: m.status === 'live' ? 3 : 0,
    caster: i === 0 ? 'کستر: ArashTV' : undefined,
  }));

  return {
    participants,
    schedule: buildSchedule(cr.currentRound),
    chat: { policy: 'everyone_can_chat', messages, matchThreads },
    announcements,
    disputes,
    stream: {
      config: { enabled: true, source: 'internal_mock_stream', title: 'FC26 Champions Cup — پخشِ زنده', streamKey: 'sk_live_••••', ingestUrl: 'rtmp://ingest.shelter.gg/live', playbackUrl: 'https://shelter.gg/tournaments/t7/live', latency: 'low', visibility: 'public', recording: true, vod: true, chatOverlay: true },
      sessions,
    },
  };
}

function buildGenericOps(t: AdminTournament): TournamentOps {
  const cr = buildControlRoom(t);
  return {
    participants: cr.participants.map(enrich),
    schedule: buildSchedule(cr.currentRound || 1),
    chat: { policy: 'everyone_can_chat', messages: [{ id: 'g1', author: 'سیستم', role: 'system', text: 'چتِ تورنومنت فعال است.', at: at(-30) }], matchThreads: [] },
    announcements: [],
    disputes: [],
    stream: { config: { enabled: false, source: 'internal_mock_stream', title: t.title, streamKey: '', ingestUrl: '', playbackUrl: '', latency: 'low', visibility: 'public', recording: false, vod: false, chatOverlay: true }, sessions: [] },
  };
}

export function buildTournamentOps(t: AdminTournament): TournamentOps {
  return t.id === 't7' ? buildFC26Ops(t) : buildGenericOps(t);
}

export const PARTICIPANT_OPS_FA: Record<ParticipantOpsStatus, string> = {
  registered: 'ثبت‌نام‌شده', checked_in: 'چک‌این‌شده', playing: 'در حالِ بازی', waiting: 'منتظر', eliminated: 'حذف‌شده', winner: 'برنده', no_show: 'غایب', disqualified: 'محروم', suspended: 'تعلیق',
};
export const CHAT_POLICY_FA: Record<ChatPolicy, string> = {
  everyone_can_chat: 'همه می‌توانند چت کنند', admins_only: 'فقط مدیران', participants_read_only: 'شرکت‌کننده‌ها فقط‌خواندنی', muted_until_match_start: 'بی‌صدا تا شروعِ مسابقه',
};
export const STREAM_STATUS_FA: Record<StreamStatus, string> = { offline: 'آفلاین', starting: 'در حالِ شروع', live: 'زنده', degraded: 'افتِ کیفیت', ended: 'پایان‌یافته' };
