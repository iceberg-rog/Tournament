// ماشینِ حالتِ اکشن‌های تورنومنت + مجوزها (lifecycle واقعی برای پنلِ مدیریت).
import type { TournamentStatus, AdminTournament } from '@/lib/admin';

export type TournamentAction =
  | 'edit'
  | 'submit_for_review'
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'resubmit'
  | 'schedule'
  | 'open_registration'
  | 'close_registration'
  | 'open_check_in'
  | 'close_check_in'
  | 'manual_check_in'
  | 'generate_bracket'
  | 'open_control_room'
  | 'pause'
  | 'resume'
  | 'send_announcement'
  | 'review_results'
  | 'review_disputes'
  | 'review_standings'
  | 'prepare_payout'
  | 'release_prizes'
  | 'refund'
  | 'archive'
  | 'cancel'
  | 'preview'
  | 'view_participants'
  | 'view_finance'
  | 'view';

export type AdminRole = 'super_admin' | 'tournament_admin' | 'finance_admin' | 'moderator' | 'support_admin';

export const ADMIN_ROLE_FA: Record<AdminRole, string> = {
  super_admin: 'مدیرِ کل',
  tournament_admin: 'مدیرِ تورنومنت',
  finance_admin: 'مدیرِ مالی',
  moderator: 'ناظر',
  support_admin: 'پشتیبان',
};

/** نقشِ خامِ API → نقشِ عملیاتیِ پنل. */
export function toAdminRole(apiRole?: string): AdminRole {
  switch (apiRole) {
    case 'MAIN_ADMIN':
    case 'ADMIN':
      return 'super_admin';
    case 'GAME_ADMIN':
      return 'tournament_admin';
    case 'REFEREE':
      return 'moderator';
    case 'SUPPORT':
      return 'support_admin';
    default:
      return 'tournament_admin';
  }
}

export const ACTION_LABEL: Record<TournamentAction, string> = {
  edit: 'ویرایش',
  submit_for_review: 'ارسال برای بررسی',
  approve: 'تأیید',
  reject: 'رد',
  request_changes: 'درخواستِ اصلاح',
  resubmit: 'ارسالِ مجدد',
  schedule: 'زمان‌بندی',
  open_registration: 'بازکردنِ ثبت‌نام',
  close_registration: 'بستنِ ثبت‌نام',
  open_check_in: 'بازکردنِ چک‌این',
  close_check_in: 'بستنِ چک‌این',
  manual_check_in: 'چک‌اینِ دستی',
  generate_bracket: 'ساختِ براکت',
  open_control_room: 'اتاقِ کنترل',
  pause: 'توقف',
  resume: 'ادامه',
  send_announcement: 'اعلان',
  review_results: 'بررسیِ نتایج',
  review_disputes: 'بررسیِ اختلاف‌ها',
  review_standings: 'مرورِ رده‌بندی',
  prepare_payout: 'آماده‌سازیِ پرداخت',
  release_prizes: 'آزادسازیِ جایزه',
  refund: 'بازپرداخت',
  archive: 'بایگانی',
  cancel: 'لغو',
  preview: 'پیش‌نمایش',
  view_participants: 'شرکت‌کننده‌ها',
  view_finance: 'مالی',
  view: 'مشاهده',
};

export const ACTIONS_BY_STATUS: Record<TournamentStatus, TournamentAction[]> = {
  draft: ['edit', 'submit_for_review', 'cancel'],
  pending_review: ['approve', 'reject', 'request_changes', 'preview'],
  rejected: ['edit', 'resubmit'],
  approved: ['schedule', 'open_registration', 'preview'],
  scheduled: ['open_registration', 'edit', 'cancel'],
  registration_open: ['close_registration', 'send_announcement', 'view_participants', 'preview'],
  registration_closed: ['open_check_in', 'generate_bracket', 'view_participants'],
  check_in_open: ['close_check_in', 'generate_bracket', 'manual_check_in', 'view_participants'],
  live: ['open_control_room', 'pause', 'send_announcement', 'review_results', 'review_disputes'],
  paused: ['resume', 'send_announcement', 'cancel'],
  dispute_review: ['review_disputes', 'open_control_room', 'resume'],
  completed: ['review_standings', 'prepare_payout', 'archive'],
  payout_pending: ['release_prizes', 'refund', 'view_finance'],
  paid: ['archive', 'view_finance'],
  archived: ['view'],
  cancelled: ['refund', 'archive'],
};

// اکشن → وضعیتِ بعدی (فقط اکشن‌هایی که status را عوض می‌کنند).
export const NEXT_STATUS: Partial<Record<TournamentAction, TournamentStatus>> = {
  submit_for_review: 'pending_review',
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'pending_review',
  resubmit: 'pending_review',
  schedule: 'scheduled',
  open_registration: 'registration_open',
  close_registration: 'registration_closed',
  open_check_in: 'check_in_open',
  close_check_in: 'registration_closed',
  generate_bracket: 'live',
  pause: 'paused',
  resume: 'live',
  prepare_payout: 'payout_pending',
  release_prizes: 'paid',
  archive: 'archived',
  cancel: 'cancelled',
};

