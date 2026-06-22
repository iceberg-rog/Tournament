/** ویژوالِ کوچکِ براکت: درختِ سه‌گرهی با خطوطِ اتصال و قهرمانِ طلایی. */
export function MiniBracketVisual() {
  const node = 'rounded-md border border-line2 bg-tile2';
  return (
    <div className="relative grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-3">
      {/* ستونِ راست: دو جفت‌مسابقه */}
      <div className="flex flex-col gap-2.5">
        <div className={`${node} h-4 w-full`} />
        <div className={`${node} h-4 w-full opacity-70`} />
        <div className={`${node} h-4 w-full`} />
        <div className={`${node} h-4 w-full opacity-70`} />
      </div>

      {/* خطوطِ اتصال */}
      <svg viewBox="0 0 40 80" className="h-full w-10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <g className="text-line2">
          <path d="M2 14 H18 V30 H30" />
          <path d="M2 30 H18" />
          <path d="M2 50 H18 V66 H30" />
          <path d="M2 66 H18" />
        </g>
        <path d="M30 30 V48 H38" className="text-accent" />
        <path d="M30 66 V48" className="text-accent/40" />
      </svg>

      {/* فینال + قهرمان */}
      <div className="flex flex-col items-stretch gap-2">
        <div className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1.5">
          <span className="block h-2 w-3/4 rounded-full bg-accent/60" />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2 py-1.5 text-gold">
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
          </svg>
          <span className="block h-1.5 w-1/2 rounded-full bg-gold/60" />
        </div>
      </div>
    </div>
  );
}
