'use client';

import Link from 'next/link';
import { dismissToast, useToasts } from '@/lib/admin/store';

const KIND: Record<string, string> = {
  success: 'border-good/40 bg-[#0f1a14]',
  error: 'border-bad/40 bg-[#1a1010]',
  info: 'border-accent/40 bg-[#0d1719]',
};
const DOT: Record<string, string> = { success: 'bg-good', error: 'bg-bad', info: 'bg-accent' };

export function Toaster() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_18px_50px_-20px_rgba(0,0,0,.8)] ${KIND[t.kind]} animate-[fade-up_.25s_ease]`}
        >
          <span className={`h-2 w-2 flex-none rounded-full ${DOT[t.kind]}`} />
          <span className="min-w-0 flex-1">{t.msg}</span>
          {t.action && (
            <Link href={t.action.href} onClick={() => dismissToast(t.id)} className="flex-none whitespace-nowrap text-xs font-bold text-accent hover:underline">
              {t.action.label}
            </Link>
          )}
          <button onClick={() => dismissToast(t.id)} className="flex-none text-faint hover:text-text" aria-label="بستن">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
