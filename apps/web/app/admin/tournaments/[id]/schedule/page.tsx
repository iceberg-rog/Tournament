'use client';

// بخشِ «برنامه‌ی زمان‌بندی» — تایم‌لاینِ دورها، مهلت‌ها و طرحِ یادآوری‌ها.
// هر اکشن واقعی است: patchِ refresh-safe در localStorage + pushToast + appendAudit.
// تمدیدِ مهلت / زمان‌بندیِ مجدد / ارسالِ یادآوری روی هر دور، و انتشارِ کلِ برنامه از بالای صفحه.

import { useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useTournament, useAdminRole, pushToast, appendAudit } from '@/lib/admin/store';
import {
  buildTournamentOps,
  type ScheduleRound,
  type RoundOpsStatus,
  type NotificationChannel,
  type NotificationDeliveryStatus,
} from '@/lib/admin/tournamentOps';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { Drawer } from '@/components/admin/cr/Drawer';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmt, type Tone } from '@/lib/admin';

// زمانِ «اکنون» منطبق با NOW در tournamentOps (داده‌ی mock زمان‌مرجع دارد).
const NOW = 1750680000000;

type RoundPatch = { offsetMin?: number; startLabel?: string; remindersSent?: number[] };
type Patches = Record<number, RoundPatch>;

// ───────── نگاشت‌های وضعیت ─────────
const ROUND_FA: Record<RoundOpsStatus, string> = {
  completed: 'پایان‌یافته',
  current: 'در حالِ اجرا',
  blocked: 'مسدود',
  warning: 'هشدار',
  locked: 'قفل',
  upcoming: 'پیشِ‌رو',
};
const ROUND_TONE: Record<RoundOpsStatus, Tone> = {
  completed: 'good',
  current: 'accent',
  blocked: 'bad',
  warning: 'gold',
  locked: 'muted',
  upcoming: 'muted',
};
// رنگِ ریلِ کناریِ کارت بر اساسِ وضعیت.
const RAIL: Record<RoundOpsStatus, string> = {
  completed: 'bg-good',
  current: 'bg-accent',
  blocked: 'bg-bad',
  warning: 'bg-gold',
  locked: 'bg-line',
  upcoming: 'bg-line',
};

const DELIVERY_FA: Record<NotificationDeliveryStatus, string> = {
  scheduled: 'زمان‌بندی‌شده',
  sent: 'ارسال‌شده',
  read: 'خوانده‌شده',
  failed: 'ناموفق',
  unanswered: 'بی‌پاسخ',
};
const DELIVERY_DOT: Record<NotificationDeliveryStatus, string> = {
  scheduled: 'bg-faint',
  sent: 'bg-accent',
  read: 'bg-good',
  failed: 'bg-bad',
  unanswered: 'bg-bad',
};
const DELIVERY_TEXT: Record<NotificationDeliveryStatus, string> = {
  scheduled: 'text-faint',
  sent: 'text-accent',
  read: 'text-good',
  failed: 'text-[#fca5a5]',
  unanswered: 'text-[#fca5a5]',
};

const CHANNEL_FA: Record<NotificationChannel, string> = {
  in_app: 'درون‌برنامه',
  email: 'ایمیل',
  sms: 'پیامک',
  push: 'پوش',
  chat: 'چت',
};

// ───────── کمک‌ها (کوچک) ─────────
const clock = (iso: string) => new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
const dayMonth = (iso: string) => new Date(iso).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
const dateTime = (iso: string) => `${dayMonth(iso)} · ${clock(iso)}`;
// اعمالِ offsetMin روی یک زمانِ ISO و قالب‌بندی.
const shifted = (iso: string, offsetMin = 0) => new Date(new Date(iso).getTime() + offsetMin * 60000).toISOString();

