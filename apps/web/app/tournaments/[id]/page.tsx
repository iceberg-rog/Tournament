'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn, publicGet } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';

interface Participant {
  id: string;
  name: string;
}
interface TournamentRecord {
  id: string;
  title: string;
  game?: string;
  format: string;
  genre: string;
  status: string;
  participants: Participant[];
  waitlist?: Participant[];
  requireCheckIn?: boolean;
  maxParticipants?: number;
  streamUrl?: string;
  platform?: string;
  startAt?: string;
  durationHours?: number;
  coverImage?: string;
  organizerName?: string;
}
interface ChatMessage {
  id: string;
  displayName: string;
  text: string;
}
interface ReadyMatch {
  id: string;
  kind: 'DUEL' | 'LOBBY';
  participantIds: string[];
}
interface Standing {
  participantId: string;
  name: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
}

function short(name?: string): string {
  if (!name) return '—';
  const base = name.split('@')[0];
  return base.length > 14 ? base.slice(0, 14) + '…' : base;
}
function hue(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function Avatar({ label, size = 'h-8 w-8 text-xs' }: { label: string; size?: string }) {
  const h = hue(label);
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-full font-bold text-white`}
      style={{ background: `linear-gradient(135deg, hsl(${h} 60% 48%), hsl(${(h + 40) % 360} 60% 34%))` }}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

export default function TournamentDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [rec, setRec] = useState<TournamentRecord | null>(null);
  const [ready, setReady] = useState<ReadyMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [myScore, setMyScore] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [streamInput, setStreamInput] = useState('');
  const [pendingConf, setPendingConf] = useState<{ matchId: string; winnerId: string; sides?: [string, string] }[]>([]);
  const [error, setError] = useState('');
  const loggedIn = isLoggedIn();

  const load = useCallback(async () => {
    try {
      const t = await publicGet<TournamentRecord>(`/tournaments/${id}`);
      setRec(t);
      if (t.status === 'RUNNING') {
        setReady(await publicGet<ReadyMatch[]>(`/tournaments/${id}/ready`));
        // فقط داور/مدیر می‌تواند فهرستِ در انتظار تأیید را ببیند (۴۰۳ برای بقیه → خالی)
        setPendingConf(
          isLoggedIn()
            ? await authedGet<{ matchId: string; winnerId: string; sides?: [string, string] }[]>(
                `/tournaments/${id}/pending-confirmations`,
              ).catch(() => [])
            : [],
        );
      } else {
        setReady([]);
        setPendingConf([]);
      }
      if (t.status !== 'DRAFT') setStandings(await publicGet<Standing[]>(`/tournaments/${id}/standings`));
      if (t.status === 'COMPLETED') {
        setRating(await publicGet(`/tournaments/${id}/rating`));
        if (isLoggedIn()) {
          const mine = await authedGet<{ score: number } | null>(`/tournaments/${id}/my-rating`).catch(
            () => null,
          );
          setMyScore(mine?.score ?? 0);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // چت زنده با polling (UC17)
  useEffect(() => {
    if (!id) return;
    const tick = () => publicGet<ChatMessage[]>(`/tournaments/${id}/chat`).then(setChat).catch(() => {});
    tick();
    const h = setInterval(tick, 4000);
    return () => clearInterval(h);
  }, [id]);

  async function sendChat() {
    if (!chatText.trim()) return;
    await authedPost(`/tournaments/${id}/chat`, { text: chatText });
    setChatText('');
    setChat(await publicGet<ChatMessage[]>(`/tournaments/${id}/chat`));
  }

  const nameOf = (pid: string) => rec?.participants.find((p) => p.id === pid)?.name ?? pid;

  async function act(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  if (!rec) return <main className="p-8">{error || 'در حال بارگذاری...'}</main>;

  const fmtFa: Record<string, string> = {
    SINGLE_ELIM: 'تک‌حذفی',
    DOUBLE_ELIM: 'دوحذفی',
    ROUND_ROBIN: 'دوره‌ای',
    SWISS: 'سوئیسی',
    FFA: 'Battle Royale',
  };
  const stFa: Record<string, string> = {
    DRAFT: 'پیش‌نویس',
    RUNNING: 'در حال اجرا',
    COMPLETED: 'پایان‌یافته',
    CANCELLED: 'لغوشده',
  };
  const stColor: Record<string, string> = {
    DRAFT: 'bg-slate-500/20 text-slate-300',
    RUNNING: 'bg-emerald-500/20 text-emerald-300',
    COMPLETED: 'bg-violet-500/20 text-violet-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
  };
  const startFa = rec.startAt ? new Date(rec.startAt).toLocaleString('fa-IR') : null;
  const endFa =
    rec.startAt && rec.durationHours
      ? new Date(new Date(rec.startAt).getTime() + rec.durationHours * 3600_000).toLocaleString('fa-IR')
      : null;

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-7">
      <Link href="/tournaments" className="text-sm text-fuchsia-300">
        ← همه‌ی تورنومنت‌ها
      </Link>

      <div className="card mt-3 overflow-hidden">
        <CoverBanner coverImage={rec.coverImage} game={rec.game} rounded="rounded-none" className="h-44 w-full md:h-56" />
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold">{rec.title}</h1>
              <p className="mt-1 text-sm text-slate-400">
                {rec.game ?? 'بدون بازی'} · {fmtFa[rec.format] ?? rec.format}
                {rec.organizerName && <> · سازنده: <b className="text-slate-300">{rec.organizerName}</b></>}
              </p>
            </div>
            <span className={`chip ${stColor[rec.status] ?? 'bg-slate-500/20 text-slate-300'}`}>
              {stFa[rec.status] ?? rec.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {rec.platform && <span className="chip bg-white/5 text-slate-200">🕹️ {rec.platform}</span>}
            <span className="chip bg-white/5 text-slate-200">👥 {rec.participants.length} شرکت‌کننده</span>
            {startFa && <span className="chip bg-white/5 text-slate-200">📅 شروع: {startFa}</span>}
            {rec.durationHours ? <span className="chip bg-white/5 text-slate-200">⏱️ {rec.durationHours} ساعت</span> : null}
            {endFa && <span className="chip bg-white/5 text-slate-200">🏁 پایان: {endFa}</span>}
          </div>
        </div>
      </div>
      <div className="h-4" />

      {loggedIn && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() =>
              act(async () => {
                const copy = await authedPost<{ id: string }>(`/tournaments/${id}/copy`, {});
                router.push(`/tournaments/${copy.id}`);
              })
            }
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
          >
            کپی
          </button>
          {rec.status === 'DRAFT' && (
            <>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="عنوان جدید"
                className="rounded-lg bg-slate-800 px-3 py-1.5"
              />
              <button
                onClick={() => editTitle.trim() && act(() => authedPost(`/tournaments/${id}/update`, { title: editTitle }))}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
              >
                ذخیره‌ی عنوان
              </button>
            </>
          )}
          <a href="/report" className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800">
            اعتراض / گزارش
          </a>
        </div>
      )}

      {error && <p className="mb-4 text-red-400">{error}</p>}

      {loggedIn && rec.status === 'DRAFT' && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/register`, {}))}
            className="rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-5 py-2.5 font-semibold shadow-lg shadow-fuchsia-600/25 hover:opacity-90"
          >
            ✋ ثبت‌نام من
          </button>
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/withdraw`, {}))}
            className="btn-ghost"
          >
            انصراف
          </button>
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/start`, {}))}
            className="rounded-xl bg-gradient-to-l from-emerald-600 to-teal-500 px-5 py-2.5 font-semibold shadow-lg shadow-emerald-600/25 hover:opacity-90"
          >
            🚀 شروع تورنومنت
          </button>
        </div>
      )}

      <section className="card mb-6 p-5">
        <h2 className="mb-3 font-bold">شرکت‌کنندگان ({rec.participants.length})</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rec.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <Avatar label={short(p.name)} />
              <span className="truncate text-sm" title={p.name}>
                {short(p.name)}
              </span>
            </div>
          ))}
          {rec.participants.length === 0 && <span className="text-slate-500">هنوز کسی ثبت‌نام نکرده.</span>}
        </div>
        {(rec.waitlist?.length ?? 0) > 0 && (
          <div className="mt-3 text-sm text-slate-400">
            لیست انتظار: {rec.waitlist!.map((p) => short(p.name)).join('، ')}
          </div>
        )}
      </section>

      {rec.status === 'RUNNING' && (
        <section className="mb-6">
          <h2 className="mb-2 font-bold">مسابقات آماده</h2>
          {ready.length === 0 && <p className="text-slate-500">مسابقه‌ی آماده‌ای نیست.</p>}
          <div className="flex flex-col gap-2">
            {ready.map((m) =>
              m.kind === 'DUEL' ? (
                <div key={m.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar label={short(nameOf(m.participantIds[0]))} />
                      <span className="truncate text-sm" title={nameOf(m.participantIds[0])}>
                        {short(nameOf(m.participantIds[0]))}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-extrabold text-slate-300">VS</span>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      <span className="truncate text-sm" title={nameOf(m.participantIds[1])}>
                        {short(nameOf(m.participantIds[1]))}
                      </span>
                      <Avatar label={short(nameOf(m.participantIds[1]))} />
                    </div>
                  </div>
                  {loggedIn && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-white/5 pt-3">
                      {rec.requireCheckIn && (
                        <button
                          onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/checkin`, {}))}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs hover:bg-sky-500"
                        >
                          check-in
                        </button>
                      )}
                      <span className="text-xs text-slate-400">ثبتِ برنده:</span>
                      {m.participantIds.map((pid) => (
                        <button
                          key={pid}
                          onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { winnerId: pid }))}
                          className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
                        >
                          🏆 {short(nameOf(pid))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="card flex items-center justify-between p-4">
                  <span className="text-sm">🎮 لابی ({m.participantIds.length} نفر)</span>
                  {loggedIn && (
                    <button
                      onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { rankedIds: m.participantIds }))}
                      className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-sm hover:bg-emerald-500"
                    >
                      ثبت رتبه‌بندی
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {standings.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-bold">رده‌بندی</h2>
          <div className="card overflow-hidden">
            {standings.map((s) => (
              <div key={s.participantId} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                    s.rank === 1 ? 'bg-amber-400/20 text-amber-300' : s.rank <= 3 ? 'bg-slate-400/20 text-slate-200' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                </span>
                <Avatar label={short(s.name)} />
                <span className="flex-1 truncate text-sm" title={s.name}>
                  {short(s.name)}
                </span>
                <span className="text-xs text-slate-400">🏆 {s.wins} · ✖ {s.losses}</span>
                <span className="w-12 text-left font-bold text-fuchsia-300">{s.points}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {rec.status === 'COMPLETED' && (
        <section className="mt-6 rounded-lg bg-slate-900 p-5">
          <h2 className="mb-2 font-bold">امتیاز به این مسابقه</h2>
          <p className="mb-3 text-sm text-slate-400">
            میانگین: <b className="text-amber-400">{rating.average || '—'}</b> از ۵ ({rating.count} رأی)
          </p>
          {loggedIn && (
            <div className="flex gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => act(async () => { await authedPost(`/tournaments/${id}/rate`, { score: s }); setMyScore(s); })}
                  className={`text-2xl ${s <= myScore ? 'text-amber-400' : 'text-slate-600'} hover:text-amber-300`}
                  aria-label={`${s} ستاره`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {loggedIn && pendingConf.length > 0 && (
        <section className="mt-6 rounded-lg border border-amber-700/50 bg-amber-950/20 p-4">
          <h2 className="mb-2 font-bold">نتایج در انتظار تأیید داور</h2>
          <ul className="space-y-2 text-sm">
            {pendingConf.map((p) => (
              <li key={p.matchId} className="flex items-center justify-between">
                <span>
                  {p.sides ? `${nameOf(p.sides[0])} در برابر ${nameOf(p.sides[1])} — ` : ''}
                  برنده‌ی گزارش‌شده: <b>{nameOf(p.winnerId)}</b>
                </span>
                <button
                  onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${p.matchId}/confirm`, {}))}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 hover:bg-emerald-500"
                >
                  تأیید
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rec.streamUrl && (
        <section className="mt-6">
          <h2 className="mb-2 font-bold">پخش زنده 🔴</h2>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe src={rec.streamUrl} className="h-full w-full" allowFullScreen title="stream" />
          </div>
        </section>
      )}
      {loggedIn && rec.status !== 'CANCELLED' && (
        <div className="mt-3 flex gap-2">
          <input
            value={streamInput}
            onChange={(e) => setStreamInput(e.target.value)}
            placeholder="آدرس embed استریم (Twitch/YouTube)"
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm"
          />
          <button
            onClick={() => streamInput.trim() && act(() => authedPost(`/tournaments/${id}/update`, { streamUrl: streamInput }))}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
          >
            تنظیم استریم
          </button>
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 font-bold">چت زنده</h2>
        <div className="mb-2 max-h-60 space-y-1 overflow-y-auto rounded-lg bg-slate-900 p-3 text-sm">
          {chat.map((m) => (
            <p key={m.id}>
              <b className="text-indigo-300">{m.displayName}:</b> {m.text}
            </p>
          ))}
          {chat.length === 0 && <p className="text-slate-400">هنوز پیامی نیست.</p>}
        </div>
        {loggedIn && (
          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="پیام..."
              className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            />
            <button onClick={sendChat} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
              ارسال
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