// اکشن‌هایی که فقط route باز می‌کنند (تغییرِ state ندارند).
export const NAV_ACTIONS = new Set<TournamentAction>([
  'edit',
  'open_control_room',
  'preview',
  'view',
  'view_participants',
  'view_finance',
  'review_results',
  'review_disputes',
  'review_standings',
]);

export function navHref(action: TournamentAction, t: AdminTournament): string {
  switch (action) {
    case 'edit':
      return `/admin/tournaments/${t.id}/edit`;
    case 'open_control_room':
      return `/admin/tournaments/${t.id}/control-room`;
    case 'view_participants':
      return `/admin/tournaments/${t.id}/participants`;
    case 'view_finance':
      return `/admin/tournaments/${t.id}/finance`;
    case 'review_results':
      return `/admin/tournaments/${t.id}/matches`;
    case 'review_disputes':
      return `/admin/tournaments/${t.id}/disputes`;
    case 'review_standings':
    case 'view':
      return `/admin/tournaments/${t.id}`;
    case 'preview':
      return `/tournaments/${t.id}`;
    default:
      return `/admin/tournaments/${t.id}`;
  }
}

// اکشن‌هایی که reason اجباری می‌خواهند.
export const REASON_REQUIRED = new Set<TournamentAction>(['reject', 'request_changes', 'pause', 'refund', 'cancel']);
// اکشن‌های پرخطر (تأییدِ قرمز).
export const DANGER_ACTIONS = new Set<TournamentAction>(['reject', 'release_prizes', 'refund', 'cancel', 'pause']);

// ───────── مجوزها ─────────
export type Permission =
  | 'tournament:create'
  | 'tournament:update'
  | 'tournament:approve'
  | 'tournament:publish'
  | 'tournament:pause'
  | 'tournament:control_room'
  | 'result:approve'
  | 'dispute:resolve'
  | 'finance:payout'
  | 'finance:refund'
  | 'audit:view';

export const PERMISSION_BY_ACTION: Partial<Record<TournamentAction, Permission>> = {
  edit: 'tournament:update',
  submit_for_review: 'tournament:update',
  approve: 'tournament:approve',
  reject: 'tournament:approve',
  request_changes: 'tournament:approve',
  resubmit: 'tournament:update',
  schedule: 'tournament:update',
  open_registration: 'tournament:publish',
  close_registration: 'tournament:update',
  open_check_in: 'tournament:update',
  close_check_in: 'tournament:update',
  manual_check_in: 'tournament:update',
  generate_bracket: 'tournament:update',
  open_control_room: 'tournament:control_room',
  pause: 'tournament:pause',
  resume: 'tournament:pause',
  send_announcement: 'tournament:update',
  review_results: 'result:approve',
  review_disputes: 'dispute:resolve',
  prepare_payout: 'finance:payout',
  release_prizes: 'finance:payout',
  refund: 'finance:refund',
};

const ROLE_PERMS: Record<AdminRole, Permission[] | '*'> = {
  super_admin: '*',
  tournament_admin: [
    'tournament:create',
    'tournament:update',
    'tournament:approve',
    'tournament:publish',
    'tournament:pause',
    'tournament:control_room',
    'result:approve',
    'dispute:resolve',
    'audit:view',
  ],
  finance_admin: ['finance:payout', 'finance:refund', 'audit:view'],
  moderator: ['tournament:control_room', 'result:approve', 'dispute:resolve', 'audit:view'],
  support_admin: ['audit:view'],
};

export function hasPermission(role: AdminRole, perm: Permission): boolean {
  const p = ROLE_PERMS[role];
  return p === '*' || p.includes(perm);
}

/** آیا این نقش اجازه‌ی این اکشن را دارد؟ (اکشن‌های بدونِ مجوز همیشه مجازند) */
export function can(role: AdminRole, action: TournamentAction): boolean {
  const perm = PERMISSION_BY_ACTION[action];
  if (!perm) return true; // view/preview و … بدونِ مجوزِ خاص
  return hasPermission(role, perm);
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

/** اعتبارسنجیِ پیش از اجرای اکشن. */
export function validateAction(action: TournamentAction, t: AdminTournament): ValidationResult {
  if (action === 'generate_bracket' && t.participants < t.minParticipants)
    return { ok: false, message: `برای ساختِ براکت حداقل ${t.minParticipants} شرکت‌کننده لازم است (فعلاً ${t.participants}).` };
  if (action === 'open_registration' && (!t.startAt || t.maxParticipants <= 0))
    return { ok: false, message: 'پیش از بازکردنِ ثبت‌نام، تاریخِ شروع و ظرفیت باید مشخص باشد.' };
  if (action === 'prepare_payout' && t.disputes > 0)
    return { ok: false, message: 'تا زمانِ بازبودنِ اختلاف‌ها نمی‌توان پرداخت را آماده کرد.' };
  if (action === 'release_prizes') {
    if (t.disputes > 0) return { ok: false, message: 'اختلافِ باز وجود دارد؛ آزادسازیِ جایزه ممکن نیست.' };
    if (t.status !== 'payout_pending') return { ok: false, message: 'جایزه فقط در وضعیتِ «در انتظارِ پرداخت» آزاد می‌شود.' };
  }
  return { ok: true };
}