export default function Page() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t]);

  // patchهای هر دور (تمدید/زمان‌بندیِ مجدد/یادآوریِ ارسال‌شده) — refresh-safe.
  const [patches, setPatches] = useOpsSlice<Patches>(id, 'schedule-patches', {});
  // وضعیتِ انتشارِ کلِ برنامه — refresh-safe.
  const [published, setPublished] = useOpsSlice<boolean>(id, 'schedule-published', false);
  const [openRound, setOpenRound] = useState<number | null>(null);

  if (!t || !ops) return null;

  const schedule = ops.schedule;
  const patchOf = (r: number): RoundPatch => patches[r] ?? {};
  // زمانِ نمایشیِ هر مهلت با اعمالِ offsetMin همان دور.
  const showAt = (r: ScheduleRound, key: keyof ScheduleRound) => shifted(r[key] as string, patchOf(r.round).offsetMin);
  const startLabelOf = (r: ScheduleRound) => patchOf(r.round).startLabel ?? dateTime(showAt(r, 'startAt'));

  // ───────── خلاصه (محاسبه‌شده از ops.schedule) ─────────
  const currentRound = schedule.find((r) => r.status === 'current' || r.status === 'blocked');
  const upcomingCount = schedule.filter((r) => r.status === 'upcoming' || r.status === 'locked').length;
  const overdueCount = schedule.filter(
    (r) => new Date(showAt(r, 'matchDeadline')).getTime() < NOW && r.status !== 'completed',
  ).length;
  const lastRound = schedule[schedule.length - 1];
  const estEnd = lastRound ? dateTime(shifted(lastRound.nextRoundGen, patchOf(lastRound.round).offsetMin)) : '—';

  // ───────── اکشن‌ها: patch + toast + ممیزی ─────────
  const setPatch = (round: number, fn: (prev: RoundPatch) => RoundPatch) =>
    setPatches((p) => ({ ...p, [round]: fn(p[round] ?? {}) }));

  function publishSchedule() {
    setPublished(true);
    pushToast({ kind: 'success', msg: 'برنامه‌ی زمان‌بندی منتشر شد' });
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action: 'انتشارِ برنامه‌ی زمان‌بندی', entityType: 'tournament', entityId: id, reason: 'انتشار برای شرکت‌کننده‌ها' });
  }

  function extendDeadline(r: ScheduleRound) {
    setPatch(r.round, (prev) => ({ ...prev, offsetMin: (prev.offsetMin ?? 0) + 15 }));
    const total = (patchOf(r.round).offsetMin ?? 0) + 15;
    pushToast({ kind: 'success', msg: `مهلتِ ${r.name} ${fmt(15)} دقیقه تمدید شد (مجموعِ ${fmt(total)} دقیقه)` });
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action: `تمدیدِ مهلتِ ${r.name}`, entityType: 'tournament', entityId: id, reason: 'تمدیدِ ۱۵ دقیقه‌ای' });
  }

  function reschedule(r: ScheduleRound) {
    const label = typeof window !== 'undefined' ? window.prompt('زمانِ تازه‌ی شروع را وارد کنید (مثلاً: فردا ۲۰:۳۰)', startLabelOf(r)) : null;
    if (!label || !label.trim()) return;
    const clean = label.trim();
    setPatch(r.round, (prev) => ({ ...prev, startLabel: clean }));
    pushToast({ kind: 'success', msg: `${r.name} به «${clean}» زمان‌بندیِ مجدد شد` });
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action: `زمان‌بندیِ مجددِ ${r.name}`, entityType: 'tournament', entityId: id, reason: `شروعِ تازه: ${clean}` });
  }

  // یادآوریِ گامِ ۱۰ دقیقه قبل (index 2) را به‌عنوانِ ارسال‌شده علامت می‌زند.
  function sendReminder(r: ScheduleRound) {
    const stepIndex = 2;
    setPatch(r.round, (prev) => {
      const sent = prev.remindersSent ?? [];
      return sent.includes(stepIndex) ? prev : { ...prev, remindersSent: [...sent, stepIndex] };
    });
    pushToast({ kind: 'success', msg: `یادآوری به بازیکنانِ ${r.name} ارسال شد` });
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action: `ارسالِ یادآوری به ${r.name}`, entityType: 'tournament', entityId: id, reason: 'یادآوریِ ۱۰ دقیقه قبل از شروع' });
  }

  // وضعیتِ نمایشیِ یک گامِ یادآوری (با درنظرگرفتنِ patchِ ارسال‌شده).
  const stepStatus = (r: ScheduleRound, i: number): NotificationDeliveryStatus => {
    if ((patchOf(r.round).remindersSent ?? []).includes(i)) return 'sent';
    return r.notifications[i].status;
  };

  const active = openRound != null ? schedule.find((r) => r.round === openRound) ?? null : null;

  return (
    <div className="space-y-5">
      {/* سرفصلِ بخش + انتشار */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">برنامه‌ی زمان‌بندی</h2>
          <p className="mt-0.5 text-xs text-faint">زمان‌بندیِ دورها، مهلت‌ها و طرحِ یادآوری‌ها.</p>
        </div>
        <div className="flex items-center gap-2">
          {published && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-good">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              منتشرشده
            </span>
          )}
          <button onClick={publishSchedule} className="btn-primary px-4 py-2 text-xs">
            {published ? 'انتشارِ دوباره' : 'انتشارِ برنامه'}
          </button>
        </div>
      </div>

      {/* ردیفِ خلاصه */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="دورِ جاری" value={currentRound ? currentRound.name : 'بدونِ دورِ فعال'} tone="accent"
          icon={<path d="M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />} />
        <SummaryCard label="دورهای پیشِ‌رو" value={fmt(upcomingCount)} tone="muted"
          icon={<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />} />
        <SummaryCard label="مهلت‌های گذشته" value={fmt(overdueCount)} tone={overdueCount > 0 ? 'bad' : 'good'}
          icon={<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />} />
        <SummaryCard label="زمانِ تخمینیِ پایان" value={estEnd} tone="gold"
          icon={<path d="M6 3v6a6 6 0 0 0 12 0V3M6 21v-6a6 6 0 0 1 12 0v6M5 3h14M5 21h14" />} />
      </div>

      {/* تایم‌لاینِ دورها */}
      <ul className="space-y-3">
        {schedule.map((r) => {
          const offset = patchOf(r.round).offsetMin ?? 0;
          const overdue = new Date(showAt(r, 'matchDeadline')).getTime() < NOW && r.status !== 'completed';
          return (
            <li key={r.round}>
              <div className="relative overflow-hidden rounded-2xl border border-line bg-tile p-4 ps-5 transition hover:border-accent-dim">
                {/* ریلِ رنگیِ سمتِ آغاز */}
                <span className={`absolute inset-y-0 start-0 w-1.5 ${RAIL[r.status]}`} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line bg-tile2 text-[11px] font-bold tnum text-muted">
                      R{fmt(r.round)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="mt-0.5 text-[11px] text-faint tnum">{fmt(r.matches)} مسابقه · شروع {startLabelOf(r)}</p>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    {offset > 0 && <span className="chip border border-gold/30 bg-gold/10 text-gold tnum">+{fmt(offset)} دقیقه</span>}
                    {overdue && <AdminBadge label="مهلت گذشته" tone="bad" />}
                    <AdminBadge label={ROUND_FA[r.status]} tone={ROUND_TONE[r.status]} dot={r.status === 'current'} />
                  </div>
                </div>

                {/* شبکه‌ی مهلت‌ها */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Timing label="شروع" value={dateTime(showAt(r, 'startAt'))} />
                  <Timing label="چک‌این" value={`${clock(showAt(r, 'checkInStart'))}–${clock(showAt(r, 'checkInDeadline'))}`} />
                  <Timing label="مهلتِ مسابقه" value={dateTime(showAt(r, 'matchDeadline'))} alert={overdue} />
                  <Timing label="مهلتِ نتیجه" value={dateTime(showAt(r, 'resultDeadline'))} />
                  <Timing label="مهلتِ اعتراض" value={dateTime(showAt(r, 'disputeDeadline'))} />
                  <Timing label="ساختِ دورِ بعد" value={dateTime(showAt(r, 'nextRoundGen'))} />
                </div>

                {/* مینی‌لیستِ یادآوری‌ها */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-[11px] text-faint">یادآوری‌ها:</span>
                  {r.notifications.map((n, i) => {
                    const st = stepStatus(r, i);
                    return (
                      <span key={i} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${st === 'unanswered' ? 'border-bad/40 bg-bad/10' : 'border-line bg-tile2'}`}>
                        <span className={`h-1.5 w-1.5 flex-none rounded-full ${DELIVERY_DOT[st]}`} />
                        <span className="text-muted">{n.offset}</span>
                        <span className="text-faint">·</span>
                        <span className="text-faint">{n.channels.map((c) => CHANNEL_FA[c]).join('، ')}</span>
                        <span className={`font-semibold ${DELIVERY_TEXT[st]}`}>{DELIVERY_FA[st]}</span>
                      </span>
                    );
                  })}
                  <button onClick={() => setOpenRound(r.round)} className="btn-ghost ms-auto px-3 py-1.5 text-xs">
                    جزئیات و اقدام
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* کشوی جزئیاتِ دور + اکشن‌ها */}
      <Drawer
        open={active != null}
        onClose={() => setOpenRound(null)}
        width={520}
        title={<p className="font-display text-base font-bold">{active?.name ?? ''}</p>}
        subtitle={active ? `${ROUND_FA[active.status]} · ${fmt(active.matches)} مسابقه` : undefined}
      >
        {active && (
          <div className="space-y-4">
            {/* وضعیت و شروع */}
            <div className="flex items-center justify-between rounded-xl border border-line bg-tile2 p-3">
              <div>
                <p className="text-[11px] text-faint">شروعِ دور</p>
                <p className="mt-0.5 text-sm font-semibold">{startLabelOf(active)}</p>
              </div>
              <AdminBadge label={ROUND_FA[active.status]} tone={ROUND_TONE[active.status]} dot={active.status === 'current'} />
            </div>

            {/* همه‌ی مهلت‌ها */}
            <div>
              <p className="mb-2 text-xs font-bold text-muted">مهلت‌ها</p>
              <div className="grid grid-cols-2 gap-2">
                <Timing label="شروع" value={dateTime(showAt(active, 'startAt'))} boxed />
                <Timing label="آغازِ چک‌این" value={dateTime(showAt(active, 'checkInStart'))} boxed />
                <Timing label="پایانِ چک‌این" value={dateTime(showAt(active, 'checkInDeadline'))} boxed />
                <Timing label="مهلتِ مسابقه" value={dateTime(showAt(active, 'matchDeadline'))} boxed />
                <Timing label="مهلتِ نتیجه" value={dateTime(showAt(active, 'resultDeadline'))} boxed />
                <Timing label="مهلتِ اعتراض" value={dateTime(showAt(active, 'disputeDeadline'))} boxed />
                <Timing label="ساختِ دورِ بعد" value={dateTime(showAt(active, 'nextRoundGen'))} boxed />
              </div>
              {(patchOf(active.round).offsetMin ?? 0) > 0 && (
                <p className="mt-2 text-[11px] text-gold tnum">مهلت‌ها {fmt(patchOf(active.round).offsetMin ?? 0)} دقیقه به‌تعویق افتاده‌اند.</p>
              )}
            </div>

            {/* طرحِ یادآوری‌ها */}
            <div>
              <p className="mb-2 text-xs font-bold text-muted">طرحِ یادآوری‌ها</p>
              <ul className="space-y-2">
                {active.notifications.map((n, i) => {
                  const st = stepStatus(active, i);
                  return (
                    <li key={i} className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 ${st === 'unanswered' ? 'border-bad/40 bg-bad/10' : 'border-line bg-tile2'}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{n.offset}</p>
                        <p className="mt-0.5 text-[11px] text-faint">{n.channels.map((c) => CHANNEL_FA[c]).join('، ')}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${DELIVERY_TEXT[st]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${DELIVERY_DOT[st]}`} />
                        {DELIVERY_FA[st]}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-faint">گام‌های «بی‌پاسخ» (قرمز) یعنی بازیکنان یادآوری گرفته‌اند ولی واکنش نداده‌اند.</p>
            </div>

            {/* اقدام‌ها */}
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-xs font-bold text-muted">اقدام‌ها</p>
              <div className="grid gap-2">
                <button onClick={() => extendDeadline(active)}
                  className="flex items-center justify-between rounded-lg border border-line bg-tile2 px-3 py-2.5 text-sm transition hover:border-accent-dim">
                  <span>تمدیدِ مهلت ۱۵ دقیقه</span>
                  <span className="text-[11px] text-faint">مهلتِ مسابقه و نتیجه به‌تعویق می‌افتد</span>
                </button>
                <button onClick={() => reschedule(active)}
                  className="flex items-center justify-between rounded-lg border border-line bg-tile2 px-3 py-2.5 text-sm transition hover:border-accent-dim">
                  <span>زمان‌بندیِ مجدد</span>
                  <span className="text-[11px] text-faint">تعیینِ زمانِ تازه‌ی شروع</span>
                </button>
                <button onClick={() => sendReminder(active)}
                  className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-accent transition hover:bg-accent/15">
                  <span>ارسالِ یادآوری به این دور</span>
                  <span className="text-[11px] text-accent/80">گامِ ۱۰ دقیقه قبل ارسال می‌شود</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ───────── کامپوننت‌های کوچک ─────────
function SummaryCard({ label, value, tone, icon }: { label: string; value: string; tone: Tone; icon: ReactNode }) {
  const color: Record<Tone, string> = {
    accent: 'bg-accent/10 text-accent',
    gold: 'bg-gold/10 text-gold',
    bad: 'bg-bad/10 text-[#fca5a5]',
    good: 'bg-good/10 text-good',
    muted: 'bg-tile2 text-muted',
  };
  return (
    <div className="rounded-2xl border border-line bg-tile p-4">
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${color[tone]}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <p className="text-[11px] text-faint">{label}</p>
      </div>
      <p className="mt-2 truncate font-display text-base font-bold">{value}</p>
    </div>
  );
}

function Timing({ label, value, alert, boxed }: { label: string; value: string; alert?: boolean; boxed?: boolean }) {
  return (
    <div className={boxed ? 'rounded-lg border border-line bg-tile2 p-2.5' : ''}>
      <p className="text-[10px] text-faint">{label}</p>
      <p className={`mt-0.5 text-xs font-semibold tnum ${alert ? 'text-[#fca5a5]' : 'text-text'}`}>{value}</p>
    </div>
  );
}
