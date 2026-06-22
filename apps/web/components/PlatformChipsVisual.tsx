/** ویژوالِ پلتفرم/ویزارد: چیپ‌های PC، کنسول و موبایل با آیکنِ خطی. */
export function PlatformChipsVisual() {
  const Chip = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-tile2 px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent">
      <span className="text-accent">{icon}</span>
      {label}
    </span>
  );

  return (
    <div className="relative flex h-full w-full flex-wrap items-center justify-center gap-2 px-4">
      <Chip
        label="PC"
        icon={
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
        }
      />
      <Chip
        label="کنسول"
        icon={
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="11" rx="5" /><path d="M6 12h4M8 10v4" /><circle cx="16" cy="11" r="1" /><circle cx="18.5" cy="13.5" r="1" />
          </svg>
        }
      />
      <Chip
        label="موبایل"
        icon={
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" />
          </svg>
        }
      />
    </div>
  );
}
