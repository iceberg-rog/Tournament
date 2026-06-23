// لایه‌ی دادهٔ پنلِ مدیریت — تایپ‌ها + دادهٔ mockِ typed + getterها (به‌جای fetchِ واقعی).
// وقتی endpointهای واقعی آماده شدند، فقط getterها به API وصل می‌شوند.

export const fmt = (n: number) => n.toLocaleString('fa-IR');
export const money = (n: number) => `${fmt(n)} تومان`;

// ───────── چرخه‌ی حیاتِ تورنومنت ─────────
export type TournamentStatus =
  | 'draft'
  | 'pending_review'
  | 'rejected'
  | 'approved'
  | 'scheduled'
  | 'registration_open'
  | 'registration_closed'
  | 'check_in'
  | 'live'
  | 'paused'
  | 'dispute_review'
  | 'completed'
  | 'payout_pending'
  | 'paid'
  | 'archived'
  | 'cancelled';

export type Tone = 'accent' | 'gold' | 'bad' | 'good' | 'muted';

export const TOURNAMENT_STATUS_META: Record<TournamentStatus, { label: string; tone: Tone }> = {
  draft: { label: 'پیش‌نویس', tone: 'muted' },
  pending_review: { label: 'در انتظارِ بررسی', tone: 'gold' },
  rejected: { label: 'ردشده', tone: 'bad' },
  approved: { label: 'تأییدشده', tone: 'accent' },
  scheduled: { label: 'زمان‌بندی‌شده', tone: 'accent' },
  registration_open: { label: 'ثبت‌نام باز', tone: 'accent' },
  registration_closed: { label: 'ثبت‌نام بسته', tone: 'muted' },
  check_in: { label: 'چک‌این', tone: 'gold' },
  live: { label: 'زنده', tone: 'bad' },
  paused: { label: 'متوقف', tone: 'gold' },
  dispute_review: { label: 'بررسیِ اختلاف', tone: 'bad' },
  completed: { label: 'پایان‌یافته', tone: 'good' },
  payout_pending: { label: 'در انتظارِ پرداخت', tone: 'gold' },
  paid: { label: 'پرداخت‌شده', tone: 'good' },
  archived: { label: 'بایگانی', tone: 'muted' },
  cancelled: { label: 'لغوشده', tone: 'bad' },
};

/** اقدام‌های مجاز در هر وضعیت (راهنمای lifecycle). */
export const TOURNAMENT_ACTIONS: Record<TournamentStatus, string[]> = {
  draft: ['ویرایش', 'ارسال برای بررسی', 'حذف'],
  pending_review: ['تأیید', 'رد', 'درخواستِ اصلاح'],
  rejected: ['ویرایش', 'ارسالِ مجدد'],
  approved: ['زمان‌بندی', 'بازکردنِ ثبت‌نام'],
  scheduled: ['بازکردنِ ثبت‌نام', 'ویرایش'],
  registration_open: ['بستنِ ثبت‌نام', 'اعلان', 'ویرایشِ محدود'],
  registration_closed: ['بازکردنِ چک‌این', 'ساختِ براکت'],
  check_in: ['بستنِ چک‌این', 'ساختِ براکت'],
  live: ['اتاقِ کنترل', 'توقف', 'تأییدِ نتایج'],
  paused: ['ادامه', 'لغو'],
  dispute_review: ['حلِ اختلاف', 'ادامه'],
  completed: ['آماده‌سازیِ پرداخت', 'مرورِ رده‌بندی'],
  payout_pending: ['آزادسازیِ جایزه', 'بازپرداخت'],
  paid: ['بایگانی'],
  archived: [],
  cancelled: [],
};

export interface AdminTournament {
  id: string;
  title: string;
  game: string;
  status: TournamentStatus;
  participants: number;
  maxParticipants: number;
  platform: string;
  prize: number;
  organizer: string;
  startAt: string;
}

// ───────── درخواست‌های برگزارکننده ─────────
export type OrganizerRequestStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export const ORG_REQ_META: Record<OrganizerRequestStatus, { label: string; tone: Tone }> = {
  submitted: { label: 'ارسال‌شده', tone: 'gold' },
  under_review: { label: 'در حالِ بررسی', tone: 'accent' },
  approved: { label: 'تأییدشده', tone: 'good' },
  rejected: { label: 'ردشده', tone: 'bad' },
};
export interface OrganizerRequest {
  id: string;
  org: string;
  contact: string;
  reason: string;
  experience: string;
  status: OrganizerRequestStatus;
  createdAt: string;
}

