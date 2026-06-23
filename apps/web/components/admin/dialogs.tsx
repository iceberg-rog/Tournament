'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { money, type AdminTournament } from '@/lib/admin';
import {
  ACTION_LABEL,
  DANGER_ACTIONS,
  REASON_REQUIRED,
  validateAction,
  type TournamentAction,
} from '@/lib/admin/ops';

function Modal({ title, onClose, children, danger }: { title: string; onClose: () => void; children: ReactNode; danger?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-tile p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,.85)] animate-[fade-up_.2s_ease]">
        <div className="mb-3 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${danger ? 'bg-bad' : 'bg-accent'}`} />
          <h3 className="font-display text-lg font-bold">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

const ACTION_DESC: Partial<Record<TournamentAction, string>> = {
  submit_for_review: 'تورنومنت برای بررسیِ تیمِ SHELTER ارسال می‌شود و دیگر قابلِ ویرایشِ آزاد نیست.',
  approve: 'تورنومنت تأیید می‌شود و آماده‌ی زمان‌بندی/بازکردنِ ثبت‌نام خواهد بود.',
  reject: 'تورنومنت رد می‌شود. دلیل برای برگزارکننده ارسال می‌شود.',
  request_changes: 'از برگزارکننده خواسته می‌شود تورنومنت را اصلاح کند.',
  resubmit: 'نسخه‌ی اصلاح‌شده دوباره برای بررسی ارسال می‌شود.',
  schedule: 'تورنومنت در تقویم زمان‌بندی می‌شود.',
  open_registration: 'ثبت‌نامِ عمومی باز می‌شود و کاربران می‌توانند شرکت کنند.',
  close_registration: 'ثبت‌نام بسته می‌شود؛ شرکت‌کننده‌ی جدیدی پذیرفته نمی‌شود.',
  open_check_in: 'پنجره‌ی چک‌این باز می‌شود تا شرکت‌کننده‌ها حضورشان را تأیید کنند.',
  close_check_in: 'چک‌این بسته می‌شود و فهرستِ نهاییِ شرکت‌کننده‌ها قطعی می‌گردد.',
  manual_check_in: 'حضورِ شرکت‌کننده به‌صورتِ دستی ثبت می‌شود.',
  generate_bracket: 'براکت بر اساسِ شرکت‌کننده‌های چک‌این‌شده ساخته و تورنومنت زنده می‌شود.',
  pause: 'تورنومنت موقتاً متوقف می‌شود. مسابقات نگه داشته می‌شوند.',
  resume: 'تورنومنت از حالتِ توقف خارج و دوباره زنده می‌شود.',
  prepare_payout: 'پس از بسته‌شدنِ اختلاف‌ها، تورنومنت وارد مرحله‌ی پرداخت می‌شود.',
  release_prizes: 'جوایز از escrow آزاد و به برندگان پرداخت می‌شود. این عمل برگشت‌ناپذیر است.',
  refund: 'ورودی‌ها به شرکت‌کننده‌ها بازگردانده می‌شود.',
  archive: 'تورنومنت بایگانی می‌شود و از فهرستِ فعال خارج می‌گردد.',
  cancel: 'تورنومنت لغو می‌شود. در صورتِ نیاز باید بازپرداخت انجام شود.',
};

export function ActionDialog({
  action,
  tournament,
  busy,
  onCancel,
  onConfirm,
}: {
  action: TournamentAction;
  tournament: AdminTournament;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (extra: { reason?: string }) => void;
}) {
  const [reason, setReason] = useState('');
  const danger = DANGER_ACTIONS.has(action);
  const needReason = REASON_REQUIRED.has(action);
  const valid = validateAction(action, tournament);
  const blocked = !valid.ok;
  const disabled = busy || blocked || (needReason && !reason.trim());

  return (
    <Modal title={ACTION_LABEL[action]} onClose={onCancel} danger={danger}>
      <p className="text-sm leading-7 text-muted">{ACTION_DESC[action] ?? 'این اکشن روی تورنومنت اعمال می‌شود.'}</p>
      <p className="mt-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-faint">
        تورنومنت: <span className="text-slate-200">{tournament.title}</span>
      </p>

      {action === 'release_prizes' && (
        <div className="mt-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
          مبلغِ جایزه: <span className="font-bold tnum">{money(tournament.prize)}</span> · از escrow آزاد می‌شود.
        </div>
      )}

      {blocked && <div className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-[#fca5a5]">{valid.message}</div>}

      {needReason && !blocked && (
        <label className="mt-3 block">
          <span className="mb-1 block text-xs text-faint">دلیل {needReason ? '(اجباری)' : ''}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="دلیلِ این اقدام را بنویسید…"
            className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
        </label>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">انصراف</button>
        <button
          onClick={() => onConfirm({ reason: reason.trim() || undefined })}
          disabled={disabled}
          className={`px-4 py-2 text-sm ${danger ? 'btn-danger' : 'btn-primary'} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? 'در حال انجام…' : `تأییدِ ${ACTION_LABEL[action]}`}
        </button>
      </div>
    </Modal>
  );
}

const TARGETS = [
  { v: 'all', label: 'همه‌ی شرکت‌کننده‌ها' },
  { v: 'checked_in', label: 'چک‌این‌شده‌ها' },
  { v: 'waitlist', label: 'لیستِ انتظار' },
  { v: 'admins', label: 'مدیران' },
];

export function AnnouncementDialog({
  tournament,
  busy,
  onCancel,
  onConfirm,
}: {
  tournament: AdminTournament;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (a: { title: string; body: string; target: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const disabled = busy || !title.trim() || !body.trim();
  return (
    <Modal title="ارسالِ اعلان" onClose={onCancel}>
      <p className="text-xs text-faint">تورنومنت: <span className="text-slate-200">{tournament.title}</span></p>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-faint">عنوان</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" placeholder="مثلاً شروعِ دورِ دوم" />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-faint">متن</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" placeholder="متنِ اعلان…" />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs text-faint">گیرنده</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim">
          {TARGETS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
        </select>
      </label>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">انصراف</button>
        <button onClick={() => onConfirm({ title: title.trim(), body: body.trim(), target })} disabled={disabled} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
          {busy ? 'در حال ارسال…' : 'ارسالِ اعلان'}
        </button>
      </div>
    </Modal>
  );
}
