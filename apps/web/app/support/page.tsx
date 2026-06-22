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
const statusTint: Record<string, string> = {
  OPEN: 'bg-accent/15 text-[#5eead4]',
  ANSWERED: 'bg-gold/15 text-gold',
  CLOSED: 'bg-white/5 text-faint',
};

const I = {
  ticket: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M13 7v10" strokeDasharray="2 2" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  chat: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  send: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>,
};

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
      <div className="card p-8 text-sm text-muted">
        برای پشتیبانی{' '}
        <Link href="/login" className="text-accent">
          وارد شوید
        </Link>
        .
      </div>
    );

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-center text-sm text-bad">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <section className="card p-4">
            <div className="tile-head">
              <span className="tile-ic amber">{I.plus}</span>
              <span className="tile-title">تیکت جدید</span>
            </div>
            <input
              className="mb-2 w-full rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
              placeholder="موضوع"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="mb-3 w-full rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
              placeholder="شرح مشکل"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={() =>
                act(async () => {
                  await authedPost('/tickets', { subject, text });
                  setSubject('');
                  setText('');
                })
              }
              className="btn-primary w-full"
            >
              {I.send}
              ارسال تیکت
            </button>
          </section>

          <section className="card p-4">
            <div className="tile-head">
              <span className="tile-ic">{I.ticket}</span>
              <span className="tile-title">تیکت‌های من</span>
            </div>
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => authedGet<Ticket>(`/tickets/${t.id}`).then(setActive)}
                    className={`row-soft flex w-full items-center justify-between px-4 py-3 text-right ${active?.id === t.id ? 'border-accent/30 bg-accent/10' : ''}`}
                  >
                    <span className="min-w-0 truncate text-[13px] font-semibold">{t.subject}</span>
                    <span className={`chip flex-none ${statusTint[t.status] ?? 'bg-white/5 text-faint'}`}>{statusFa[t.status] ?? t.status}</span>
                  </button>
                </li>
              ))}
              {tickets.length === 0 && <li className="py-6 text-center text-sm text-faint">تیکتی ندارید.</li>}
            </ul>
          </section>
        </div>

        <div>
          {active ? (
            <section className="card p-4">
              <div className="tile-head">
                <span className="tile-ic">{I.chat}</span>
                <span className="tile-title">{active.subject}</span>
                <span className={`chip ms-auto flex-none ${statusTint[active.status] ?? 'bg-white/5 text-faint'}`}>{statusFa[active.status] ?? active.status}</span>
              </div>
              <div className="mb-3 space-y-2">
                {active.messages.map((m, i) => (
                  <div key={i} className={`rounded-xl border px-3 py-2 text-sm ${m.staff ? 'border-accent/30 bg-accent/10' : 'border-line bg-tile2'}`}>
                    <p className={`mb-1 text-xs font-semibold ${m.staff ? 'text-accent' : 'text-faint'}`}>{m.staff ? 'پشتیبانی' : 'شما'}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              {active.status !== 'CLOSED' && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
                    placeholder="پاسخ..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    onClick={() => reply.trim() && act(async () => { await authedPost(`/tickets/${active.id}/reply`, { text: reply }); setReply(''); })}
                    className="btn-primary flex-none"
                  >
                    ارسال
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="card grid place-items-center p-10 text-center text-sm text-faint">
              یک تیکت را برای مشاهده انتخاب کنید.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
