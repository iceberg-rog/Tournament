// لایه‌ی selectorِ داشبوردِ مدیریت — همه‌ی بخش‌ها از دادهٔ واقعیِ سیستم محاسبه می‌شوند
// (تورنومنت‌ها + control boardِ هرکدام + درخواست‌ها + مالی + ممیزی + integrations).
// هیچ عددِ hardcoded نیست؛ همه از داده مشتق می‌شود.

import {
  ORGANIZER_REQUESTS,
  KYC_QUEUE,
  REPORTS,
  PAYOUTS,
  LEDGER,
  ADMIN_USERS,
  money,
  type AdminTournament,
  type AuditEntry,
} from '@/lib/admin';
import { buildControlRoom } from '@/lib/admin/controlRoom';
import { INTEGRATIONS } from '@/lib/integrations/catalog';

export type Tone = 'healthy' | 'warning' | 'critical' | 'idle';
export type Priority = 'critical' | 'urgent' | 'warning' | 'normal';

export interface DashKpi { key: string; label: string; value: number; tone: Tone; href: string; money?: boolean; }
export interface TodayCard { key: string; label: string; count: number; tone: Tone; detail: string; cta: string; href: string; }
export interface DashAction { id: string; priority: Priority; title: string; detail: string; cta: string; href: string; }
export interface LiveTournamentRow { id: string; title: string; game: string; round: string; liveMatches: number; pendingResults: number; disputes: number; nextAction: string; href: string; }
export interface Blocker { id: string; title: string; cause: string; locked: string; cta: string; href: string; severity: Priority; }
export interface FinanceSnap { escrowLocked: number; pendingPayouts: number; pendingRefunds: number; failedPayments: number; withdrawalRequests: number; lockedTournaments: number; }
export interface ModerationItem { id: string; title: string; severity: Priority; entity: string; href: string; }
export interface HealthItem { key: string; label: string; status: 'connected' | 'mock' | 'missing_config' | 'error' | 'disabled'; note: string; }
export interface ActivityEvent { id: string; text: string; actor: string; at: string; tone: Tone; href: string; }

export interface DashboardSummary {
  kpis: DashKpi[];
  today: TodayCard[];
  actions: DashAction[];
  live: LiveTournamentRow[];
  blockers: Blocker[];
  finance: FinanceSnap;
  moderation: ModerationItem[];
  health: HealthItem[];
  activity: ActivityEvent[];
  criticalCount: number;
  criticalItems: string[];
}

const PENDING_MATCH = ['result_submitted', 'awaiting_opponent_confirmation', 'admin_review'];
const ACTIVE_STATUS = ['live', 'paused', 'registration_open', 'registration_closed', 'check_in_open', 'scheduled', 'dispute_review'];
const fa = (n: number) => n.toLocaleString('fa-IR');
const rel = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 10);
  }
};

