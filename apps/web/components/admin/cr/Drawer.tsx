'use client';

import { useEffect, type ReactNode } from 'react';

/** کشوی کناریِ اتاقِ کنترل (Match/Player/Dispute). */
export function Drawer({ open, onClose, title, subtitle, children, width = 480 }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[105]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 start-0 flex w-full flex-col border-e border-line bg-tile shadow-[30px_0_80px_-30px_rgba(0,0,0,.9)] animate-[fade-up_.2s_ease]" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div className="min-w-0">{title}{subtitle && <div className="mt-0.5 text-xs text-faint">{subtitle}</div>}</div>
          <button onClick={onClose} className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line text-faint hover:text-text" aria-label="بستن">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
