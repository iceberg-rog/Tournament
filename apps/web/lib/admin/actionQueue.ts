// مدلِ صفِ اقدامات — هر آیتم از دادهٔ واقعی (control board + درخواست‌ها + مالی) ساخته
// می‌شود؛ با دلیل، اثر، SLA، اولویت، گروه و CTAی اختصاصی. هیچ ردیفِ hardcoded نیست.

import {
  ORGANIZER_REQUESTS,
  KYC_QUEUE,
  REPORTS,
  PAYOUTS,
  REPORT_CAT_FA,
  money,
  type AdminTournament,
} from '@/lib/admin';
import { buildControlRoom, participantById } from '@/lib/admin/controlRoom';
import type { AdminRole } from '@/lib/admin/ops';

export type AdminActionPriority = 'critical' | 'urgent' | 'normal' | 'low';
export type AdminActionType =
  | 'tournament_approval'
  | 'dispute'
  | 'missing_result'
  | 'no_show'
  | 'double_no_show'
  | 'invalid_evidence'
  | 'payout'
  | 'refund'
  | 'kyc'
  | 'organizer_request'
  | 'report'
  | 'ticket'
  | 'system_health';
export type AdminActionStatus = 'open' | 'in_review' | 'waiting_external' | 'resolved' | 'dismissed';
export type ActionGroup = 'critical_blockers' | 'tournament_review' | 'live_ops' | 'finance' | 'moderation' | 'identity';
export type Sla = 'ok' | 'due_soon' | 'overdue' | 'none';

export interface AdminActionItem {
  id: string;
  type: AdminActionType;
  priority: AdminActionPriority;
  status: AdminActionStatus;
  group: ActionGroup;
  title: string;
  entityLine: string;
  reason?: string;
  impact?: string;
  tournamentId?: string;
  matchId?: string;
  playerNames?: { a?: string; b?: string };
  href: string;
  primaryLabel: string;
  secondary: string[];
  dueAt?: string;
  sla: Sla;
  createdAt: string;
  assignedTo?: string;
}

export const GROUP_META: Record<ActionGroup, { label: string; order: number }> = {
  critical_blockers: { label: 'موانعِ بحرانی', order: 0 },
  tournament_review: { label: 'بررسیِ تورنومنت', order: 1 },
  live_ops: { label: 'عملیاتِ زنده', order: 2 },
  finance: { label: 'مالی', order: 3 },
  moderation: { label: 'نظارت', order: 4 },
  identity: { label: 'هویت و کاربران', order: 5 },
};

export const TYPE_FA: Record<AdminActionType, string> = {
  tournament_approval: 'تورنومنت',
  dispute: 'اختلاف',
  missing_result: 'نتیجه',
  no_show: 'عدمِ حضور',
  double_no_show: 'عدمِ حضورِ دوطرفه',
  invalid_evidence: 'مدرک',
  payout: 'پرداخت',
  refund: 'بازپرداخت',
  kyc: 'احرازِ هویت',
  organizer_request: 'برگزارکننده',
  report: 'گزارشِ تخلف',
  ticket: 'تیکت',
  system_health: 'سیستم',
};

const ROLE_TYPES: Record<AdminRole, AdminActionType[] | '*'> = {
  super_admin: '*',
  tournament_admin: ['tournament_approval', 'dispute', 'missing_result', 'no_show', 'double_no_show', 'invalid_evidence'],
  finance_admin: ['payout', 'refund'],
  moderator: ['report', 'dispute', 'invalid_evidence'],
  support_admin: ['report', 'organizer_request', 'ticket'],
};
export function roleCanSee(role: AdminRole, type: AdminActionType): boolean {
  const t = ROLE_TYPES[role];
  return t === '*' || t.includes(type);
}

const PRI_ORDER: Record<AdminActionPriority, number> = { critical: 0, urgent: 1, normal: 2, low: 3 };

// پایه‌ی زمانیِ ثابت (هم‌راستا با controlRoom) برای محاسبه‌ی SLA
const NOW = 1750680000000;
function slaOf(dueAt?: string): Sla {
  if (!dueAt) return 'none';
  const diff = Date.parse(dueAt) - NOW;
  if (diff < 0) return 'overdue';
  if (diff < 30 * 60000) return 'due_soon';
  return 'ok';
}
export function slaLabel(item: AdminActionItem): string {
  if (item.sla === 'none' || !item.dueAt) return 'بدونِ مهلت';
  const diff = Date.parse(item.dueAt) - NOW;
  const m = Math.round(Math.abs(diff) / 60000);
  const fa = (n: number) => n.toLocaleString('fa-IR');
  if (item.sla === 'overdue') return `Overdue · ${fa(m)} دقیقه`;
  return `مهلت: ${fa(m)} دقیقه دیگر`;
}