// ───────── کاربران ─────────
export type UserStatus = 'active' | 'suspended' | 'banned';
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired';
export const KYC_META: Record<KycStatus, { label: string; tone: Tone }> = {
  not_started: { label: 'شروع‌نشده', tone: 'muted' },
  pending: { label: 'در انتظار', tone: 'gold' },
  verified: { label: 'تأییدشده', tone: 'good' },
  rejected: { label: 'ردشده', tone: 'bad' },
  expired: { label: 'منقضی', tone: 'muted' },
};
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  balance: number;
  kyc: KycStatus;
  joined: number;
  reports: number;
  createdAt: string;
}

// ───────── گزارش‌های تخلف ─────────
export type ReportCategory = 'cheating' | 'harassment' | 'no_show' | 'fake_result' | 'payment_issue' | 'smurfing' | 'other';
export type ReportStatus = 'new' | 'under_review' | 'needs_info' | 'action_taken' | 'rejected' | 'closed';
export const REPORT_CAT_FA: Record<ReportCategory, string> = {
  cheating: 'تقلب', harassment: 'آزار', no_show: 'عدمِ حضور', fake_result: 'نتیجه‌ی جعلی', payment_issue: 'مشکلِ پرداخت', smurfing: 'اسمرفینگ', other: 'سایر',
};
export const REPORT_STATUS_META: Record<ReportStatus, { label: string; tone: Tone }> = {
  new: { label: 'جدید', tone: 'gold' },
  under_review: { label: 'در حالِ بررسی', tone: 'accent' },
  needs_info: { label: 'نیازِ به اطلاعات', tone: 'gold' },
  action_taken: { label: 'اقدام‌شده', tone: 'good' },
  rejected: { label: 'ردشده', tone: 'muted' },
  closed: { label: 'بسته‌شده', tone: 'muted' },
};
export interface ReportItem {
  id: string;
  reporter: string;
  reported: string;
  tournament: string;
  category: ReportCategory;
  status: ReportStatus;
  createdAt: string;
}

// ───────── مالی ─────────
export type LedgerType = 'deposit' | 'entry_fee' | 'escrow_lock' | 'escrow_release' | 'refund' | 'withdrawal' | 'admin_adjustment';
export const LEDGER_FA: Record<LedgerType, string> = {
  deposit: 'واریز', entry_fee: 'هزینه‌ی ورودی', escrow_lock: 'قفل در escrow', escrow_release: 'آزادسازیِ escrow', refund: 'بازپرداخت', withdrawal: 'برداشت', admin_adjustment: 'تعدیلِ مدیر',
};
export type PaymentStatus = 'initiated' | 'pending_gateway' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'chargeback' | 'manually_verified';
export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  initiated: { label: 'آغازشده', tone: 'muted' },
  pending_gateway: { label: 'در انتظارِ درگاه', tone: 'gold' },
  paid: { label: 'پرداخت‌شده', tone: 'good' },
  failed: { label: 'ناموفق', tone: 'bad' },
  cancelled: { label: 'لغوشده', tone: 'muted' },
  refunded: { label: 'بازپرداخت', tone: 'accent' },
  chargeback: { label: 'برگشتِ وجه', tone: 'bad' },
  manually_verified: { label: 'تأییدِ دستی', tone: 'good' },
};
export interface LedgerEntry {
  id: string;
  user: string;
  type: LedgerType;
  amount: number;
  status: PaymentStatus;
  ref: string;
  createdAt: string;
}
export interface Payout {
  id: string;
  tournament: string;
  recipient: string;
  amount: number;
  status: 'pending' | 'released' | 'held';
  createdAt: string;
}

// ───────── ممیزی ─────────
export interface AuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  createdAt: string;
}

