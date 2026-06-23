'use client';

// Store مرکزیِ پنلِ مدیریت — یک منبعِ حقیقتِ واحد برای جدول، drawer، اتاقِ کنترل،
// گزارشِ ممیزی و toastها. چون بک‌اندِ واقعی نداریم، همه‌چیز mock + local state است،
// ولی اکشن‌ها واقعاً state را تغییر می‌دهند و در همه‌ی کامپوننت‌ها منعکس می‌شوند.

import { useEffect, useSyncExternalStore } from 'react';
import {
  ADMIN_TOURNAMENTS,
  AUDIT_LOG,
  LEDGER,
  money,
  type AdminTournament,
  type AuditEntry,
  type LedgerEntry,
} from '@/lib/admin';
import { apiGet, isLoggedIn } from '@/lib/api';
import {
  ACTION_LABEL,
  NAV_ACTIONS,
  NEXT_STATUS,
  can,
  toAdminRole,
  validateAction,
  type AdminRole,
  type TournamentAction,
} from '@/lib/admin/ops';

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info';
  msg: string;
  action?: { label: string; href: string };
}
export interface Announcement {
  id: string;
  tournamentId: string;
  title: string;
  body: string;
  target: string;
  createdAt: string;
}

interface AdminState {
  tournaments: AdminTournament[];
  audit: AuditEntry[];
  ledger: LedgerEntry[];
  announcements: Announcement[];
  toasts: Toast[];
  apiRole: AdminRole;
  override: AdminRole | null;
  initialized: boolean;
}

let state: AdminState = {
  tournaments: ADMIN_TOURNAMENTS.map((t) => ({ ...t })),
  audit: [...AUDIT_LOG],
  ledger: [...LEDGER],
  announcements: [],
  toasts: [],
  apiRole: 'tournament_admin',
  override: null,
  initialized: false,
};

const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function snapshot() {
  return state;
}

let seq = 5000;
const uid = (p: string) => `${p}-${++seq}-${Date.now().toString(36)}`;
const nowIso = () => new Date().toISOString();

// ───────── hooks ─────────
export function useAdminState(): AdminState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
export function useTournaments(): AdminTournament[] {
  return useAdminState().tournaments;
}
export function useTournament(id: string): AdminTournament | undefined {
  return useAdminState().tournaments.find((t) => t.id === id);
}
export function useAuditLog(): AuditEntry[] {
  return useAdminState().audit;
}
export function useToasts(): Toast[] {
  return useAdminState().toasts;
}
export function useAdminRole(): AdminRole {
  const s = useAdminState();
  return s.override ?? s.apiRole;
}
export function effectiveRole(): AdminRole {
  return state.override ?? state.apiRole;
}

/** نقشِ واقعی را یک‌بار از API می‌گیرد. */
export function useEnsureAdminRole() {
  useEffect(() => {
    if (state.initialized) return;
    state.initialized = true;
    if (!isLoggedIn()) return;
    apiGet<{ role: string }>('/users/me')
      .then((m) => {
        state.apiRole = toAdminRole(m.role);
        emit();
      })
      .catch(() => {});
  }, []);
}

export function setRoleOverride(role: AdminRole | null) {
  state.override = role;
  emit();
}

// ───────── toasts ─────────
export function pushToast(t: Omit<Toast, 'id'>) {
  const id = uid('toast');
  state.toasts = [...state.toasts, { ...t, id }];
  emit();
  setTimeout(() => dismissToast(id), 6000);
}
export function dismissToast(id: string) {
  state.toasts = state.toasts.filter((x) => x.id !== id);
  emit();
}

// ───────── mutators ─────────
function patchTournament(id: string, patch: Partial<AdminTournament>) {
  state.tournaments = state.tournaments.map((t) => (t.id === id ? { ...t, ...patch } : t));
}
function removeTournament(id: string) {
  state.tournaments = state.tournaments.filter((t) => t.id !== id);
}
export function appendAudit(e: Omit<AuditEntry, 'id' | 'createdAt'>) {
  state.audit = [{ ...e, id: uid('audit'), createdAt: nowIso() }, ...state.audit];
}
export function addAnnouncement(a: Omit<Announcement, 'id' | 'createdAt'>) {
  state.announcements = [{ ...a, id: uid('ann'), createdAt: nowIso() }, ...state.announcements];
}
function addLedger(e: Omit<LedgerEntry, 'id' | 'createdAt'>) {
  state.ledger = [{ ...e, id: uid('led'), createdAt: nowIso() }, ...state.ledger];
}

export interface RunOpts {
  role: AdminRole;
  actorName: string;
  reason?: string;
  announcement?: { title: string; body: string; target: string };
}

