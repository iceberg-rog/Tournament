import { fmt } from '@/lib/tournaments';

/**
 * ویجتِ فشرده‌ی وضعیتِ امانت (escrow):
 * استخرِ جایزه (طلایی) + جریانِ سه‌مرحله‌ایِ «ورودی → قفل در escrow → آزادسازی به برنده»
 * با پیلِ وضعیتِ «امن» (سبزآبی). طلایی فقط برای مبلغِ جایزه؛ سبزآبی برای امنیت/قفل.
 */
export function PrizeEscrowWidget({ amount = 50000000 }: { amount?: number }) {
  return (
    <div className="rounded-xl border border-line bg-black/20 p-2.5">
      {/* سرتیتر: برچسب + مبلغِ جایزه (طلایی) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">استخرِ جایزه</span>
        <span className="font-display tnum text-sm font-bold text-gold">
          {fmt(amount)}
          <span className="ms-1 text-[11px] font-semibold text-gold/80">ت</span>
        </span>
      </div>

      {/* جریانِ سه‌مرحله‌ای: ورودی → قفل در escrow → آزادسازی به برنده */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <FlowStep label="ورودی" />

        <Arrow />

        {/* مرحله‌ی میانی: کاشیِ قفل (سبزآبی) */}
        <div className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-1.5 py-1.5 text-center">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <span className="text-[10px] font-semibold leading-4 text-accent">قفل در escrow</span>
        </div>

        <Arrow />

        <FlowStep label="آزادسازی به برنده" />
      </div>

      {/* پیلِ وضعیت: امن */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          امن
        </span>
        <span className="text-[10px] leading-5 text-faint">پرداختِ تضمین‌شده</span>
      </div>
    </div>
  );
}

/** یک مرحله‌ی فشرده در جریانِ امانت (لبه‌ی خنثی). */
function FlowStep({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-line bg-tile2 px-1.5 py-2 text-center">
      <span className="text-[10px] font-semibold leading-4 text-muted">{label}</span>
    </div>
  );
}

/** پیکانِ جداکننده‌ی مراحل (در RTL به سمتِ چپ اشاره می‌کند). */
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none text-faint">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
