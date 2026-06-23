'use client';

// ویرایشِ تورنومنت — این مسیر در نوارِ تب نیست ولی زیرِ layoutِ [id] است؛
// پس هدر/گارد تکرار نمی‌شود و فقط بدنه‌ی فرم رندر می‌شود.
// فرم mock است: ذخیره صرفاً ممیزی + toast می‌نویسد و dirty را پاک می‌کند
// (به store تورنومنت persist نمی‌شود — طبقِ قرارداد پذیرفته است).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { money, fmt, TOURNAMENT_STATUS_META, type AdminTournament } from '@/lib/admin';
import { can, type AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useTournament, appendAudit, pushToast } from '@/lib/admin/store';

const PLATFORMS = ['PC', 'PS5', 'Xbox', 'Mobile', 'Cross-play'] as const;

interface FormState {
  title: string;
  game: string;
  platform: string;
  maxParticipants: number;
  minParticipants: number;
  prize: number;
  startAt: string; // YYYY-MM-DD
  registrationEnd: string; // YYYY-MM-DD
}

// ISO → YYYY-MM-DD برای input[type=date]
const toDateInput = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : d.toISOString().slice(0, 10);
};

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted">
        {label}
        {hint && <span className="text-[11px] font-normal text-faint">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-bad">{error}</span>}
    </label>
  );
}

export default function EditTournamentPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');

  useEffect(() => {
    if (isLoggedIn())
      apiGet<{ displayName: string }>('/users/me')
        .then((m) => m.displayName && setActorName(m.displayName))
        .catch(() => {});
  }, []);

  // فرمِ اولیه از تورنومنت پر می‌شود.
  const initial: FormState | null = useMemo(
    () =>
      t
        ? {
            title: t.title,
            game: t.game,
            platform: t.platform,
            maxParticipants: t.maxParticipants,
            minParticipants: t.minParticipants,
            prize: t.prize,
            startAt: toDateInput(t.startAt),
            registrationEnd: toDateInput(t.registrationEnd),
          }
        : null,
    [t],
  );

  if (!t || !initial) return null; // layout حالتِ پیدانشدن را نشان می‌دهد

  // key={t.id} تضمین می‌کند با تعویضِ تورنومنت، stateِ فرم از نو ساخته شود.
  return <EditForm key={t.id} t={t} initial={initial} actorName={actorName} role={role} />;
}

