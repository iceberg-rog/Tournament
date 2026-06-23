'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, authedGet, authedPost, isLoggedIn } from '@/lib/api';
import { publicGet } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';
import { Bracket, type BMatch } from '@/components/Bracket';
import { ShowcaseTournamentDetail } from '@/components/ShowcaseTournamentDetail';

interface Participant { id: string; name: string }
interface TournamentRecord {
  id: string; title: string; game?: string; format: string; genre: string; status: string;
  participants: Participant[]; waitlist?: Participant[]; requireCheckIn?: boolean; maxParticipants?: number;
  streamUrl?: string; platform?: string; startAt?: string; durationHours?: number; coverImage?: string;
  organizerId?: string; organizerName?: string;
}
interface ChatMessage { id: string; displayName: string; text: string }
interface ReadyMatch { id: string; kind: 'DUEL' | 'LOBBY' | 'FFA'; participantIds: string[] }
interface Standing { participantId: string; name: string; rank: number; wins: number; losses: number; points: number }
interface Me { id: string; displayName: string; role: string }

function short(name?: string): string {
  if (!name) return '—';
  const base = name.split('@')[0];
  return base.length > 16 ? base.slice(0, 16) + '…' : base;
}
function hue(s: string): number { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function Avatar({ label, size = 'h-8 w-8 text-xs' }: { label: string; size?: string }) {
  const h = hue(label);
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full font-bold text-white`} style={{ background: `linear-gradient(135deg, hsl(${h} 60% 48%), hsl(${(h + 40) % 360} 60% 34%))` }}>
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

const PATHS: Record<string, ReactNode> = {
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  pad: <><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></>,
  swords: <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M5 14l-2 2v3h3l2-2M5 13l6-6" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  gavel: <><path d="m14 13-7.5 7.5a2 2 0 0 1-3-3L11 10M14 13l3-3M14 13l-3-3M17 10l3 3M11 10 8 7m3 3 3-3M8 7l3-3 3 3-3 3z" /></>,
  cancel: <><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>,
};
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>;
}

const STAFF = ['ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN'];
const fmtFa: Record<string, string> = { SINGLE_ELIM: 'تک‌حذفی', DOUBLE_ELIM: 'دوحذفی', ROUND_ROBIN: 'دوره‌ای', SWISS: 'سوئیسی', FFA: 'Battle Royale', GROUP_STAGE: 'گروهی + پلی‌آف' };
const stFa: Record<string, string> = { DRAFT: 'پیش‌نویس', RUNNING: 'در حال اجرا', COMPLETED: 'پایان‌یافته', CANCELLED: 'لغوشده' };
const stColor: Record<string, string> = { DRAFT: 'bg-tile2 text-muted', RUNNING: 'bg-good/15 text-good', COMPLETED: 'bg-accent/15 text-[#5eead4]', CANCELLED: 'bg-bad/15 text-bad' };

export default function TournamentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  // کارت‌های نمایشیِ صفحه‌ی اصلی (lt-*) → جزئیاتِ سبک، بدونِ ۴۰۴.
  if (id.startsWith('lt-')) return <ShowcaseTournamentDetail id={id} />;
  return <DbTournamentDetail />;
}

function DbTournamentDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [rec, setRec] = useState<TournamentRecord | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState<ReadyMatch[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [bracket, setBracket] = useState<BMatch[]>([]);
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [myScore, setMyScore] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [streamInput, setStreamInput] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [pendingConf, setPendingConf] = useState<{ matchId: string; winnerId: string; sides?: [string, string] }[]>([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'bracket' | 'players' | 'matches' | 'standings' | 'chat'>('overview');
  const [selected, setSelected] = useState<Participant | null>(null);
  const [msgText, setMsgText] = useState('');
  const [drawerNote, setDrawerNote] = useState('');
  const loggedIn = isLoggedIn();

  const load = useCallback(async () => {
    try {
      const t = await publicGet<TournamentRecord>(`/tournaments/${id}`);
      setRec(t);
      if (t.status === 'RUNNING') {
        setReady(await publicGet<ReadyMatch[]>(`/tournaments/${id}/ready`));
        setPendingConf(isLoggedIn() ? await authedGet<{ matchId: string; winnerId: string; sides?: [string, string] }[]>(`/tournaments/${id}/pending-confirmations`).catch(() => []) : []);
      } else { setReady([]); setPendingConf([]); }
      if (t.status !== 'DRAFT') {
        setStandings(await publicGet<Standing[]>(`/tournaments/${id}/standings`));
        setBracket(await publicGet<BMatch[]>(`/tournaments/${id}/bracket`).catch(() => []));
      } else {
        setStandings([]);
        setBracket([]);
      }
      if (t.status === 'COMPLETED') {
        setRating(await publicGet(`/tournaments/${id}/rating`));
        if (isLoggedIn()) setMyScore((await authedGet<{ score: number } | null>(`/tournaments/${id}/my-rating`).catch(() => null))?.score ?? 0);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'خطا'); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (isLoggedIn()) apiGet<Me>('/users/me').then(setMe).catch(() => {}); }, []);
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
    try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'خطا'); }
  }
  async function kick(pid: string) {
    await act(() => authedPost(`/tournaments/${id}/participants/${pid}/remove`, {}));
    setSelected(null);
  }
  async function sendMessage(pid: string) {
    if (!msgText.trim()) return;
    setDrawerNote('');
    try { await authedPost(`/tournaments/${id}/participants/${pid}/message`, { text: msgText }); setMsgText(''); setDrawerNote('پیام ارسال شد ✓'); }
    catch (e) { setDrawerNote(e instanceof Error ? e.message : 'خطا'); }
  }
  const openPlayer = (pid: string) => {
    const p = rec?.participants.find((x) => x.id === pid);
    if (p) { setSelected(p); setMsgText(''); setDrawerNote(''); }
  };

  if (!rec) return <div className="py-16 text-center text-sm text-muted">{error || 'در حال بارگذاری...'}</div>;

  const isStaff = !!me && STAFF.includes(me.role);
  const isOrganizer = !!me && rec.organizerId === me.id;
  const canManage = isStaff || isOrganizer;
  const meId = me?.id;
  const isParticipant = !!meId && rec.participants.some((p) => p.id === meId);
  const myReady = rec.status === 'RUNNING' && meId ? ready.find((m) => m.participantIds.includes(meId)) : undefined;
  const canReportMatch = (m: ReadyMatch) => canManage || (!!meId && m.participantIds.includes(meId));
  const startFa = rec.startAt ? new Date(rec.startAt).toLocaleString('fa-IR') : null;
  const endFa = rec.startAt && rec.durationHours ? new Date(new Date(rec.startAt).getTime() + rec.durationHours * 3600_000).toLocaleString('fa-IR') : null;
  const standOf = (pid: string) => standings.find((s) => s.participantId === pid);

  const tabs: { k: typeof tab; label: string }[] = [
    { k: 'overview', label: 'نمای کلی' },
    ...(rec.status !== 'DRAFT' && rec.format !== 'FFA' ? [{ k: 'bracket' as const, label: 'جدولِ مسابقات' }] : []),
    { k: 'players', label: `شرکت‌کننده‌ها (${rec.participants.length})` },
    ...(rec.status === 'RUNNING' ? [{ k: 'matches' as const, label: 'مسابقات' }] : []),
    ...(standings.length ? [{ k: 'standings' as const, label: 'رده‌بندی' }] : []),
    { k: 'chat', label: 'گفتگو' },
  ];
  const activeTab = tabs.some((t) => t.k === tab) ? tab : 'overview';

  return (
    <div className="space-y-4">
      <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        <Icon name="back" size={15} /> همه‌ی تورنومنت‌ها
      </Link>

      {/* ===== هدرِ فشرده ===== */}
      <div className="card relative overflow-hidden">
        <CoverBanner coverImage={rec.coverImage} game={rec.game} rounded="rounded-none" className="h-36 w-full md:h-44" showName={false} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold md:text-2xl">{rec.title}</h1>
              <p className="mt-0.5 text-sm text-slate-300">{rec.game ?? 'بدون بازی'} · {fmtFa[rec.format] ?? rec.format}{rec.organizerName && <> · سازنده: <b className="text-white">{rec.organizerName}</b></>}</p>
            </div>
            <span className={`chip ${stColor[rec.status] ?? 'bg-tile2 text-muted'}`}>{stFa[rec.status] ?? rec.status}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {rec.platform && <span className="chip bg-tile2 text-slate-200"><Icon name="pad" size={13} /> {rec.platform}</span>}
        <span className="chip bg-tile2 text-slate-200"><Icon name="users" size={13} /> {rec.participants.length}{rec.maxParticipants ? ` / ${rec.maxParticipants}` : ''} نفر</span>
        {startFa && <span className="chip bg-tile2 text-slate-200"><Icon name="calendar" size={13} /> {startFa}</span>}
        {rec.durationHours ? <span className="chip bg-tile2 text-slate-200"><Icon name="clock" size={13} /> {rec.durationHours} ساعت</span> : null}
        {endFa && <span className="chip bg-tile2 text-slate-200"><Icon name="flag" size={13} /> پایان: {endFa}</span>}
      </div>

      {/* ===== وضعیتِ بیننده ===== */}
      {isParticipant ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] px-4 py-2.5 text-sm">
          <b className="text-accent">شما در این تورنومنت هستید.</b>{' '}
          {rec.status === 'RUNNING' && (myReady ? (
            <>نوبتِ شما: در برابرِ <b className="text-slate-100">{short(nameOf(myReady.participantIds.find((p) => p !== meId) ?? ''))}</b> — به تبِ «مسابقات» بروید.</>
          ) : (
            <span className="text-muted">منتظرِ مشخص‌شدنِ حریفِ بعدی…</span>
          ))}
          {rec.status === 'COMPLETED' && <span className="text-muted">تورنومنت پایان یافته — نتیجه‌ات در رده‌بندی.</span>}
        </div>
      ) : me ? (
        rec.status === 'DRAFT' ? (
          <div className="rounded-2xl border border-line bg-tile2 px-4 py-2.5 text-sm text-muted">هنوز ثبت‌نام نکرده‌اید — می‌توانید در «نمای کلی» ثبت‌نام کنید.</div>
        ) : (
          <div className="rounded-2xl border border-line bg-tile2 px-4 py-2.5 text-sm text-muted">حالتِ تماشا — شما شرکت‌کننده نیستید؛ همه‌چیز را می‌بینید ولی نمی‌توانید نتیجه ثبت کنید.</div>
        )
      ) : (
        <div className="rounded-2xl border border-line bg-tile2 px-4 py-2.5 text-sm text-muted">حالتِ تماشا (مهمان). برای شرکت یا ثبتِ نتیجه <a href="/login" className="text-accent">وارد شوید</a>.</div>
      )}

      {/* ===== نوارِ ابزارِ مدیریت ===== */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/25 bg-accent/[0.06] p-3">
          <span className="me-1 text-xs font-semibold text-accent">ابزارِ مدیریت</span>
          {rec.status === 'DRAFT' && (
            <button onClick={() => act(() => authedPost(`/tournaments/${id}/start`, {}))} className="btn-primary px-3 py-1.5 text-xs"><Icon name="play" size={14} /> شروع</button>
          )}
          {rec.status !== 'COMPLETED' && rec.status !== 'CANCELLED' && (
            <button onClick={() => { if (confirm('این تورنومنت لغو شود؟')) act(() => authedPost(`/tournaments/${id}/cancel`, {})); }} className="btn-ghost border-bad/40 px-3 py-1.5 text-xs text-bad hover:border-bad"><Icon name="cancel" size={14} /> لغوِ تورنومنت</button>
          )}
          <button onClick={() => act(async () => { const c = await authedPost<{ id: string }>(`/tournaments/${id}/copy`, {}); router.push(`/tournaments/${c.id}`); })} className="btn-ghost px-3 py-1.5 text-xs">کپی</button>
          {rec.status === 'DRAFT' && (
            <span className="flex items-center gap-1.5">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="عنوان جدید" className="w-36 rounded-lg border border-line bg-tile2 px-2.5 py-1.5 text-xs outline-none focus:border-accent-dim" />
              <button onClick={() => editTitle.trim() && act(() => authedPost(`/tournaments/${id}/update`, { title: editTitle }))} className="btn-ghost px-2.5 py-1.5 text-xs">ذخیره</button>
            </span>
          )}
        </div>
      )}

      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}

      {/* ===== تب‌ها ===== */}
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${activeTab === t.k ? 'border-accent text-white' : 'border-transparent text-muted hover:text-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      {/* ===== محتوای تب ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {loggedIn && rec.status === 'DRAFT' && (
            <div className="card p-5">
              {!isParticipant ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">نامِ نمایشیِ داخلِ مسابقه <span className="text-faint">(اختیاری)</span></label>
                    <input
                      value={inGameName}
                      onChange={(e) => setInGameName(e.target.value)}
                      maxLength={32}
                      placeholder="مثلاً PhantomGG"
                      className="w-full max-w-sm rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
                    />
                    <p className="mt-1 text-xs text-faint">اگر نمی‌خواهی نامِ اصلی یا نامِ کاربریِ عمومی‌ات در براکت دیده شود، یک نامِ نمایشی برای این تورنومنت وارد کن.</p>
                  </div>
                  <button
                    onClick={() => act(() => authedPost(`/tournaments/${id}/register`, inGameName.trim() ? { inGameName: inGameName.trim() } : {}))}
                    className="btn-primary px-5 py-2.5"
                  >
                    ثبت‌نام من
                  </button>
                </div>
              ) : (
                <button onClick={() => act(() => authedPost(`/tournaments/${id}/withdraw`, {}))} className="btn-ghost">انصراف از تورنومنت</button>
              )}
            </div>
          )}
          {rec.streamUrl && (
            <section className="card p-5">
              <div className="tile-head"><span className="tile-ic"><Icon name="play" size={15} /></span><span className="tile-title">پخش زنده</span><span className="ms-auto live-pill"><span className="dot" />زنده</span></div>
              <div className="aspect-video w-full overflow-hidden rounded-[14px] bg-black"><iframe src={rec.streamUrl} className="h-full w-full" allowFullScreen title="stream" /></div>
            </section>
          )}
          {canManage && rec.status !== 'CANCELLED' && (
            <div className="flex gap-2">
              <input value={streamInput} onChange={(e) => setStreamInput(e.target.value)} placeholder="آدرس embed استریم (Twitch/YouTube)" className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" />
              <button onClick={() => streamInput.trim() && act(() => authedPost(`/tournaments/${id}/update`, { streamUrl: streamInput }))} className="btn-ghost px-3 py-2 text-sm">تنظیم استریم</button>
            </div>
          )}
          {rec.status === 'COMPLETED' && (
            <section className="card p-5">
              <div className="tile-head"><span className="tile-ic amber"><Icon name="star" size={15} /></span><span className="tile-title">امتیاز به این مسابقه</span></div>
              <p className="mb-3 text-sm text-muted">میانگین: <b className="text-gold tnum">{rating.average || '—'}</b> از ۵ ({rating.count} رأی)</p>
              {loggedIn && (
                <div className="flex gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => act(async () => { await authedPost(`/tournaments/${id}/rate`, { score: s }); setMyScore(s); })} className={`text-2xl ${s <= myScore ? 'text-gold' : 'text-faint'} hover:text-[#fcd34d]`} aria-label={`${s} ستاره`}>★</button>
                  ))}
                </div>
              )}
            </section>
          )}
          <a href="/report" className="inline-block text-xs text-muted hover:text-accent">اعتراض / گزارشِ تخلف</a>
        </div>
      )}

      {activeTab === 'bracket' && (
        <section className="card p-5">
          <div className="tile-head"><span className="tile-ic"><Icon name="swords" size={15} /></span><span className="tile-title">جدولِ مسابقات</span><span className="ms-auto text-[11px] text-faint">روی هر بازیکن کلیک کن</span></div>
          <Bracket format={rec.format} matches={bracket} nameOf={(pid) => short(nameOf(pid))} onPlayer={openPlayer} highlightId={meId} />
        </section>
      )}

      {activeTab === 'players' && (
        <section className="card p-5">
          <div className="tile-head"><span className="tile-ic"><Icon name="users" size={15} /></span><span className="tile-title">شرکت‌کنندگان ({rec.participants.length})</span>{canManage && <span className="ms-auto text-[11px] text-faint">روی هر بازیکن کلیک کن</span>}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rec.participants.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); setMsgText(''); setDrawerNote(''); }} className="row-soft flex items-center gap-2 px-3 py-2 text-right transition hover:border-accent/40">
                <Avatar label={short(p.name)} />
                <span className="min-w-0 flex-1 truncate text-sm" title={p.name}>{short(p.name)}</span>
                {standOf(p.id) && <span className="chip bg-tile text-faint">#{standOf(p.id)!.rank}</span>}
              </button>
            ))}
            {rec.participants.length === 0 && <span className="text-faint">هنوز کسی ثبت‌نام نکرده.</span>}
          </div>
          {(rec.waitlist?.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">لیستِ انتظار</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rec.waitlist!.map((p) => (
                  <button key={p.id} onClick={() => { setSelected(p); setMsgText(''); setDrawerNote(''); }} className="row-soft flex items-center gap-2 px-3 py-2 text-right opacity-70">
                    <Avatar label={short(p.name)} /><span className="min-w-0 flex-1 truncate text-sm">{short(p.name)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'matches' && rec.status === 'RUNNING' && (
        <div className="space-y-4">
          {canManage && pendingConf.length > 0 && (
            <section className="card border-gold/30 p-5">
              <div className="tile-head"><span className="tile-ic amber"><Icon name="check" size={15} /></span><span className="tile-title">در انتظار تأیید داور</span></div>
              <ul className="space-y-2 text-sm">
                {pendingConf.map((p) => (
                  <li key={p.matchId} className="flex items-center justify-between gap-2">
                    <span>{p.sides ? `${short(nameOf(p.sides[0]))} - ${short(nameOf(p.sides[1]))} — ` : ''}برنده: <b>{short(nameOf(p.winnerId))}</b></span>
                    <button onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${p.matchId}/confirm`, {}))} className="btn-primary px-4 py-1.5 text-sm">تأیید</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card p-5">
            <div className="tile-head"><span className="tile-ic"><Icon name="swords" size={15} /></span><span className="tile-title">مسابقاتِ آماده</span></div>
            {ready.length === 0 && <p className="text-faint">مسابقه‌ی آماده‌ای نیست.</p>}
            <div className="flex flex-col gap-2">
              {ready.map((m) => m.kind === 'DUEL' ? (
                <div key={m.id} className={`rounded-[14px] border bg-tile2 p-4 ${meId && m.participantIds.includes(meId) ? 'border-accent/50 ring-1 ring-accent/30' : 'border-line'}`}>
                  {meId && m.participantIds.includes(meId) && <p className="mb-2 text-center text-[11px] font-bold text-accent">نوبتِ شما</p>}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2"><Avatar label={short(nameOf(m.participantIds[0]))} /><span className="truncate text-sm">{short(nameOf(m.participantIds[0]))}</span></div>
                    <span className="shrink-0 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-extrabold text-[#5eead4]">VS</span>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2"><span className="truncate text-sm">{short(nameOf(m.participantIds[1]))}</span><Avatar label={short(nameOf(m.participantIds[1]))} /></div>
                  </div>
                  {canReportMatch(m) && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-3">
                      {rec.requireCheckIn && <button onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/checkin`, {}))} className="btn-ghost px-3 py-1.5 text-xs">check-in</button>}
                      <span className="text-xs text-muted">ثبتِ برنده:</span>
                      {m.participantIds.map((pid) => (
                        <button key={pid} onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { winnerId: pid }))} className="btn-primary px-3 py-1.5 text-sm">{short(nameOf(pid))}</button>
                      ))}
                      {isStaff && (
                        <span className="flex items-center gap-1 border-s border-line ps-2">
                          <span className="text-[11px] text-gold">داوری:</span>
                          {m.participantIds.map((pid) => (
                            <button key={pid} onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/resolve`, { winnerId: pid }))} className="rounded-lg border border-gold/40 px-2 py-1 text-xs text-gold hover:bg-gold/10" title="تعیینِ اجباریِ برنده (no-show/اختلاف)">{short(nameOf(pid))}</button>
                          ))}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="flex items-center justify-between rounded-[14px] border border-line bg-tile2 p-4">
                  <span className="flex items-center gap-2 text-sm"><span className="text-accent"><Icon name="pad" size={16} /></span>لابی ({m.participantIds.length} نفر)</span>
                  {canReportMatch(m) && <button onClick={() => act(() => authedPost(`/tournaments/${id}/matches/${m.id}/report`, { rankedIds: m.participantIds }))} className="btn-primary px-3 py-1.5 text-sm">ثبت رتبه‌بندی</button>}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'standings' && standings.length > 0 && (
        <section className="card p-5">
          <div className="tile-head"><span className="tile-ic amber"><Icon name="list" size={15} /></span><span className="tile-title">رده‌بندی</span></div>
          <div className="overflow-hidden rounded-[14px] border border-line">
            {standings.map((s) => (
              <button key={s.participantId} onClick={() => { const p = rec.participants.find((x) => x.id === s.participantId); if (p) { setSelected(p); setMsgText(''); setDrawerNote(''); } }} className="flex w-full items-center gap-3 border-b border-line bg-tile2 px-4 py-3 text-right transition last:border-0 hover:bg-white/[.03]">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold ${s.rank === 1 ? 'bg-gold/20 text-gold' : s.rank <= 3 ? 'bg-white/10 text-slate-100' : 'bg-white/5 text-faint'}`}>{s.rank}</span>
                <Avatar label={short(s.name)} />
                <span className="flex-1 truncate text-sm">{short(s.name)}</span>
                <span className="text-xs text-muted tnum">برد {s.wins} · باخت {s.losses}</span>
                <span className="w-12 text-left font-display font-bold text-accent tnum">{s.points}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'chat' && (
        <section className="card p-5">
          <div className="tile-head"><span className="tile-ic"><Icon name="chat" size={15} /></span><span className="tile-title">گفتگوی زنده</span></div>
          <div className="mb-2 max-h-72 space-y-1 overflow-y-auto rounded-[14px] border border-line bg-tile2 p-3 text-sm">
            {chat.map((m) => <p key={m.id}><b className="text-accent">{m.displayName}:</b> {m.text}</p>)}
            {chat.length === 0 && <p className="text-muted">هنوز پیامی نیست.</p>}
          </div>
          {loggedIn && (
            <div className="flex gap-2">
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="پیام..." className="flex-1 rounded-xl border border-line bg-tile2 px-3 py-2 outline-none focus:border-accent-dim" />
              <button onClick={sendChat} className="btn-primary px-5 py-2">ارسال</button>
            </div>
          )}
        </section>
      )}

      {/* ===== پنلِ بازیکن (drawer) ===== */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col gap-4 border-e border-line bg-tile p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="tile-title">پروفایلِ بازیکن</span>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/5"><Icon name="x" size={16} /></button>
            </div>
            <div className="flex items-center gap-3">
              <Avatar label={short(selected.name)} size="h-14 w-14 text-lg" />
              <div className="min-w-0">
                <p className="truncate font-bold" title={selected.name}>{short(selected.name)}</p>
                {standOf(selected.id) ? <p className="text-xs text-muted">رتبه #{standOf(selected.id)!.rank} · برد {standOf(selected.id)!.wins} · باخت {standOf(selected.id)!.losses}</p> : <p className="text-xs text-faint">هنوز نتیجه‌ای ندارد</p>}
              </div>
            </div>

            {isStaff ? (
              <>
                <div className="rounded-xl border border-line bg-tile2 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted">پیام به این بازیکن</p>
                  <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} rows={3} placeholder="متنِ پیام..." className="w-full resize-none rounded-lg border border-line bg-tile px-3 py-2 text-sm outline-none focus:border-accent-dim" />
                  <button onClick={() => sendMessage(selected.id)} className="btn-primary mt-2 w-full py-2 text-sm"><Icon name="send" size={14} /> ارسالِ پیام</button>
                  {drawerNote && <p className={`mt-2 text-xs ${drawerNote.includes('✓') ? 'text-good' : 'text-bad'}`}>{drawerNote}</p>}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => { if (confirm(`«${short(selected.name)}» از تورنومنت حذف شود؟`)) kick(selected.id); }}
                    disabled={rec.status !== 'DRAFT'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-bad/40 py-2.5 text-sm font-semibold text-bad transition hover:bg-bad/10 disabled:opacity-40"
                  >
                    <Icon name="trash" size={15} /> حذف از تورنومنت
                  </button>
                  {rec.status !== 'DRAFT' && <p className="mt-1.5 text-center text-[11px] text-faint">حذف فقط پیش از شروعِ تورنومنت ممکن است</p>}
                </div>
              </>
            ) : (
              <p className="text-sm text-faint">برای پیام‌دادن یا حذف، دسترسیِ مدیر لازم است.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
