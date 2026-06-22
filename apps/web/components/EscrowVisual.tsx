/** ویژوالِ escrow: قفلِ امن در میانه، با جریانِ ورودی → قفل → جایزه. */
export function EscrowVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-2.5 px-4">
      {/* ورودی */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-line2 bg-tile2 px-2 py-1 text-[10px] font-semibold text-muted">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" />
          </svg>
          ورودی
        </span>
      </div>

      {/* فلش */}
      <svg width={20} height={12} viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-faint">
        <path d="M22 6H2M8 2 4 6l4 4" />
      </svg>

      {/* قفلِ امن */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-[0_0_24px_-6px_rgba(45,212,191,.5)]">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /><circle cx="12" cy="15.5" r="1" />
          </svg>
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-accent">escrow</span>
      </div>

      {/* فلش */}
      <svg width={20} height={12} viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-faint">
        <path d="M22 6H2M8 2 4 6l4 4" />
      </svg>

      {/* جایزه */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] font-semibold text-gold">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
          </svg>
          جایزه
        </span>
      </div>
    </div>
  );
}
