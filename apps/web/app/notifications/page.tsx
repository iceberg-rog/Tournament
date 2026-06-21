'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';

interface Notif {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const icon: Record<string, string> = {
  REGISTERED: '📝',
  WAITLISTED: '⏳',
  STARTED: '🚀',
  WON: '🏆',
  COMPLETED: '🏁',
  CANCELLED: '❌',
};

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
      <main className="p-8">
        برای اعلان‌ها{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">اعلان‌ها</h1>
      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${n.read ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-900'}`}
          >
            <span>
              {icon[n.type] ?? '🔔'} {n.message}
            </span>
            {!n.read && (
              <button
                onClick={() => authedPost(`/notifications/${n.id}/read`, {}).then(load)}
                className="text-xs text-indigo-400 hover:underline"
              >
                خواندم
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-slate-400">اعلانی ندارید.</li>}
      </ul>
    </main>
  );
}
