'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
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

/* ---- آیکن‌های خطی (بدون ایموجی) ---- */
const PATHS: Record<string, ReactNode> = {
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  pad: <><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  controller: <><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></>,
  swords: <><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M5 14l-2 2v3h3l2-2M5 13l6-6" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
};
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

const TileHead = ({ icon, title, amber, action }: { icon: ReactNode; title: string; amber?: boolean; action?: ReactNode }) => (
  <div className="tile-head">
    <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
    <span className="tile-title">{title}</span>
    {action && <span className="ms-auto">{action}</span>}
  </div>
);

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

  if (!rec) return <div className="py-16 text-center text-sm text-muted">{error || 'در حال بارگذاری...'}</div>;

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
    DRAFT: 'bg-tile2 text-muted',
    RUNNING: 'bg-good/15 text-good',
    COMPLETED: 'bg-accent/15 text-[#5eead4]',
    CANCELLED: 'bg-bad/15 text-bad',
  };
  const startFa = rec.startAt ? new Date(rec.startAt).toLocaleString('fa-IR') : null;
  const endFa =
    rec.startAt && rec.durationHours
      ? new Date(new Date(rec.startAt).getTime() + rec.durationHours * 3600_000).toLocaleString('fa-IR')
      : null;

  return (
    <div className="space-y-4">
      <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        <Icon name="back" size={15} />
        همه‌ی تورنومنت‌ها
      </Link>

      <div className="card overflow-hidden">
        <CoverBanner coverImage={rec.coverImage} game={rec.game} rounded="rounded-none" className="h-44 w-full md:h-56" />
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">{rec.title}</h1>
              <p className="mt-1 text-sm text-muted">
                {rec.game ?? 'بدون بازی'} · {fmtFa[rec.format] ?? rec.format}
                {rec.organizerName && <> · سازنده: <b className="text-slate-200">{rec.organizerName}</b></>}
              </p>
            </div>
            <span className={`chip ${stColor[rec.status] ?? 'bg-tile2 text-muted'}`}>
              {stFa[rec.status] ?? rec.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {rec.platform && (
              <span className="chip bg-tile2 text-slate-200"><Icon name="controller" size={13} /> {rec.platform}</span>
            )}
            <span className="chip bg-tile2 text-slate-200"><Icon name="users" size={13} /> {rec.participants.length} شرکت‌کننده</span>
            {startFa && <span className="chip bg-tile2 text-slate-200"><Icon name="calendar" size={13} /> شروع: {startFa}</span>}
            {rec.durationHours ? <span className="chip bg-tile2 text-slate-200"><Icon name="clock" size={13} /> {rec.durationHours} ساعت</span> : null}
            {endFa && <span className="chip bg-tile2 text-slate-200"><Icon name="flag" size={13} /> پایان: {endFa}</span>}
          </div>
        </div>
      </div>

      {loggedIn && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() =>
              act(async () => {
                const copy = await authedPost<{ id: string }>(`/tournaments/${id}/copy`, {});
                router.push(`/tournaments/${copy.id}`);
              })
            }
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            کپی
          </button>
          {rec.status === 'DRAFT' && (
            <>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="عنوان جدید"
                className="rounded-xl border border-line bg-tile2 px-3 py-1.5 outline-none focus:border-accent-dim"
              />
              <button
                onClick={() => editTitle.trim() && act(() => authedPost(`/tournaments/${id}/update`, { title: editTitle }))}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                ذخیره‌ی عنوان
              </button>
            </>
          )}
          <a href="/report" className="btn-ghost px-3 py-1.5 text-xs">
            اعتراض / گزارش
          </a>
        </div>
      )}

      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}

      {loggedIn && rec.status === 'DRAFT' && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/register`, {}))}
            className="btn-primary px-5 py-2.5"
          >
            ثبت‌نام من
          </button>
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/withdraw`, {}))}
            className="btn-ghost"
          >
            انصراف
          </button>
          <button
            onClick={() => act(() => authedPost(`/tournaments/${id}/start`, {}))}
            className="btn-ghost border-good/40 text-good hover:border-good"
          >
            <Icon name="play" size={16} />
            شروع تورنومنت
          </button>
        </div>
      )}

      <section className="card p-5">
        <TileHead icon={<Icon name="users" size={15} />} title={`شرکت‌کنندگان (${rec.participants.length})`} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rec.participants.map((p) => (
            <div key={p.id} className="row-soft flex items-center gap-2 px-3 py-2">
              <Avatar label={short(p.name)} />
              <span className="truncate text-sm" title={p.name}>
                {short(p.name)}
              </span>
            </div>
          ))}
          {rec.participants.length === 0 && <span className="text-faint">هنوز کسی ثبت‌نام نکرده.</span>}
        </div>
        {(rec.waitlist?.length ?? 0) > 0 && (
          <div className="mt-3 text-sm text-muted">
            لیست انتظار: {rec.waitlist!.map((p) => short(p.name)).join('، ')}
          </div>
        )}
      </section>

      {rec.status === 'RUNNING' && (
        <section className="card p-5">
          <TileHead icon={<Icon name="swords" size={15} />} title="مسابقات آماده" />
          {ready.length === 0 && <p className="text-faint">مسابقه‌ی آماده‌ای نیست.</p>}
          <div className="flex flex-col gap-2">
            {ready.map((m) =>
              m.kind === 'DUEL' ? (
                <div key={m.id} className="rounded-[14px] border border-line bg-tile2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar label={short(nameOf(m.participantIds[0]))} />
                      <span className="truncate text-sm" title={nameOf(m.participantIds[0])}>
                        {short(nameOf(m.participantIds[0]))}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-extrabold text-[#5eead4]">VS</span>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      <span className="truncate text-sm" title={nameOf(m.participantIds[1])}>
                        {short(nameOf(m.participantIds[1]))}
                      </span>
                      <Avatar label={short(nameOf(m.participantIds[1]))} />
                    </div>
                  </div>
                  {loggedIn && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-3">
                      {rec.requireCheckIn && (
                        <button
                          onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/checkin`, {}))}
                          className="btn-ghost px-3 py-1.5 text-xs"
                        >
                          check-in
                        </button>
                      )}
                      <span className="text-xs text-muted">ثبتِ برنده:</span>
                      {m.participantIds.map((pid) => (
                        <button
                          key={pid}
                          onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { winnerId: pid }))}
                          className="btn-primary px-3 py-1.5 text-sm"
                        >
                          {short(nameOf(pid))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="flex items-center justify-between rounded-[14px] border border-line bg-tile2 p-4">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-accent"><Icon name="pad" size={16} /></span>
                    لابی ({m.participantIds.length} نفر)
                  </span>
                  {loggedIn && (
                    <button
                      onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { rankedIds: m.participantIds }))}
                      className="btn-primary px-3 py-1.5 text-sm"
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
        <section className="card p-5">
          <TileHead amber icon={<Icon name="list" size={15} />} title="رده‌بندی" />
          <div className="overflow-hidden rounded-[14px] border border-line">
            {standings.map((s) => (
              <div key={s.participantId} className="flex items-center gap-3 border-b border-line bg-tile2 px-4 py-3 last:border-0">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold ${
                    s.rank === 1 ? 'bg-gold/20 text-gold' : s.rank <= 3 ? 'bg-white/10 text-slate-100' : 'bg-white/5 text-faint'
                  }`}
                >
                  {s.rank}
                </span>
                <Avatar label={short(s.name)} />
                <span className="flex-1 truncate text-sm" title={s.name}>
                  {short(s.name)}
                </span>
                <span className="text-xs text-muted tnum">برد {s.wins} · باخت {s.losses}</span>
                <span className="w-12 text-left font-display font-bold text-accent tnum">{s.points}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {rec.status === 'COMPLETED' && (
        <section className="card p-5">
          <TileHead amber icon={<Icon name="star" size={15} />} title="امتیاز به این مسابقه" />
          <p className="mb-3 text-sm text-muted">
            میانگین: <b className="text-gold tnum">{rating.average || '—'}</b> از ۵ ({rating.count} رأی)
          </p>
          {loggedIn && (
            <div className="flex gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => act(async () => { await authedPost(`/tournaments/${id}/rate`, { score: s }); setMyScore(s); })}
                  className={`text-2xl ${s <= myScore ? 'text-gold' : 'text-faint'} hover:text-[#fcd34d]`}
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
        <section className="card border-gold/30 p-5">
          <TileHead amber icon={<Icon name="check" size={15} />} title="نتایج در انتظار تأیید داور" />
          <ul className="space-y-2 text-sm">
            {pendingConf.map((p) => (
              <li key={p.matchId} className="flex items-center justify-between">
                <span>
                  {p.sides ? `${nameOf(p.sides[0])} در برابر ${nameOf(p.sides[1])} — ` : ''}
                  برنده‌ی گزارش‌شده: <b>{nameOf(p.winnerId)}</b>
                </span>
                <button
                  onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${p.matchId}/confirm`, {}))}
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  تأیید
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rec.streamUrl && (
        <section className="card p-5">
          <TileHead icon={<Icon name="play" size={15} />} title="پخش زنده" action={<span className="live-pill"><span className="dot" />زنده</span>} />
          <div className="aspect-video w-full overflow-hidden rounded-[14px] bg-black">
            <iframe src={rec.streamUrl} className="h-full w-full" allowFullScreen title="stream" />
          </div>
        </section>
      )}
      {loggedIn && rec.status !== 'CANCELLED' && (
        <div className="flex gap-2">
          <input
            value={streamInput}
            onChange={(e) => setStreamInput(e.target.value)}
            placeholder="آدرس embed استریم (Twitch/YouTube)"
            className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
          <button
            onClick={() => streamInput.trim() && act(() => authedPost(`/tournaments/${id}/update`, { streamUrl: streamInput }))}
            className="btn-ghost px-3 py-2 text-sm"
          >
            تنظیم استریم
          </button>
        </div>
      )}

      <section className="card p-5">
        <TileHead icon={<Icon name="chat" size={15} />} title="چت زنده" />
        <div className="mb-2 max-h-60 space-y-1 overflow-y-auto rounded-[14px] border border-line bg-tile2 p-3 text-sm">
          {chat.map((m) => (
            <p key={m.id}>
              <b className="text-accent">{m.displayName}:</b> {m.text}
            </p>
          ))}
          {chat.length === 0 && <p className="text-muted">هنوز پیامی نیست.</p>}
        </div>
        {loggedIn && (
          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="پیام..."
              className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 outline-none focus:border-accent-dim"
            />
            <button onClick={sendChat} className="btn-primary px-5 py-2">
              ارسال
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
