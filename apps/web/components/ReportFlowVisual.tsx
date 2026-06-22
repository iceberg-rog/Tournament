/** ویژوالِ گزارش/داوری: گزارشِ تخلف (flag) → بررسیِ داور → تأیید (check). */
export function ReportFlowVisual() {
  const Step = ({
    children,
    tone,
    label,
  }: {
    children: React.ReactNode;
    tone: 'bad' | 'muted' | 'good';
    label: string;
  }) => {
    const styles =
      tone === 'bad'
        ? 'border-bad/30 bg-bad/10 text-bad'
        : tone === 'good'
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-line2 bg-tile2 text-muted';
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className={`grid h-9 w-9 place-items-center rounded-xl border ${styles}`}>{children}</span>
        <span className="text-[9px] font-semibold text-faint">{label}</span>
      </div>
    );
  };

  const Arrow = () => (
    <svg width={18} height={12} viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-faint">
      <path d="M22 6H2M8 2 4 6l4 4" />
    </svg>
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center gap-2 px-4">
      <Step tone="bad" label="گزارش">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21V4h11l-1.5 4L15 12H4" /><path d="M4 4v17" />
        </svg>
      </Step>
      <Arrow />
      <Step tone="muted" label="داوری">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M12 3v18M7 7l5-3 5 3M5 7l-2 5h6L7 7M19 7l-2 5h6l-2-5" />
        </svg>
      </Step>
      <Arrow />
      <Step tone="good" label="تأیید">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </Step>
    </div>
  );
}