const num = (n: number) => `#${n.toLocaleString('fa-IR')}`;

/** ساختِ همه‌ی آیتم‌های صف از دادهٔ واقعی. */
export function buildActionQueue(tournaments: AdminTournament[]): AdminActionItem[] {
  const out: AdminActionItem[] = [];
  const created = new Date(NOW - 15 * 60000).toISOString();

  for (const t of tournaments) {
    const cr = buildControlRoom(t);
    const nextRound = cr.nextRound.label;

    // اختلاف‌های باز → موانعِ بحرانی
    for (const d of cr.disputes.filter((x) => x.status === 'open' || x.status === 'under_review')) {
      const m = cr.matches.find((x) => x.id === d.matchId);
      const a = participantById(cr, m?.aId);
      const b = participantById(cr, m?.bId);
      out.push({
        id: `aq-dis-${d.id}`,
        type: 'dispute',
        priority: 'critical',
        status: 'open',
        group: 'critical_blockers',
        title: `اختلافِ مسابقه‌ی ${num(m?.number ?? 0)} مانعِ ${nextRound} است`,
        entityLine: `${t.title} · ${cr.roundName} · مسابقه‌ی ${num(m?.number ?? 0)}`,
        reason: d.reason,
        impact: 'تا حلِ اختلاف، دورِ بعدی و پرداختِ جایزه قفل می‌ماند.',
        tournamentId: t.id,
        matchId: d.matchId,
        playerNames: { a: a?.name, b: b?.name },
        href: `/admin/tournaments/${t.id}/disputes`,
        primaryLabel: 'بررسیِ اختلاف',
        secondary: ['مشاهده‌ی تورنومنت', 'پیام به طرفین', 'نادیده‌گرفتن'],
        dueAt: d.deadline,
        sla: slaOf(d.deadline),
        createdAt: created,
      });
    }

    // مهلتِ گذشته بدونِ نتیجه → موانعِ بحرانی
    for (const m of cr.matches.filter((x) => x.status === 'expired')) {
      out.push({
        id: `aq-exp-${m.id}`,
        type: 'missing_result',
        priority: 'urgent',
        status: 'open',
        group: 'critical_blockers',
        title: `مسابقه‌ی ${num(m.number)} مهلتِ ثبتِ نتیجه را رد کرده`,
        entityLine: `${t.title} · ${m.roundName} · مسابقه‌ی ${num(m.number)}`,
        reason: 'هیچ نتیجه‌ای از دو بازیکن ثبت نشده و پیامِ خودکار بی‌پاسخ مانده.',
        impact: 'مسابقه باید به بازبینیِ مدیر یا عدمِ حضور برود؛ دورِ جاری کامل نمی‌شود.',
        tournamentId: t.id,
        matchId: m.id,
        href: `/admin/tournaments/${t.id}/control-room`,
        primaryLabel: 'رسیدگی به نتیجه‌ی ثبت‌نشده',
        secondary: ['بازکردنِ مسابقه', 'ثبتِ عدمِ حضور', 'نادیده‌گرفتن'],
        dueAt: m.deadline,
        sla: 'overdue',
        createdAt: created,
      });
    }

    // عدمِ حضورِ یک‌طرفه → عملیاتِ زنده
    for (const m of cr.matches.filter((x) => x.status === 'no_show')) {
      const present = participantById(cr, m.submittedById ?? m.aId);
      const absent = participantById(cr, m.submittedById === m.aId ? m.bId : m.aId);
      out.push({
        id: `aq-ns-${m.id}`,
        type: 'no_show',
        priority: 'urgent',
        status: 'open',
        group: 'live_ops',
        title: `عدمِ حضورِ ${absent?.name ?? 'بازیکن'} در مسابقه‌ی ${num(m.number)}`,
        entityLine: `${t.title} · ${m.roundName} · مسابقه‌ی ${num(m.number)}`,
        reason: `${present?.name ?? 'حریف'} حاضر بوده و مدرک ارسال کرده.`,
        impact: 'با تأییدِ مدیر، حریف صعود می‌کند و بازیکنِ غایب اخطار می‌گیرد (no-showِ دوم → محرومیت).',
        tournamentId: t.id,
        matchId: m.id,
        playerNames: { a: present?.name, b: absent?.name },
        href: `/admin/tournaments/${t.id}/control-room`,
        primaryLabel: 'رسیدگی به عدمِ حضور',
        secondary: ['بازکردنِ مسابقه', 'پیام به بازیکن', 'نادیده‌گرفتن'],
        dueAt: m.deadline,
        sla: slaOf(m.deadline),
        createdAt: created,
      });
    }

    // عدمِ حضورِ دوطرفه → عملیاتِ زنده
    for (const m of cr.matches.filter((x) => x.status === 'double_no_show')) {
      out.push({
        id: `aq-dns-${m.id}`,
        type: 'double_no_show',
        priority: 'normal',
        status: 'open',
        group: 'live_ops',
        title: `عدمِ حضورِ دوطرفه در مسابقه‌ی ${num(m.number)}`,
        entityLine: `${t.title} · ${m.roundName} · مسابقه‌ی ${num(m.number)}`,
        reason: 'هیچ‌یک از دو بازیکن حاضر نشدند و مهلت گذشته است.',
        impact: 'هر دو اخطار می‌گیرند و مسابقه به بازبینیِ مدیر می‌رود.',
        tournamentId: t.id,
        matchId: m.id,
        href: `/admin/tournaments/${t.id}/control-room`,
        primaryLabel: 'رسیدگی به عدمِ حضورِ دوطرفه',
        secondary: ['بازکردنِ مسابقه', 'نادیده‌گرفتن'],
        dueAt: m.deadline,
        sla: 'overdue',
        createdAt: created,
      });
    }

    // مدرکِ نامعتبر (بازبینیِ مدیر) → عملیاتِ زنده
    for (const m of cr.matches.filter((x) => x.status === 'admin_review' && (x.blockerReason ?? '').includes('مدرک'))) {
      out.push({
        id: `aq-ev-${m.id}`,
        type: 'invalid_evidence',
        priority: 'normal',
        status: 'open',
        group: 'live_ops',
        title: `مدرکِ نامعتبر برای مسابقه‌ی ${num(m.number)}`,
        entityLine: `${t.title} · ${m.roundName} · مسابقه‌ی ${num(m.number)}`,
        reason: 'اسکرین‌شات با زمان/نتیجه‌ی مسابقه تطابق ندارد.',
        impact: 'نتیجه نیازمندِ بررسی یا ارسالِ مدرکِ جدید است.',
        tournamentId: t.id,
        matchId: m.id,
        href: `/admin/tournaments/${t.id}/control-room`,
        primaryLabel: 'بررسیِ مدرک',
        secondary: ['بازکردنِ مسابقه', 'درخواستِ مدرکِ جدید', 'نادیده‌گرفتن'],
        dueAt: m.deadline,
        sla: slaOf(m.deadline),
        createdAt: created,
      });
    }

    // پرداختِ قفل‌شده (جایزه در escrow + اختلافِ باز) → مالی/بحرانی
    if (t.escrow === 'locked' && cr.openDisputes > 0 && t.prize > 0) {
      out.push({
        id: `aq-paylock-${t.id}`,
        type: 'payout',
        priority: 'critical',
        status: 'open',
        group: 'critical_blockers',
        title: `پرداختِ جایزه‌ی ${t.title} قفل است`,
        entityLine: `${t.title} · جایزه ${money(t.prize)}`,
        reason: 'یک اختلافِ باز و احتمالِ KYC ناقص برای یکی از برندگان.',
        impact: 'پرداخت تا رفعِ موانع انجام نمی‌شود.',
        tournamentId: t.id,
        href: `/admin/tournaments/${t.id}/finance`,
        primaryLabel: 'مشاهده‌ی موانعِ پرداخت',
        secondary: ['مشاهده‌ی ledger', 'درخواستِ KYC', 'نادیده‌گرفتن'],
        sla: 'none',
        createdAt: created,
      });
    }

    // تورنومنتِ در انتظارِ بررسی → بررسیِ تورنومنت
    if (t.status === 'pending_review') {
      out.push({
        id: `aq-appr-${t.id}`,
        type: 'tournament_approval',
        priority: 'normal',
        status: 'open',
        group: 'tournament_review',
        title: `تورنومنتِ «${t.title}» در انتظارِ تأیید است`,
        entityLine: `${t.game} · ${t.organizer} · جایزه ${money(t.prize)}`,
        reason: 'برگزارکننده تورنومنت را برای انتشار ارسال کرده است.',
        impact: 'تا تأییدِ SHELTER منتشر نمی‌شود.',
        tournamentId: t.id,
        href: `/admin/tournaments`,
        primaryLabel: 'تأیید / ردِ تورنومنت',
        secondary: ['پیش‌نمایشِ صفحه', 'درخواستِ اصلاح', 'نادیده‌گرفتن'],
        sla: 'none',
        createdAt: created,
      });
    }
  }

  // پرداخت‌های معلق (PAYOUTS) → مالی
  for (const p of PAYOUTS.filter((x) => x.status === 'pending')) {
    out.push({
      id: `aq-pay-${p.id}`,
      type: 'payout',
      priority: 'urgent',
      status: 'open',
      group: 'finance',
      title: `پرداختِ جایزه‌ی ${p.tournament} (${p.recipient}) آماده‌ی بررسی است`,
      entityLine: `${p.tournament} · ${money(p.amount)}`,
      reason: 'تورنومنت پایان یافته و جایزه آماده‌ی آزادسازی است.',
      impact: 'تا تأییدِ مالی، برنده جایزه را دریافت نمی‌کند.',
      href: '/admin/finance',
      primaryLabel: 'بررسیِ پرداخت',
      secondary: ['مشاهده‌ی ledger', 'نگه‌داشتنِ پرداخت', 'نادیده‌گرفتن'],
      sla: 'none',
      createdAt: created,
    });
  }

  // درخواست‌های برگزارکننده → هویت
  for (const r of ORGANIZER_REQUESTS.filter((x) => x.status === 'submitted' || x.status === 'under_review')) {
    out.push({
      id: `aq-org-${r.id}`,
      type: 'organizer_request',
      priority: 'normal',
      status: 'open',
      group: 'identity',
      title: `درخواستِ همکاریِ «${r.org}» در انتظارِ بررسی است`,
      entityLine: `${r.org} · ${r.contact}`,
      reason: r.reason,
      impact: 'تا تأیید، برگزارکننده پنلِ محدود دریافت نمی‌کند.',
      href: '/admin/organizer-requests',
      primaryLabel: 'بررسیِ درخواست',
      secondary: ['درخواستِ اطلاعات', 'نادیده‌گرفتن'],
      sla: 'none',
      createdAt: created,
    });
  }

  // KYC در انتظار → هویت
  for (const k of KYC_QUEUE.filter((x) => x.status === 'pending')) {
    out.push({
      id: `aq-kyc-${k.id}`,
      type: 'kyc',
      priority: 'normal',
      status: 'open',
      group: 'identity',
      title: `احرازِ هویتِ ${k.user} در انتظارِ تأیید است`,
      entityLine: `${k.user} · مدارک ارسال شده`,
      reason: 'برای برداشتِ جایزه احرازِ هویتِ تأییدشده لازم است.',
      impact: 'تا تأیید، کاربر نمی‌تواند جایزه برداشت کند.',
      href: '/admin/kyc',
      primaryLabel: 'بررسیِ احرازِ هویت',
      secondary: ['درخواستِ اطلاعاتِ بیشتر', 'نادیده‌گرفتن'],
      sla: 'none',
      createdAt: created,
    });
  }

  // گزارش‌های تخلفِ باز → نظارت
  for (const rep of REPORTS.filter((x) => x.status === 'new')) {
    out.push({
      id: `aq-rep-${rep.id}`,
      type: 'report',
      priority: rep.category === 'cheating' || rep.category === 'fake_result' ? 'urgent' : 'normal',
      status: 'open',
      group: 'moderation',
      title: `گزارشِ ${REPORT_CAT_FA[rep.category]}: ${rep.reporter} علیه ${rep.reported}`,
      entityLine: `${rep.tournament} · ${REPORT_CAT_FA[rep.category]}`,
      reason: 'گزارشِ تخلفِ جدید ثبت شده و نیازمندِ بررسی است.',
      impact: 'در صورتِ تأیید، ممکن است به اخطار/محرومیت/اصلاحِ نتیجه منجر شود.',
      href: '/admin/reports',
      primaryLabel: 'بررسیِ گزارش',
      secondary: ['درخواستِ مدرک', 'ردِ گزارش', 'نادیده‌گرفتن'],
      sla: 'none',
      createdAt: created,
    });
  }

  return out.sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority] || GROUP_META[a.group].order - GROUP_META[b.group].order);
}
