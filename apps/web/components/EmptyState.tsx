import type { ReactNode } from 'react';

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-tile/50 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tile2 text-faint">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
        </svg>
      </span>
      <p className="text-base font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-faint">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