// ───────── صفِ اقدامات / فعالیت / KPI / سلامت ─────────
export type QueueKind = 'approve_tournament' | 'review_dispute' | 'verify_result' | 'release_payout' | 'organizer_request' | 'respond_ticket' | 'kyc_review';
export const QUEUE_META: Record<QueueKind, { label: string; icon: string; href: string }> = {
  approve_tournament: { label: 'تأییدِ تورنومنت', icon: 'trophy', href: '/admin/tournaments' },
  review_dispute: { label: 'بررسیِ اختلاف', icon: 'flag', href: '/admin/reports' },
  verify_result: { label: 'تأییدِ نتیجه', icon: 'check', href: '/admin/tournaments' },
  release_payout: { label: 'آزادسازیِ جایزه', icon: 'wallet', href: '/admin/finance' },
  organizer_request: { label: 'درخواستِ برگزارکننده', icon: 'inbox', href: '/admin/organizer-requests' },
  respond_ticket: { label: 'پاسخِ تیکت', icon: 'ticket', href: '/support' },
  kyc_review: { label: 'بررسیِ احرازِ هویت', icon: 'idcard', href: '/admin/kyc' },
};
export interface QueueItem {
  id: string;
  kind: QueueKind;
  title: string;
  meta: string;
  urgent?: boolean;
}
export interface ActivityItem {
  id: string;
  text: string;
  at: string;
  tone: Tone;
}
export interface Kpi {
  key: string;
  label: string;
  value: number;
  hint?: string;
  tone?: Tone;
  money?: boolean;
}
export interface HealthItem {
  key: string;
  label: string;
  ok: boolean;
  note: string;
}

// ═════════ دادهٔ mock ═════════
const D = (offset: number) => new Date(Date.parse('2026-06-23T12:00:00.000Z') + offset * 86400000).toISOString();

export const ADMIN_TOURNAMENTS: AdminTournament[] = [
  { id: 't1', title: 'Valorant Champions Arena', game: 'Valorant', status: 'live', participants: 28, maxParticipants: 32, platform: 'PC', prize: 50000000, organizer: 'SHELTER', startAt: D(-1) },
  { id: 't2', title: 'CS2 Open Ladder', game: 'Counter-Strike 2', status: 'registration_open', participants: 24, maxParticipants: 32, platform: 'PC', prize: 30000000, organizer: 'SHELTER', startAt: D(1) },
  { id: 't3', title: 'Dota 2 Weekend Clash', game: 'Dota 2', status: 'pending_review', participants: 0, maxParticipants: 16, platform: 'PC', prize: 40000000, organizer: 'Nova Esports', startAt: D(4) },
  { id: 't4', title: 'FC 26 Pro Cup', game: 'EA Sports FC 26', status: 'draft', participants: 0, maxParticipants: 64, platform: 'PS5', prize: 15000000, organizer: 'GameHub', startAt: D(6) },
  { id: 't5', title: 'Fortnite Solo Cup', game: 'Fortnite', status: 'payout_pending', participants: 96, maxParticipants: 100, platform: 'Cross-play', prize: 40000000, organizer: 'SHELTER', startAt: D(-3) },
  { id: 't6', title: 'Tekken 8 Showdown', game: 'Tekken 8', status: 'completed', participants: 16, maxParticipants: 16, platform: 'PS5', prize: 12000000, organizer: 'SHELTER', startAt: D(-5) },
];

export const ORGANIZER_REQUESTS: OrganizerRequest[] = [
  { id: 'or1', org: 'Nova Esports', contact: 'nova@example.com', reason: 'برگزاریِ لیگِ هفتگیِ Valorant', experience: '۲ سال، ۴۰+ تورنومنت', status: 'submitted', createdAt: D(-1) },
  { id: 'or2', org: 'GameHub IR', contact: 'hub@example.com', reason: 'سریِ مسابقاتِ FC', experience: 'برگزارِ آفلاین', status: 'under_review', createdAt: D(-2) },
  { id: 'or3', org: 'Storm Clan', contact: 'storm@example.com', reason: 'کاپِ ماهانه‌ی CS2', experience: 'تازه‌کار', status: 'submitted', createdAt: D(-1) },
  { id: 'or4', org: 'Apex League', contact: 'apex@example.com', reason: 'لیگِ فصلی', experience: '۳ سال', status: 'approved', createdAt: D(-8) },
];

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u1', name: 'علی رضایی', email: 'ali@example.com', role: 'USER', status: 'active', balance: 1250000, kyc: 'verified', joined: 12, reports: 0, createdAt: D(-40) },
  { id: 'u2', name: 'Phantom X', email: 'phantom@example.com', role: 'USER', status: 'active', balance: 8400000, kyc: 'pending', joined: 31, reports: 1, createdAt: D(-120) },
  { id: 'u3', name: 'مهدی کریمی', email: 'mehdi@example.com', role: 'ORGANIZER', status: 'active', balance: 0, kyc: 'verified', joined: 3, reports: 0, createdAt: D(-9) },
  { id: 'u4', name: 'Smurf99', email: 'smurf@example.com', role: 'USER', status: 'suspended', balance: 0, kyc: 'rejected', joined: 5, reports: 4, createdAt: D(-15) },
  { id: 'u5', name: 'داور سیستم', email: 'ref@example.com', role: 'REFEREE', status: 'active', balance: 0, kyc: 'not_started', joined: 0, reports: 0, createdAt: D(-200) },
];