function EditForm({
  t,
  initial,
  actorName,
  role,
}: {
  t: AdminTournament;
  initial: FormState;
  actorName: string;
  role: AdminRole;
}) {
  // baselineِ محلی: پس از ذخیره به مقدارِ جدید می‌رود تا dirty پاک شود (بدونِ persist به store).
  const [baseline, setBaseline] = useState<FormState>(initial);
  const [form, setForm] = useState<FormState>(initial);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const dirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== baseline[k]);

  // ───────── اعتبارسنجی ─────────
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim()) errors.title = 'عنوان نمی‌تواند خالی باشد.';
  if (!form.game.trim()) errors.game = 'نامِ بازی الزامی است.';
  if (form.maxParticipants < form.minParticipants)
    errors.maxParticipants = 'ظرفیتِ حداکثر باید بزرگ‌تر یا مساویِ حداقل باشد.';
  if (form.minParticipants < 2) errors.minParticipants = 'حداقل شرکت‌کننده باید دستِ‌کم ۲ باشد.';
  if (form.prize < 0) errors.prize = 'جایزه نمی‌تواند منفی باشد.';
  const valid = Object.keys(errors).length === 0;

  const allowed = can(role, 'edit');
  const canSave = allowed && dirty && valid;

  function reset() {
    setForm(baseline);
  }

  function save() {
    if (!canSave) return;
    const next: FormState = { ...form, title: form.title.trim(), game: form.game.trim() };
    appendAudit({
      actor: actorName,
      actorRole: role,
      action: 'ویرایشِ تورنومنت',
      entityType: 'tournament',
      entityId: t.id,
      reason: `عنوان: «${next.title}» · ظرفیت ${next.minParticipants}–${next.maxParticipants} · جایزه ${money(next.prize)}`,
    });
    pushToast({ kind: 'success', msg: 'تغییراتِ تورنومنت ذخیره شد' });
    setForm(next);
    setBaseline(next); // baseline جدید ⇒ dirty پاک می‌شود
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-accent-dim';
  const meta = TOURNAMENT_STATUS_META[t.status];
  const back = `/admin/tournaments/${t.id}`;

  return (
    <div className="space-y-4">
      {/* عنوانِ بخش */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-base font-bold leading-tight">ویرایشِ تورنومنت</h2>
            <p className="text-[11px] text-faint">تغییرِ مشخصاتِ پایه، ظرفیت، جایزه و زمان‌بندیِ ثبت‌نام.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminBadge label={meta.label} tone={meta.tone} dot={t.status === 'live'} />
          {dirty && (
            <span className="chip border border-gold/30 bg-gold/10 text-gold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              تغییراتِ ذخیره‌نشده
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* فرم */}
        <div className="rounded-2xl border border-line bg-tile p-5">
          {!allowed && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-[#fca5a5]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              برای ویرایش دسترسیِ «tournament:update» لازم است؛ فرم فقط‌خواندنی است.
            </div>
          )}

          <fieldset disabled={!allowed} className="space-y-4 disabled:opacity-60">
            <Field label="عنوانِ تورنومنت" error={errors.title}>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="مثلاً Valorant Champions Arena"
                className={inputCls}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="بازی" error={errors.game}>
                <input value={form.game} onChange={(e) => set('game', e.target.value)} className={inputCls} />
              </Field>
              <Field label="پلتفرم">
                <select value={form.platform} onChange={(e) => set('platform', e.target.value)} className={inputCls}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} className="bg-tile2 text-text">
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ظرفیتِ حداکثر" hint="تعدادِ شرکت‌کننده" error={errors.maxParticipants}>
                <input
                  type="number"
                  min={2}
                  value={form.maxParticipants}
                  onChange={(e) => set('maxParticipants', Number(e.target.value))}
                  className={`${inputCls} tnum`}
                />
              </Field>
              <Field label="حداقل شرکت‌کننده" hint="برای ساختِ براکت" error={errors.minParticipants}>
                <input
                  type="number"
                  min={2}
                  value={form.minParticipants}
                  onChange={(e) => set('minParticipants', Number(e.target.value))}
                  className={`${inputCls} tnum`}
                />
              </Field>
            </div>

            <Field label="جایزه (تومان)" hint={`پیش‌نمایش: ${money(Math.max(0, form.prize))}`} error={errors.prize}>
              <input
                type="number"
                min={0}
                step={1000000}
                value={form.prize}
                onChange={(e) => set('prize', Number(e.target.value))}
                className={`${inputCls} tnum`}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="تاریخِ شروع">
                <input
                  type="date"
                  value={form.startAt}
                  onChange={(e) => set('startAt', e.target.value)}
                  className={`${inputCls} tnum`}
                />
              </Field>
              <Field label="پایانِ ثبت‌نام">
                <input
                  type="date"
                  value={form.registrationEnd}
                  onChange={(e) => set('registrationEnd', e.target.value)}
                  className={`${inputCls} tnum`}
                />
              </Field>
            </div>
          </fieldset>

          {/* نوارِ اقدام */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[11px] text-faint">
              {dirty ? 'تغییراتِ ذخیره‌نشده دارید — پیش از خروج «ذخیره» را بزنید.' : 'هیچ تغییری اعمال نشده است.'}
            </p>
            <div className="flex items-center gap-2">
              {dirty && allowed && (
                <button onClick={reset} className="btn-ghost px-3 py-2 text-xs">
                  بازگردانی
                </button>
              )}
              <Link href={back} className="btn-ghost px-4 py-2 text-sm">
                انصراف
              </Link>
              <button
                onClick={save}
                disabled={!canSave}
                title={allowed ? (valid ? undefined : 'فرم نامعتبر است') : 'دسترسی لازم را ندارید'}
                className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>

        {/* کناره: خلاصه + ممیزی */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-tile p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-faint">خلاصه‌ی فعلی</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-faint">شرکت‌کننده‌ها</dt>
                <dd className="tnum text-slate-200">
                  {fmt(t.participants)} / {fmt(form.maxParticipants)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-faint">حداقل برای براکت</dt>
                <dd className="tnum text-slate-200">{fmt(form.minParticipants)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-faint">جایزه</dt>
                <dd className="tnum font-semibold text-gold">{money(Math.max(0, form.prize))}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-faint">پلتفرم</dt>
                <dd className="text-slate-200">{form.platform}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-tile p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-faint">گزارشِ عملیاتِ این تورنومنت</h3>
            <AuditLogList entityId={t.id} limit={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