const SUCCESS: Partial<Record<TournamentAction, string>> = {
  submit_for_review: 'تورنومنت برای بررسی ارسال شد',
  approve: 'تورنومنت تأیید شد',
  reject: 'تورنومنت رد شد',
  request_changes: 'درخواستِ اصلاح برای برگزارکننده ارسال شد',
  resubmit: 'تورنومنت دوباره ارسال شد',
  schedule: 'تورنومنت زمان‌بندی شد',
  open_registration: 'ثبت‌نام باز شد',
  close_registration: 'ثبت‌نام بسته شد',
  open_check_in: 'چک‌این باز شد',
  close_check_in: 'چک‌این بسته شد',
  manual_check_in: 'چک‌اینِ دستی ثبت شد',
  generate_bracket: 'براکت ساخته شد',
  pause: 'تورنومنت متوقف شد',
  resume: 'تورنومنت از سر گرفته شد',
  send_announcement: 'اعلان ارسال شد',
  prepare_payout: 'تورنومنت آماده‌ی پرداخت شد',
  release_prizes: 'جوایز آزاد شد',
  refund: 'بازپرداخت انجام شد',
  archive: 'تورنومنت بایگانی شد',
  cancel: 'تورنومنت لغو شد',
  delete: 'تورنومنت به بایگانی منتقل شد',
  delete_permanent: 'تورنومنت برای همیشه حذف شد',
};

function toastFollowUp(action: TournamentAction, t: AdminTournament): Toast['action'] | undefined {
  if (action === 'generate_bracket') return { label: 'رفتن به اتاقِ کنترل', href: `/admin/tournaments/${t.id}/control-room` };
  if (action === 'prepare_payout') return { label: 'رفتن به مالی', href: `/admin/tournaments/${t.id}/finance` };
  if (action === 'approve') return { label: 'مشاهده', href: `/admin/tournaments/${t.id}` };
  return undefined;
}

/**
 * اجرای یک اکشن: مجوز → اعتبارسنجی → تغییرِ status → اثرهای جانبی (escrow/ledger/announcement)
 * → ثبتِ ممیزی → toast. خروجی نتیجه برای نمایشِ خطا در dialog.
 */
export function runAction(action: TournamentAction, t: AdminTournament, opts: RunOpts): { ok: boolean; message?: string } {
  if (!can(opts.role, action)) {
    pushToast({ kind: 'error', msg: 'دسترسی لازم را ندارید' });
    return { ok: false, message: 'دسترسی لازم را ندارید' };
  }
  if (NAV_ACTIONS.has(action)) return { ok: true }; // route توسطِ caller باز می‌شود

  const v = validateAction(action, t);
  if (!v.ok) {
    pushToast({ kind: 'error', msg: v.message ?? 'اجرای اکشن ممکن نیست' });
    return v;
  }

  // حذفِ دائمی — فقط از بایگانی، ردیف کاملاً پاک می‌شود.
  if (action === 'delete_permanent') {
    removeTournament(t.id);
    appendAudit({ actor: opts.actorName, actorRole: opts.role, action: ACTION_LABEL[action], entityType: 'tournament', entityId: t.id, reason: opts.reason });
    pushToast({ kind: 'success', msg: SUCCESS.delete_permanent ?? 'حذف شد' });
    emit();
    return { ok: true };
  }

  const patch: Partial<AdminTournament> = {};
  const next = NEXT_STATUS[action];
  if (next) patch.status = next;

  if (action === 'generate_bracket') patch.currentRound = 1;
  if (action === 'release_prizes') {
    patch.escrow = 'released';
    patch.pendingPayouts = 0;
    addLedger({ user: `${t.title} · جوایز`, type: 'escrow_release', amount: t.prize, status: 'manually_verified', ref: `ESC-${t.id}` });
  }
  if (action === 'refund') {
    patch.escrow = 'refunded';
    addLedger({ user: `${t.title} · بازپرداخت`, type: 'refund', amount: t.prize, status: 'refunded', ref: `RF-${t.id}` });
  }
  if (action === 'send_announcement' && opts.announcement) {
    addAnnouncement({ tournamentId: t.id, title: opts.announcement.title, body: opts.announcement.body, target: opts.announcement.target });
  }

  if (Object.keys(patch).length) patchTournament(t.id, patch);

  appendAudit({
    actor: opts.actorName,
    actorRole: opts.role,
    action: ACTION_LABEL[action],
    entityType: 'tournament',
    entityId: t.id,
    reason: opts.reason,
  });

  let msg = SUCCESS[action] ?? 'اکشن انجام شد';
  if (action === 'release_prizes') msg = `${msg} (${money(t.prize)})`;
  pushToast({ kind: 'success', msg, action: toastFollowUp(action, t) });
  emit();
  return { ok: true };
}