export const REPORTS: ReportItem[] = [
  { id: 'r1', reporter: 'Phantom X', reported: 'Smurf99', tournament: 'Valorant Champions Arena', category: 'cheating', status: 'new', createdAt: D(0) },
  { id: 'r2', reporter: 'Valor GG', reported: 'Apex Titans', tournament: 'CS2 Open Ladder', category: 'fake_result', status: 'under_review', createdAt: D(-1) },
  { id: 'r3', reporter: 'علی رضایی', reported: '—', tournament: 'Fortnite Solo Cup', category: 'payment_issue', status: 'needs_info', createdAt: D(-2) },
  { id: 'r4', reporter: 'Nebula', reported: 'Cobalt', tournament: 'Dota 2 Weekend Clash', category: 'no_show', status: 'action_taken', createdAt: D(-3) },
];

export const LEDGER: LedgerEntry[] = [
  { id: 'l1', user: 'علی رضایی', type: 'deposit', amount: 2000000, status: 'paid', ref: 'TXN-90211', createdAt: D(0) },
  { id: 'l2', user: 'Phantom X', type: 'entry_fee', amount: -500000, status: 'paid', ref: 'ENT-1182', createdAt: D(0) },
  { id: 'l3', user: 'SHELTER', type: 'escrow_lock', amount: -50000000, status: 'paid', ref: 'ESC-t1', createdAt: D(-1) },
  { id: 'l4', user: 'Phantom X', type: 'escrow_release', amount: 12000000, status: 'manually_verified', ref: 'ESC-t6', createdAt: D(-5) },
  { id: 'l5', user: 'مهدی کریمی', type: 'withdrawal', amount: -3000000, status: 'pending_gateway', ref: 'WD-441', createdAt: D(-1) },
  { id: 'l6', user: 'Smurf99', type: 'refund', amount: 500000, status: 'refunded', ref: 'RF-77', createdAt: D(-2) },
];

export const PAYOUTS: Payout[] = [
  { id: 'p1', tournament: 'Fortnite Solo Cup', recipient: 'rank #1', amount: 25000000, status: 'pending', createdAt: D(-3) },
  { id: 'p2', tournament: 'Fortnite Solo Cup', recipient: 'rank #2', amount: 10000000, status: 'pending', createdAt: D(-3) },
  { id: 'p3', tournament: 'Tekken 8 Showdown', recipient: 'rank #1', amount: 12000000, status: 'released', createdAt: D(-5) },
];

export const KYC_QUEUE: { id: string; user: string; submitted: string; status: KycStatus }[] = [
  { id: 'k1', user: 'Phantom X', submitted: D(-1), status: 'pending' },
  { id: 'k2', user: 'مهدی کریمی', submitted: D(-3), status: 'verified' },
  { id: 'k3', user: 'Smurf99', submitted: D(-4), status: 'rejected' },
];

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'a1', actor: 'مدیر سیستم', actorRole: 'ADMIN', action: 'تأییدِ نتیجه', entityType: 'match', entityId: 'W-R2-M0', reason: 'بازبینیِ اسکرین‌شات', createdAt: D(0) },
  { id: 'a2', actor: 'مدیر کل', actorRole: 'MAIN_ADMIN', action: 'انتشارِ تورنومنت', entityType: 'tournament', entityId: 't2', createdAt: D(0) },
  { id: 'a3', actor: 'مدیر سیستم', actorRole: 'ADMIN', action: 'تعلیقِ کاربر', entityType: 'user', entityId: 'u4', reason: 'تقلبِ تأییدشده', createdAt: D(-1) },
  { id: 'a4', actor: 'finance', actorRole: 'ADMIN', action: 'آزادسازیِ جایزه', entityType: 'payout', entityId: 'p3', createdAt: D(-5) },
  { id: 'a5', actor: 'مدیر کل', actorRole: 'MAIN_ADMIN', action: 'تأییدِ برگزارکننده', entityType: 'organizer_request', entityId: 'or4', createdAt: D(-8) },
];

