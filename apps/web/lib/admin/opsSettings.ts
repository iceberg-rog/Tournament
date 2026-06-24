// تنظیماتِ عملیاتیِ تورنومنت — همه‌ی سیاست‌ها در یک منبعِ persisted (useOpsSlice).
// no-show و progression روی رفتارِ واقعیِ اتاقِ کنترل اثر می‌گذارند؛ بقیه persist و
// adapter-ready هستند (در docs مشخص شده کدام behavior-wired است).

import { DEFAULT_PROGRESSION, noShowPolicyFor, type NoShowPolicy, type ProgressionSettings } from '@/lib/admin/controlRoom';
import type { ChatPolicy } from '@/lib/admin/tournamentOps';

export interface CheckInSettings {
  requireCheckIn: boolean;
  checkInWindowMinutes: number;
}
export interface ResultSettings {
  resultSubmissionDeadlineMinutes: number;
  opponentConfirmationRequired: boolean;
  evidenceRequired: boolean;
  autoApproveIfBothAgree: boolean;
  adminReviewOnConflict: boolean;
}
export interface DisputeSettings {
  disputeWindowMinutes: number;
  lockNextRoundOnDispute: boolean;
  lockPayoutOnDispute: boolean;
}
export interface NotificationSettings {
  reminderSchedule: string[];
  channels: { in_app: boolean; chat: boolean; email: boolean; sms: boolean; push: boolean };
}
export interface ChatSettings {
  policy: ChatPolicy;
  slowMode: boolean;
  locked: boolean;
}
export interface StreamingSettings {
  streamEnabled: boolean;
  publicLivePage: boolean;
  recordVod: boolean;
  chatOverlay: boolean;
}
export interface PayoutSettings {
  kycRequiredForPayout: boolean;
  lockPayoutUntilNoDisputes: boolean;
  lockPayoutUntilAllResultsApproved: boolean;
}

export interface OperationalSettings {
  checkIn: CheckInSettings;
  noShow: NoShowPolicy;
  result: ResultSettings;
  dispute: DisputeSettings;
  notifications: NotificationSettings;
  chat: ChatSettings;
  streaming: StreamingSettings;
  payout: PayoutSettings;
  progression: ProgressionSettings;
}

export function defaultOperationalSettings(tournamentId: string): OperationalSettings {
  return {
    checkIn: { requireCheckIn: true, checkInWindowMinutes: 30 },
    noShow: noShowPolicyFor(tournamentId),
    result: { resultSubmissionDeadlineMinutes: 20, opponentConfirmationRequired: true, evidenceRequired: true, autoApproveIfBothAgree: true, adminReviewOnConflict: true },
    dispute: { disputeWindowMinutes: 30, lockNextRoundOnDispute: true, lockPayoutOnDispute: true },
    notifications: { reminderSchedule: ['۲۴ ساعت قبل', '۶ ساعت قبل', '۱ ساعت قبل', '۳۰ دقیقه قبل', '۱۰ دقیقه قبل', 'شروعِ مسابقه', '۵ دقیقه قبل از مهلتِ نتیجه', 'پس از مهلت'], channels: { in_app: true, chat: true, email: true, sms: false, push: false } },
    chat: { policy: 'everyone_can_chat', slowMode: false, locked: false },
    streaming: { streamEnabled: true, publicLivePage: true, recordVod: true, chatOverlay: true },
    payout: { kycRequiredForPayout: true, lockPayoutUntilNoDisputes: true, lockPayoutUntilAllResultsApproved: true },
    progression: DEFAULT_PROGRESSION,
  };
}

/** ادغامِ امنِ تنظیماتِ ذخیره‌شده با پیش‌فرض (برای فیلدهای جدید). */
export function mergeSettings(stored: Partial<OperationalSettings> | null | undefined, tournamentId: string): OperationalSettings {
  const d = defaultOperationalSettings(tournamentId);
  if (!stored) return d;
  return {
    checkIn: { ...d.checkIn, ...stored.checkIn },
    noShow: { ...d.noShow, ...stored.noShow },
    result: { ...d.result, ...stored.result },
    dispute: { ...d.dispute, ...stored.dispute },
    notifications: { ...d.notifications, ...stored.notifications, channels: { ...d.notifications.channels, ...stored.notifications?.channels } },
    chat: { ...d.chat, ...stored.chat },
    streaming: { ...d.streaming, ...stored.streaming },
    payout: { ...d.payout, ...stored.payout },
    progression: { ...d.progression, ...stored.progression },
  };
}
