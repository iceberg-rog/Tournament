'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';

interface Message {
  authorId: string;
  staff: boolean;
  text: string;
  createdAt: string;
}
interface Ticket {
  id: string;
  subject: string;
  status: string;
  messages: Message[];
}

const statusFa: Record<string, string> = { OPEN: 'باز', ANSWERED: 'پاسخ‌داده‌شده', CLOSED: 'بسته' };

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  async function load() {
    setTickets(await authedGet<Ticket[]>('/tickets'));
  }
  useEffect(() => {
    if (loggedIn) load().catch((e) => setError(e.message));
  }, [loggedIn]);

  async function act(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await load();
      if (active) setActive(await authedGet<Ticket>(`/tickets/${active.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!loggedIn)
    return (
      <main className="p-8">
        برای پشتیبانی{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">پشتیبانی</h1>
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <section className="mb-4 rounded-lg bg-slate-900 p-4">
            <h2 className="mb-2 font-bold">تیکت جدید</h2>
            <input className="mb-2 w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="موضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea className="mb-2 w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="شرح مشکل" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <button
              onClick={() =>
                act(async () => {
                  await authedPost('/tickets', { subject, text });
                  setSubject('');
                  setText('');
                })
              }
              className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500"
            >
              ارسال تیکت
            </button>
          </section>
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => authedGet<Ticket>(`/tickets/${t.id}`).then(setActive)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-right ${active?.id === t.id ? 'bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  <span>{t.subject}</span>
                  <span className="text-xs text-slate-400">{statusFa[t.status] ?? t.status}</span>
                </button>
              </li>
            ))}
            {tickets.length === 0 && <li className="text-slate-400">تیکتی ندارید.</li>}
          </ul>
        </div>

        <div>
          {active ? (
            <section className="rounded-lg bg-slate-900 p-4">
              <h2 className="mb-3 font-bold">{active.subject}</h2>
              <div className="mb-3 space-y-2">
                {active.messages.map((m, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-sm ${m.staff ? 'bg-indigo-900/40' : 'bg-slate-800'}`}>
                    <p className="mb-1 text-xs text-slate-400">{m.staff ? 'پشتیبانی' : 'شما'}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              {active.status !== 'CLOSED' && (
                <div className="flex gap-2">
                  <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="پاسخ..." value={reply} onChange={(e) => setReply(e.target.value)} />
                  <button
                    onClick={() => reply.trim() && act(async () => { await authedPost(`/tickets/${active.id}/reply`, { text: reply }); setReply(''); })}
                    className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500"
                  >
                    ارسال
                  </button>
                </div>
              )}
            </section>
          ) : (
            <p className="text-slate-400">یک تیکت را برای مشاهده انتخاب کنید.</p>
          )}
        </div>
      </div>
    </main>
  );
}