export const ADMIN_QUEUE: QueueItem[] = [
  { id: 'q1', kind: 'approve_tournament', title: 'Dota 2 Weekend Clash', meta: 'Nova Esports · در انتظارِ بررسی', urgent: true },
  { id: 'q2', kind: 'review_dispute', title: 'تقلب در Valorant Champions Arena', meta: 'Phantom X علیه Smurf99', urgent: true },
  { id: 'q3', kind: 'release_payout', title: 'جایزه‌ی Fortnite Solo Cup', meta: '۲ دریافت‌کننده · ۳۵٬۰۰۰٬۰۰۰ ت' },
  { id: 'q4', kind: 'organizer_request', title: 'Storm Clan', meta: 'درخواستِ پنلِ برگزارکننده' },
  { id: 'q5', kind: 'kyc_review', title: 'احرازِ هویتِ Phantom X', meta: 'مدارک ارسال شد' },
  { id: 'q6', kind: 'verify_result', title: 'نتیجه‌ی نیمه‌نهاییِ CS2', meta: 'در انتظارِ تأییدِ داور' },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'ac1', text: 'کاربرِ جدید «علی رضایی» ثبت‌نام کرد', at: D(0), tone: 'muted' },
  { id: 'ac2', text: 'نتیجه‌ی مسابقه‌ی Valorant ثبت شد', at: D(0), tone: 'accent' },
  { id: 'ac3', text: 'مدیر نتیجه‌ی Map 2 را تأیید کرد', at: D(0), tone: 'good' },
  { id: 'ac4', text: 'جایزه‌ی Tekken 8 آزاد شد', at: D(-5), tone: 'gold' },
  { id: 'ac5', text: 'تورنومنتِ CS2 منتشر شد', at: D(0), tone: 'accent' },
  { id: 'ac6', text: 'گزارشِ تخلفِ جدید باز شد', at: D(0), tone: 'bad' },
];

export const SYSTEM_HEALTH: HealthItem[] = [
  { key: 'gateway', label: 'درگاهِ پرداخت', ok: true, note: 'Sandbox فعال' },
  { key: 'notify', label: 'اعلان‌ها', ok: true, note: 'صف سالم' },
  { key: 'storage', label: 'ذخیره‌سازیِ تصاویر', ok: true, note: 'لوکال' },
  { key: 'live', label: 'به‌روزرسانیِ زنده', ok: true, note: 'polling' },
  { key: 'jobs', label: 'کارهای پس‌زمینه', ok: false, note: '۱ کار معطل' },
];

export const ADMIN_KPIS: Kpi[] = [
  { key: 'active', label: 'تورنومنتِ فعال', value: 4, tone: 'accent' },
  { key: 'reg', label: 'ثبت‌نامِ باز', value: 2, tone: 'accent' },
  { key: 'live', label: 'مسابقه‌ی زنده', value: 3, tone: 'bad' },
  { key: 'disputes', label: 'اختلافِ باز', value: 2, tone: 'gold' },
  { key: 'payouts', label: 'پرداختِ معلق', value: 2, tone: 'gold' },
  { key: 'users', label: 'کاربرِ امروز', value: 18 },
  { key: 'orgreq', label: 'درخواستِ برگزارکننده', value: 2, tone: 'gold' },
  { key: 'escrow', label: 'موجودیِ escrow', value: 92000000, money: true, tone: 'gold' },
];

// today operations (computed from tournaments)
export function todayOps() {
  return {
    startingToday: ADMIN_TOURNAMENTS.filter((t) => t.startAt.slice(0, 10) === '2026-06-23'),
    live: ADMIN_TOURNAMENTS.filter((t) => t.status === 'live'),
    pendingApproval: ADMIN_TOURNAMENTS.filter((t) => t.status === 'pending_review' || t.status === 'draft'),
    payoutPending: ADMIN_TOURNAMENTS.filter((t) => t.status === 'payout_pending'),
  };
}
