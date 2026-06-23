'use client';

import { useMemo, useState } from 'react';
import type { ControlRoomState, CRActivity, CRActivityKind } from '@/lib/admin/controlRoom';
import { relTime } from '@/lib/admin/controlRoom';

type FilterKey = 'all' | 'result' | 'dispute' | 'admin' | 'chat' | 'payment';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'result', label: 'نتایج' },
  { key: 'dispute', label: 'اختلاف‌ها' },
  { key: 'admin', label: 'مدیریت' },
  { key: 'chat', label: 'گفتگو' },
  { key: 'payment', label: 'پرداخت' },
];

// رنگِ نقطه‌ی هر نوع رویداد
const DOT: Record<CRActivityKind, string> = {
  result: 'bg-accent',
  dispute: 'bg-bad',
  admin: 'bg-gold',
  chat: 'bg-muted',
  payment: 'bg-good',
  checkin: 'bg-muted',
};

const KIND_FA: Record<CRActivityKind, string> = {
  result: 'نتیجه',
  dispute: 'اختلاف',
  admin: 'مدیریت',
  chat: 'گفتگو',
  payment: 'پرداخت',
  checkin: 'چک‌این',
};

// پیامِ خالیِ مفید برای هر فیلتر — توضیح می‌دهد چه چیزی اینجا می‌آید.
const EMPTY_FA: Record<FilterKey, string> = {
  all: 'هنوز رویدادی ثبت نشده؛ هر اتفاقِ زنده (ثبتِ نتیجه، اختلاف، اقدامِ مدیر، پیام و پرداخت) همین‌جا به‌صورتِ زنده می‌آید.',
  result: 'نتیجه‌ای ثبت نشده؛ وقتی بازیکنی نتیجه‌ی مسابقه‌ای را ثبت یا تأیید کند اینجا نمایش داده می‌شود.',
  dispute: 'اختلافی باز نشده؛ اگر بازیکنی به نتیجه‌ای اعتراض کند، رویدادش اینجا می‌آید.',
  admin: 'اقدامِ مدیریتی‌ای ثبت نشده؛ توقفِ مسابقه، تأییدِ نتیجه و ساختِ دور اینجا ثبت می‌شود.',
  chat: 'پیامی رد و بدل نشده؛ گفتگوهای مرتبط با مسابقه‌ها اینجا نمایش داده می‌شود.',
  payment: 'رویدادِ مالی‌ای نیست؛ آماده‌سازی و آزادسازیِ جایزه اینجا ثبت می‌شود.',
};

/** فیدِ زنده‌ی فعالیت — با فیلترِ نوع، نقطه‌ی رنگی و زمانِ نسبی. */
export function ActivityLog({ cr }: { cr: ControlRoomState }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  // شمارشِ هر نوع برای نشان‌دادنِ تعداد روی چیپ‌ها
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: cr.activity.length, result: 0, dispute: 0, admin: 0, chat: 0, payment: 0 };
    for (const a of cr.activity) if (a.kind in c) c[a.kind as FilterKey]++;
    return c;
  }, [cr.activity]);

  const items: CRActivity[] = useMemo(
    () => (filter === 'all' ? cr.activity : cr.activity.filter((a) => a.kind === filter)),
    [cr.activity, filter],
  );

  return (
    <section className="rounded-2xl border border-line bg-tile p-4" dir="rtl">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 flex-none">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <h3 className="font-display text-sm font-bold text-accent">فعالیتِ زنده</h3>
        </div>
        <span className="text-xs text-faint tnum">{cr.activity.length.toLocaleString('fa-IR')} رویداد</span>
      </header>

      {/* چیپ‌های فیلتر */}
      <div className="hscroll -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`chip flex-none border transition ${
                active
                  ? 'border-accent/40 bg-accent/15 text-[#5eead4]'
                  : 'border-line bg-tile2 text-muted hover:text-accent'
              }`}
            >
              {f.label}
              <span className={`tnum ${active ? 'text-[#5eead4]' : 'text-faint'}`}>
                {counts[f.key].toLocaleString('fa-IR')}
              </span>
            </button>
          );
        })}
      </div>

      {/* فید */}
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-tile2/40 p-4 text-xs leading-6 text-muted">
          {EMPTY_FA[filter]}
        </p>
      ) : (
        <ol className="flex flex-col">
          {items.map((a, i) => (
            <li
              key={a.id}
              className={`flex items-start gap-3 py-2.5 ${i === 0 ? '' : 'border-t border-line/60'}`}
            >
              <span className="mt-1.5 flex-none" title={KIND_FA[a.kind]}>
                <span className={`block h-2 w-2 rounded-full ${DOT[a.kind]}`} />
              </span>
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-muted">{a.text}</p>
              <time className="mt-0.5 flex-none text-[11px] text-faint tnum">{relTime(a.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default ActivityLog;
