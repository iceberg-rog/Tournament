'use client';

import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_FEED, ACTIVITY_DOT } from '@/lib/activityFeed';

const ROTATE_MS = 2800;

/** فیدِ فعالیتِ زنده — پنجره‌ای لغزان که به‌آرامی می‌چرخد. */
export function LiveActivityFeed({ className = '', max = 4 }: { className?: string; max?: number }) {
  const size = Math.min(Math.max(1, max), ACTIVITY_FEED.length);
  const [start, setStart] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setStart((s) => (s + 1) % ACTIVITY_FEED.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  // پنجره‌ی لغزان به‌اندازه‌ی size؛ با پیچش روی انتهای آرایه.
  const window_ = useMemo(() => {
    const s = reduced ? 0 : start;
    return Array.from({ length: size }, (_, i) => {
      const item = ACTIVITY_FEED[(s + i) % ACTIVITY_FEED.length];
      // کلیدِ یکتا برای هر موقعیتِ چرخش تا انیمیشنِ ورود دوباره اجرا شود.
      return { item, key: `${item.id}-${(s + i) % ACTIVITY_FEED.length}-${s}` };
    });
  }, [start, size, reduced]);

  return (
    <div className={`rounded-2xl border border-line bg-tile p-3 ${className}`}>
      {/* سرتیتر: نقطه‌ی نبض‌دارِ teal + عنوان */}
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="font-display text-[11px] font-semibold tracking-wide text-slate-200">فعالیتِ زنده</span>
      </div>

      {/* بدنه: ردیف‌های پنجره‌ی جاری */}
      <ul className="space-y-1">
        {window_.map(({ item, key }, i) => (
          <li
            key={key}
            className="flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5"
            style={
              reduced
                ? undefined
                : {
                    animation: 'fade-up .5s var(--ease) both',
                    animationDelay: `${i * 70}ms`,
                  }
            }
          >
            <span className={`h-1.5 w-1.5 flex-none rounded-full ${ACTIVITY_DOT[item.kind]}`} />
            <span className="truncate text-[11px] leading-5 text-slate-300">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
