'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  ADMIN_USERS,
  KYC_META,
  fmt,
  money,
  type AdminUser,
  type UserStatus,
  type Tone,
} from '@/lib/admin';

// ───────── متاهای محلیِ وضعیتِ کاربر ─────────
const USER_STATUS_META: Record<UserStatus, { label: string; tone: Tone }> = {
  active: { label: 'فعال', tone: 'good' },
  suspended: { label: 'معلق', tone: 'gold' },
  banned: { label: 'مسدود', tone: 'bad' },
};

// همه‌ی نقش‌های موجود برای فیلتر
const ROLES = Array.from(new Set(ADMIN_USERS.map((u) => u.role)));
const ROLE_FA: Record<string, string> = {
  USER: 'کاربر',
  ORGANIZER: 'برگزارکننده',
  REFEREE: 'داور',
  ADMIN: 'مدیر',
  MAIN_ADMIN: 'مدیرِ کل',
};
const roleFa = (r: string) => ROLE_FA[r] ?? r;

// ───────── آیکن‌های خطی ─────────
const PATHS: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  role: <><path d="M12 2 4 6v6a8 8 0 0 0 16 0V6z" /><path d="m9 12 2 2 4-4" /></>,
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  shield: <><path d="M12 2 4 6v6a8 8 0 0 0 16 0V6z" /></>,
  restore: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
};
const Ico = ({ name, size = 14 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
);

// نوعِ overrideها (تغییراتِ محلیِ mock)
type Patch = Partial<Pick<AdminUser, 'status' | 'role' | 'balance'>>;

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [patches, setPatches] = useState<Record<string, Patch>>({});
  const [note, setNote] = useState<string>('');

  // اعمالِ patchهای محلی روی دادهٔ پایه
  const users = useMemo(
    () => ADMIN_USERS.map((u) => ({ ...u, ...(patches[u.id] ?? {}) })),
    [patches],
  );

  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote((n) => (n === msg ? '' : n)), 4000);
  };
  const apply = (id: string, patch: Patch) =>
    setPatches((p) => ({ ...p, [id]: { ...(p[id] ?? {}), ...patch } }));

  // ───────── اقدام‌های ردیف (mock) ─────────
  const onSuspend = (u: AdminUser) => {
    if (u.status === 'suspended') {
      if (!window.confirm(`تعلیقِ «${u.name}» برداشته شود؟`)) return;
      apply(u.id, { status: 'active' });
      flash(`تعلیقِ «${u.name}» برداشته شد.`);
      return;
    }
    if (!window.confirm(`کاربر «${u.name}» تعلیق شود؟ دسترسیِ او موقتاً محدود می‌شود.`)) return;
    apply(u.id, { status: 'suspended' });
    flash(`«${u.name}» تعلیق شد.`);
  };
  const onBan = (u: AdminUser) => {
    if (u.status === 'banned') {
      if (!window.confirm(`رفعِ مسدودیِ «${u.name}»؟`)) return;
      apply(u.id, { status: 'active' });
      flash(`مسدودیِ «${u.name}» برداشته شد.`);
      return;
    }
    if (!window.confirm(`کاربر «${u.name}» برای همیشه مسدود شود؟ این اقدام جدی است.`)) return;
    apply(u.id, { status: 'banned' });
    flash(`«${u.name}» مسدود شد.`);
  };
  const onRole = (u: AdminUser) => {
    const next = window.prompt(
      `نقشِ جدید برای «${u.name}» (USER / ORGANIZER / REFEREE / ADMIN):`,
      u.role,
    );
    if (!next) return;
    const r = next.trim().toUpperCase();
    if (r === u.role) return;
    apply(u.id, { role: r });
    flash(`نقشِ «${u.name}» به ${roleFa(r)} تغییر کرد.`);
  };
  const onAdjust = (u: AdminUser) => {
    const raw = window.prompt(
      `تعدیلِ کیف‌پولِ «${u.name}» — مبلغ (مثبت=افزایش، منفی=کاهش) به تومان:`,
      '0',
    );
    if (raw === null) return;
    const amount = Number(raw.replace(/[^\d-]/g, ''));
    if (!amount || Number.isNaN(amount)) {
      flash('مبلغِ نامعتبر — تعدیلی انجام نشد.');
      return;
    }
    const reason = window.prompt('دلیلِ تعدیل (برای ثبت در ممیزی):', '');
    if (reason === null) return;
    const nextBalance = Math.max(0, u.balance + amount);
    apply(u.id, { balance: nextBalance });
    flash(`کیف‌پولِ «${u.name}» ${money(Math.abs(amount))} ${amount > 0 ? 'افزایش' : 'کاهش'} یافت${reason ? ` — ${reason}` : ''}.`);
  };
  const onReset2fa = (u: AdminUser) => {
    if (!window.confirm(`احرازِ دومرحله‌ایِ «${u.name}» بازنشانی شود؟ کاربر باید دوباره آن را تنظیم کند.`)) return;
    flash(`۲FAِ «${u.name}» بازنشانی شد.`);
  };

  // ───────── فیلتر ─────────
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (status !== 'all' && u.status !== status) return false;
      if (term && !u.name.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [users, q, role, status]);

  const totalBalance = filtered.reduce((s, u) => s + u.balance, 0);
  const flaggedCount = filtered.filter((u) => u.reports > 0).length;

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="کاربران"
          subtitle="مدیریتِ حساب‌ها — وضعیت، نقش، احرازِ هویت و کیف‌پول."
          actions={
            note ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/15 px-3 py-1.5 text-xs font-bold text-good">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {note}
              </span>
            ) : (
              <span className="text-xs text-faint tnum">
                {fmt(filtered.length)} از {fmt(users.length)} کاربر
              </span>
            )
          }
        />

        {/* خلاصه */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'کاربر (فیلترشده)', value: fmt(filtered.length), tone: '' },
            { label: 'فعال', value: fmt(filtered.filter((u) => u.status === 'active').length), tone: 'text-good' },
            { label: 'گزارش‌دار', value: fmt(flaggedCount), tone: flaggedCount ? 'text-[#fca5a5]' : '' },
            { label: 'مجموعِ کیف‌پول', value: money(totalBalance), tone: 'text-gold' },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-tile p-4">
              <p className="text-[11px] text-faint">{c.label}</p>
              <p className={`mt-1 font-display text-xl font-bold tnum ${c.tone}`}>{c.value}</p>
            </div>
          ))}
        </section>

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
                <Ico name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو بر اساسِ نام یا ایمیل…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-9 pl-3 text-sm outline-none transition focus:border-accent/50"
              />
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-accent/50"
            >
              <option value="all">همه‌ی نقش‌ها</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleFa(r)}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-accent/50"
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              {(Object.keys(USER_STATUS_META) as UserStatus[]).map((s) => (
                <option key={s} value={s}>{USER_STATUS_META[s].label}</option>
              ))}
            </select>

            {(q || role !== 'all' || status !== 'all') && (
              <button
                onClick={() => { setQ(''); setRole('all'); setStatus('all'); }}
                className="btn-ghost px-3 py-2 text-xs"
              >
                پاک‌سازیِ فیلتر
              </button>
            )}
          </div>

          {/* جدول */}
          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-line bg-tile2 py-14 text-center">
              <p className="text-sm font-semibold text-muted">موردی با این فیلتر نیست</p>
              <p className="mt-1 text-xs text-faint">عبارتِ جست‌وجو یا فیلترها را تغییر بده.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-3 py-2.5 font-semibold">کاربر</th>
                    <th className="px-3 py-2.5 font-semibold">نقش</th>
                    <th className="px-3 py-2.5 font-semibold">وضعیت</th>
                    <th className="px-3 py-2.5 font-semibold">احرازِ هویت</th>
                    <th className="px-3 py-2.5 font-semibold">کیف‌پول</th>
                    <th className="px-3 py-2.5 font-semibold">عضویت (روز)</th>
                    <th className="px-3 py-2.5 font-semibold">گزارش</th>
                    <th className="px-3 py-2.5 font-semibold">اقدام‌ها</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const sm = USER_STATUS_META[u.status];
                    const km = KYC_META[u.kyc];
                    return (
                      <tr key={u.id} className="border-b border-line/70 transition hover:bg-white/[.03]">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-tile2 font-display text-sm font-bold text-accent">
                              {u.name.trim().charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{u.name}</p>
                              <p className="truncate text-xs text-faint" dir="ltr">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted">{roleFa(u.role)}</td>
                        <td className="px-3 py-3"><AdminBadge label={sm.label} tone={sm.tone} /></td>
                        <td className="px-3 py-3"><AdminBadge label={km.label} tone={km.tone} /></td>
                        <td className="px-3 py-3 tnum text-gold">{money(u.balance)}</td>
                        <td className="px-3 py-3 tnum text-muted">{fmt(u.joined)}</td>
                        <td className="px-3 py-3">
                          <span className={`tnum font-bold ${u.reports > 0 ? 'text-[#fca5a5]' : 'text-faint'}`}>{fmt(u.reports)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button onClick={() => onSuspend(u)} className="btn-ghost px-2.5 py-1.5 text-xs" title="تعلیق / رفعِ تعلیق">
                              <Ico name="pause" />تعلیق
                            </button>
                            <button onClick={() => onBan(u)} className="btn-ghost px-2.5 py-1.5 text-xs" title="مسدود / رفعِ مسدودی">
                              <Ico name="ban" />مسدود
                            </button>
                            <button onClick={() => onRole(u)} className="btn-ghost px-2.5 py-1.5 text-xs" title="تغییرِ نقش">
                              <Ico name="role" />نقش
                            </button>
                            <button onClick={() => onAdjust(u)} className="btn-ghost px-2.5 py-1.5 text-xs" title="تعدیلِ کیف‌پول">
                              <Ico name="wallet" />کیف‌پول
                            </button>
                            <button onClick={() => onReset2fa(u)} className="btn-ghost px-2.5 py-1.5 text-xs" title="بازنشانیِ احرازِ دومرحله‌ای">
                              <Ico name="shield" />۲FA
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
