'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';

interface Notif {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/* ---- آیکن‌های خطی به‌جای ایموجی ---- */
const PATHS: Record<string, ReactNode> = {
  REGISTERED: <><path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4z" /><path d="M15 4v5h5M8 13h8M8 17h6" /></>,
  WAITLISTED: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  STARTED: <><path d="M5 12l14-7-4 7 4 7z" /></>,
  WON: <><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></>,
  COMPLETED: <><path d="M5 4v16l4-3 3 3 3-3 4 3V4z" /><path d="M9 9h6M9 13h6" /></>,
  CANCELLED: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  DEFAULT: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
};
function NotifIcon({ type }: { type: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[type] ?? PATHS.DEFAULT}
    </svg>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const loggedIn = isLoggedIn();

  async function load() {
    setItems(await authedGet<Notif[]>('/notifications'));
  }
  useEffect(() => {
    if (loggedIn) load().catch(() => {});
  }, [loggedIn]);

  if (!loggedIn)
    return (
      <div className="card p-8 text-sm text-muted">
        برای اعلان‌ها{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          وارد شوید
        </Link>
        .
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold">اعلان‌ها</h2>
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`row-soft flex items-center gap-3 px-3.5 py-3 ${
                n.read ? 'opacity-70' : 'border-accent/30 bg-accent/[.06]'
              }`}
            >
              <span
                className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] ${
                  n.read ? 'bg-white/[.04] text-muted' : 'bg-accent/15 text-[#5eead4]'
                }`}
              >
                <NotifIcon type={n.type} />
              </span>
              <span className={`min-w-0 flex-1 text-[13.5px] ${n.read ? 'text-muted' : 'text-text'}`}>
                {n.message}
              </span>
              {!n.read && (
                <button
                  onClick={() => authedPost(`/notifications/${n.id}/read`, {}).then(load)}
                  className="chip flex-none bg-accent/15 text-[#5eead4] transition hover:bg-accent/25"
                >
                  خواندم
                </button>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="grid place-items-center py-10 text-center text-sm text-faint">
              اعلانی ندارید.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