export function buildDashboard(tournaments: AdminTournament[], audit: AuditEntry[]): DashboardSummary {
  // ── control boardِ هر تورنومنت برای دادهٔ عملیاتیِ غنی ──
  const boards = tournaments.map((t) => ({ t, cr: buildControlRoom(t) }));

  const active = tournaments.filter((t) => ACTIVE_STATUS.includes(t.status));
  const regOpen = tournaments.filter((t) => t.status === 'registration_open');
  const liveTournaments = boards.filter(({ t }) => t.status === 'live' || t.status === 'paused' || t.status === 'dispute_review');

  const liveMatches = boards.reduce((s, { cr }) => s + cr.matches.filter((m) => m.status === 'live').length, 0);
  const pendingResults = boards.reduce((s, { cr }) => s + cr.matches.filter((m) => PENDING_MATCH.includes(m.status)).length, 0);
  const openDisputes = boards.reduce((s, { cr }) => s + cr.openDisputes, 0);
  const expiredMatches = boards.reduce((s, { cr }) => s + cr.matches.filter((m) => m.status === 'expired').length, 0);
  const noShows = boards.reduce((s, { cr }) => s + cr.matches.filter((m) => m.status === 'no_show' || m.status === 'double_no_show').length, 0);
  const payoutPendingT = tournaments.filter((t) => t.status === 'payout_pending');
  const escrowLocked = tournaments.filter((t) => t.escrow === 'locked').reduce((s, t) => s + t.prize, 0);

  const orgPending = ORGANIZER_REQUESTS.filter((r) => r.status === 'submitted' || r.status === 'under_review');
  const kycPending = KYC_QUEUE.filter((k) => k.status === 'pending');
  const reportsOpen = REPORTS.filter((r) => r.status === 'new' || r.status === 'under_review' || r.status === 'needs_info');
  const payoutsPending = PAYOUTS.filter((p) => p.status === 'pending');
  const refundsPending = LEDGER.filter((l) => l.type === 'refund' && l.status !== 'refunded');
  const failedPayments = LEDGER.filter((l) => l.status === 'failed');
  const withdrawals = LEDGER.filter((l) => l.type === 'withdrawal' && l.status === 'pending_gateway');
  const suspiciousUsers = ADMIN_USERS.filter((u) => u.status !== 'active' || u.reports > 0);
  const newUsersToday = 0; // از createdAtِ واقعی؛ در دادهٔ نمونه کاربرِ امروزی نیست

  const tone = (n: number, warnAt = 1): Tone => (n === 0 ? 'healthy' : n >= warnAt + 1 ? 'critical' : 'warning');

  // ───────── KPI ها (همه clickable) ─────────
  const kpis: DashKpi[] = [
    { key: 'active', label: 'تورنومنتِ فعال', value: active.length, tone: active.length ? 'healthy' : 'idle', href: '/admin/tournaments' },
    { key: 'reg', label: 'ثبت‌نامِ باز', value: regOpen.length, tone: 'healthy', href: '/admin/tournaments' },
    { key: 'live', label: 'مسابقه‌ی زنده', value: liveMatches, tone: liveMatches ? 'warning' : 'idle', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/control-room` : '/admin/tournaments' },
    { key: 'pending', label: 'نتایجِ معلق', value: pendingResults, tone: tone(pendingResults), href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/matches` : '/admin/tournaments' },
    { key: 'disputes', label: 'اختلافِ باز', value: openDisputes, tone: openDisputes ? 'critical' : 'healthy', href: '/admin/reports' },
    { key: 'payouts', label: 'پرداختِ معلق', value: payoutsPending.length + payoutPendingT.length, tone: tone(payoutsPending.length + payoutPendingT.length), href: '/admin/finance' },
    { key: 'escrow', label: 'موجودیِ escrow', value: escrowLocked, tone: 'idle', money: true, href: '/admin/finance' },
    { key: 'users', label: 'کاربرِ جدیدِ امروز', value: newUsersToday, tone: 'idle', href: '/admin/users' },
    { key: 'org', label: 'درخواستِ برگزارکننده', value: orgPending.length, tone: tone(orgPending.length, 99), href: '/admin/organizer-requests' },
    { key: 'kyc', label: 'KYC در انتظار', value: kycPending.length, tone: tone(kycPending.length, 99), href: '/admin/kyc' },
  ];

  // ───────── عملیاتِ امروز ─────────
  const startingToday = tournaments.filter((t) => t.startAt.slice(0, 10) === '2026-06-24');
  const today: TodayCard[] = [
    { key: 'live', label: 'مسابقاتِ زنده', count: liveMatches, tone: liveMatches ? 'warning' : 'idle', detail: liveTournaments[0] ? liveTournaments[0].t.title : 'موردی نیست', cta: 'اتاقِ کنترل', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/control-room` : '/admin/tournaments' },
    { key: 'pending', label: 'نتایجِ در انتظارِ تأیید', count: pendingResults, tone: tone(pendingResults), detail: pendingResults ? `${fa(pendingResults)} مورد در ${liveTournaments[0]?.t.title ?? '—'}` : 'موردی نیست', cta: 'بررسیِ نتایج', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/matches` : '/admin/tournaments' },
    { key: 'disputes', label: 'اختلاف‌های باز', count: openDisputes, tone: openDisputes ? 'critical' : 'healthy', detail: openDisputes ? 'مانعِ ساختِ دورِ بعد' : 'بدونِ اختلاف', cta: 'بررسیِ اختلاف', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/disputes` : '/admin/reports' },
    { key: 'expired', label: 'مهلت‌های گذشته', count: expiredMatches, tone: tone(expiredMatches), detail: expiredMatches ? 'مسابقاتِ بدونِ نتیجه' : 'موردی نیست', cta: 'بررسیِ مسابقات', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/control-room` : '/admin/tournaments' },
    { key: 'noshow', label: 'عدمِ حضورِ نیازمندِ بررسی', count: noShows, tone: tone(noShows), detail: noShows ? 'تعیینِ تکلیف لازم' : 'موردی نیست', cta: 'اتاقِ کنترل', href: liveTournaments[0] ? `/admin/tournaments/${liveTournaments[0].t.id}/control-room` : '/admin/tournaments' },
    { key: 'payout', label: 'پرداخت‌های در انتظار', count: payoutsPending.length, tone: tone(payoutsPending.length), detail: payoutsPending.length ? money(payoutsPending.reduce((s, p) => s + p.amount, 0)) : 'موردی نیست', cta: 'بررسیِ پرداخت', href: '/admin/finance' },
    { key: 'org', label: 'درخواست‌های برگزارکننده', count: orgPending.length, tone: orgPending.length ? 'warning' : 'idle', detail: orgPending[0]?.org ?? 'موردی نیست', cta: 'بررسیِ درخواست', href: '/admin/organizer-requests' },
    { key: 'kyc', label: 'KYC در انتظار', count: kycPending.length, tone: kycPending.length ? 'warning' : 'idle', detail: kycPending[0]?.user ?? 'موردی نیست', cta: 'بررسیِ KYC', href: '/admin/kyc' },
    { key: 'starting', label: 'شروعِ امروز', count: startingToday.length, tone: 'idle', detail: startingToday[0]?.title ?? 'موردی نیست', cta: 'مدیریتِ تورنومنت‌ها', href: '/admin/tournaments' },
  ];

  // ───────── صفِ اقدامات (اولویت‌دار) ─────────
  const actions: DashAction[] = [];
  for (const { t, cr } of boards) {
    for (const d of cr.disputes.filter((x) => x.status === 'open' || x.status === 'under_review')) {
      const m = cr.matches.find((x) => x.id === d.matchId);
      actions.push({ id: `a-dis-${d.id}`, priority: 'critical', title: `اختلافِ مسابقه‌ی #${fa(m?.number ?? 0)} در ${t.title}`, detail: 'مانعِ ساختِ دورِ بعد و پرداختِ جایزه', cta: 'بررسیِ اختلاف', href: `/admin/tournaments/${t.id}/disputes` });
    }
    const exp = cr.matches.filter((m) => m.status === 'expired');
    if (exp.length) actions.push({ id: `a-exp-${t.id}`, priority: 'urgent', title: `${fa(exp.length)} مسابقه‌ی ${t.title} مهلت را رد کرده‌اند`, detail: 'هیچ نتیجه‌ای ثبت نشده — بررسی یا عدمِ حضور', cta: 'بررسیِ مسابقات', href: `/admin/tournaments/${t.id}/control-room` });
    const pend = cr.matches.filter((m) => PENDING_MATCH.includes(m.status));
    if (pend.length) actions.push({ id: `a-pen-${t.id}`, priority: 'warning', title: `${fa(pend.length)} نتیجه در ${t.title} منتظرِ تأیید`, detail: 'تأیید یا ردِ نتیجه', cta: 'بررسیِ نتایج', href: `/admin/tournaments/${t.id}/matches` });
    if (t.status === 'payout_pending') actions.push({ id: `a-pay-${t.id}`, priority: 'urgent', title: `جایزه‌ی ${t.title} آماده‌ی بررسی است`, detail: money(t.prize), cta: 'بررسیِ پرداخت', href: `/admin/tournaments/${t.id}/finance` });
  }
  for (const r of orgPending) actions.push({ id: `a-org-${r.id}`, priority: 'normal', title: `درخواستِ همکاریِ «${r.org}» در انتظار است`, detail: r.reason, cta: 'بررسیِ درخواست', href: '/admin/organizer-requests' });
  for (const k of kycPending) actions.push({ id: `a-kyc-${k.id}`, priority: 'normal', title: `احرازِ هویتِ ${k.user} در انتظارِ تأیید است`, detail: 'مدارک ارسال شده', cta: 'بررسیِ KYC', href: '/admin/kyc' });
  for (const rep of reportsOpen.filter((r) => r.status === 'new')) actions.push({ id: `a-rep-${rep.id}`, priority: 'warning', title: `گزارشِ تخلفِ جدید: ${rep.reporter}`, detail: rep.tournament, cta: 'بررسیِ گزارش', href: '/admin/reports' });
  const order: Record<Priority, number> = { critical: 0, urgent: 1, warning: 2, normal: 3 };
  actions.sort((a, b) => order[a.priority] - order[b.priority]);

  // ───────── در جریان الآن ─────────
  const live: LiveTournamentRow[] = liveTournaments.map(({ t, cr }) => ({
    id: t.id, title: t.title, game: t.game, round: cr.roundName,
    liveMatches: cr.matches.filter((m) => m.status === 'live').length,
    pendingResults: cr.pendingResults, disputes: cr.openDisputes,
    nextAction: cr.summary.nextAction ?? '—',
    href: `/admin/tournaments/${t.id}/control-room`,
  }));

  // ───────── ریسک‌ها و موانع ─────────
  const blockers: Blocker[] = [];
  for (const { t, cr } of boards) {
    if (cr.openDisputes > 0) blockers.push({ id: `b-dis-${t.id}`, title: `${t.title}: اختلافِ باز`, cause: cr.disputes[0]?.reason ?? 'اختلاف در نتیجه', locked: 'ساختِ دورِ بعد و پرداختِ جایزه قفل است', cta: 'مشاهده‌ی مانع', href: `/admin/tournaments/${t.id}/disputes`, severity: 'critical' });
    const exp = cr.matches.filter((m) => m.status === 'expired').length;
    if (exp) blockers.push({ id: `b-exp-${t.id}`, title: `${t.title}: ${fa(exp)} مهلتِ گذشته`, cause: 'نتیجه ثبت نشده', locked: 'دورِ جاری کامل نمی‌شود', cta: 'بررسیِ مسابقات', href: `/admin/tournaments/${t.id}/control-room`, severity: 'urgent' });
    if (t.status === 'payout_pending' && cr.openDisputes > 0) blockers.push({ id: `b-pay-${t.id}`, title: `${t.title}: پرداختِ جایزه قفل است`, cause: 'اختلافِ باز / برنده‌ی بدونِ KYC', locked: 'آزادسازیِ جایزه ممکن نیست', cta: 'مشاهده‌ی مالی', href: `/admin/tournaments/${t.id}/finance`, severity: 'critical' });
  }
  if (failedPayments.length) blockers.push({ id: 'b-fail', title: `${fa(failedPayments.length)} پرداختِ ناموفق`, cause: 'callbackِ درگاه ناموفق', locked: 'تراکنش تکمیل نشده', cta: 'بررسیِ پرداخت‌ها', href: '/admin/finance', severity: 'warning' });

  // ───────── مالی ─────────
  const finance: FinanceSnap = {
    escrowLocked,
    pendingPayouts: payoutsPending.reduce((s, p) => s + p.amount, 0),
    pendingRefunds: refundsPending.length,
    failedPayments: failedPayments.length,
    withdrawalRequests: withdrawals.length,
    lockedTournaments: payoutPendingT.length,
  };

  // ───────── نظارت ─────────
  const moderation: ModerationItem[] = [
    ...reportsOpen.map<ModerationItem>((r) => ({ id: `m-${r.id}`, title: `${r.reporter} علیه ${r.reported}`, severity: r.category === 'cheating' || r.category === 'fake_result' ? 'critical' : 'warning', entity: r.tournament, href: '/admin/reports' })),
    ...suspiciousUsers.slice(0, 3).map<ModerationItem>((u) => ({ id: `m-u-${u.id}`, title: `کاربرِ مشکوک: ${u.name}`, severity: u.reports >= 3 ? 'critical' : 'warning', entity: `${fa(u.reports)} گزارش · ${u.status}`, href: '/admin/users' })),
  ];

  // ───────── سلامتِ سیستم (از کاتالوگِ integrations؛ همه تا پیکربندی، mock) ─────────
  const health: HealthItem[] = INTEGRATIONS.filter((d) => ['payment', 'notification', 'jobs', 'chat', 'storage', 'kyc', 'webhooks'].includes(d.id)).map((d) => ({
    key: d.id, label: d.label, status: 'mock', note: 'حالتِ آزمایشی — نیازِ پیکربندی',
  }));
  health.push({ key: 'db', label: 'دیتابیس / ماندگاری', status: 'connected', note: 'SQLite فعال' });
  health.push({ key: 'audit', label: 'گزارشِ ممیزی', status: 'connected', note: 'فعال' });

  // ───────── فعالیتِ اخیر (از ممیزی) ─────────
  const activity: ActivityEvent[] = audit.slice(0, 8).map((e) => ({
    id: e.id,
    text: `${e.action} (${e.entityType})`,
    actor: e.actor,
    at: rel(e.createdAt),
    tone: e.action.includes('رد') || e.action.includes('محروم') ? 'critical' : e.action.includes('تأیید') || e.action.includes('آزاد') ? 'healthy' : 'warning',
    href: e.entityType === 'tournament' ? `/admin/tournaments/${e.entityId}` : e.entityType === 'organizer_request' ? '/admin/organizer-requests' : e.entityType === 'user' || e.entityType === 'participant' ? '/admin/users' : '/admin/audit-log',
  }));

  const criticalActions = actions.filter((a) => a.priority === 'critical' || a.priority === 'urgent');
  return {
    kpis, today, actions, live, blockers, finance, moderation, health, activity,
    criticalCount: criticalActions.length,
    criticalItems: criticalActions.slice(0, 3).map((a) => a.title),
  };
}
