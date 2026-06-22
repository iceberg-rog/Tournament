import { fmt } from '@/lib/tournaments';

const Ico = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

type Status = 'RUNNING' | 'DRAFT' | 'COMPLETED' | string;

/** نوارِ پیشرفتِ ظرفیتِ ثبت‌نام — جمع‌وجور برای ساید‌بار. */
export function TournamentProgress({
  filled = 28,
  cap = 32,
  status = 'RUNNING' as Status,
}: {
  filled?: number;
  cap?: number;
  status?: Status;
}) {
  const pct = cap > 0 ? Math.min(100, Math.round((filled / cap) * 100)) : 0;

  const hint =
    status === 'RUNNING'
      ? { label: 'در حال انجام', cls: 'text-bad', dot: <span className="dot" /> }
      : status === 'DRAFT'
        ? { label: 'ثبت‌نام باز', cls: 'text-accent', dot: <span className="h-[7px] w-[7px] rounded-full bg-accent" /> }
        : { label: 'پایان‌یافته', cls: 'text-faint', dot: <span className="h-[7px] w-[7px] rounded-full bg-faint" /> };

  return (
    <div className="rounded-2xl border border-line bg-tile p-4 shadow-[var(--shadow)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
          <span className="text-accent">
            <Ico><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></Ico>
          </span>
          شرکت‌کننده‌ها
        </span>
        <span className="font-display tnum text-sm">
          <b className="text-text">{fmt(filled)}</b>
          <span className="text-faint"> / {fmt(cap)}</span>
        </span>
      </div>

      <div className="pbar" role="progressbar" aria-valuenow={filled} aria-valuemin={0} aria-valuemax={cap}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className={`mt-3 flex items-center gap-2 text-xs font-semibold ${hint.cls}`}>
        {hint.dot}
        <span className="leading-7">{hint.label}</span>
        <span className="ms-auto font-display tnum text-muted">{fmt(pct)}٪</span>
      </div>
    </div>
  );
}
