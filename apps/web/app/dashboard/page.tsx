'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, authedGet, authedPost, publicGet, isLoggedIn } from '@/lib/api';
import { Donut } from '@/components/charts';

interface Me { id: string; displayName: string; email: string; role: string }
interface Stats {
  joined: number; completed: number; wins: number; podiums: number; winRate: number;
  byGame: { game: string; played: number; wins: number }[];
  timeline: { id: string; title: string; game: string; rank: number; total: number; createdAt: string }[];
}
interface T {
  id: string; title: string; status: string; game?: string; format: string;
  maxParticipants?: number; participants?: { id: string }[];
}

const fmt = (n: number) => n.toLocaleString('fa-IR');
const formatFa: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی', DOUBLE_ELIM: 'دوحذفی', ROUND_ROBIN: 'دوره‌ای', SWISS: 'سوئیسی', FFA: 'Battle Royale',
};

const CRESTS = ['#2dd4bf', '#fbbf24', '#818cf8', '#34d399', '#f472b6', '#60a5fa', '#fb7185'];
function crestColor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CRESTS[h % CRESTS.length];
}
function Crest({ name, size = 26 }: { name: string; size?: number }) {
  const init = (name || '?').replace(/[^A-Za-z0-9؀-ۿ]/g, '').slice(0, 2).toUpperCase() || '?';
  return (
    <span className="crest" style={{ width: size, height: size, background: crestColor(name), fontSize: size * 0.42 }}>
      {init}
    </span>
  );
}

/** حلقه‌ی درصدی (مثل کاشیِ شاخص) */
function Ring({ value, color = '#fbbf24', label }: { value: number; color?: string; label: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="relative h-24 w-24 flex-none">
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#262a35" strokeWidth="10" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <span className="block font-display text-xl font-bold tnum">{value}%</span>
          <span className="block text-[9px] uppercase tracking-wider text-faint">{label}</span>
        </div>
      </div>
    </div>
  );
}

/** اسپارک‌لاینِ کوچک پایینِ کاشی */
function Spark({ values, color = '#2dd4bf' }: { values: number[]; color?: string }) {
  const vals = values.length >= 2 ? values : [0, ...values, 0];
  const max = Math.max(1, ...vals), min = Math.min(...vals);
  const span = Math.max(1, max - min);
  const n = vals.length;
  const pts = vals.map((v, i) => [(i / (n - 1)) * 200, 44 - ((v - min) / span) * 36] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const gid = `sp-${color.replace('#', '')}`;
  return (
    <svg className="spark" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L200 46 L0 46 Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/** میله‌های عمودی (بازی‌های من) */
function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((p, d, i) => (d.value > data[p].value ? i : p), 0);
  return (
    <div className="flex h-full items-end gap-2 pt-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${d.value}`}>
          <div className="flex w-full flex-1 items-end">
            <div className="w-full rounded-t-md" style={{ height: `${Math.max(6, (d.value / max) * 100)}%`, background: i === peak ? 'linear-gradient(180deg,#fbbf24,#b8861a)' : 'linear-gradient(180deg,#2dd4bf,#1b8c80)' }} />
          </div>
          <span className="max-w-full truncate text-[10px] text-faint">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const TileHead = ({ icon, title, amber, action }: { icon: React.ReactNode; title: string; amber?: boolean; action?: React.ReactNode }) => (
  <div className="tile-head">
    <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
    <span className="tile-title">{title}</span>
    {action && <span className="ms-auto">{action}</span>}
  </div>
);

const I = {
  trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v6a6 6 0 0 0 12 0V3" /><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" /></svg>,
  wallet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>,
  game: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></svg>,
  star: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" /></svg>,
  list: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  users: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>,
  bars: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></svg>,
  medal: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6" /><path d="M9 9 6 3M15 9l3-6M9 3l3 4 3-4" /></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>,
};

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tournaments, setTournaments] = useState<T[]>([]);
  const [msg, setMsg] = useState('');

  async function loadTournaments() {
    setTournaments(await publicGet<T[]>('/tournaments'));
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    (async () => {
      try { setMe(await apiGet<Me>('/users/me')); } catch {}
      try { setBalance((await authedGet<{ available: number }>('/wallet')).available); } catch {}
      try { setStats(await authedGet<Stats>('/me/stats')); } catch {}
      try { await loadTournaments(); } catch {}
    })();
  }, [router]);

  async function register(id: string) {
    setMsg('');
    try {
      await authedPost(`/tournaments/${id}/register`, {});
      await loadTournaments();
      setStats(await authedGet<Stats>('/me/stats'));
      setMsg('ثبت‌نام انجام شد ✓');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطا');
    }
  }

  const open = tournaments.filter((t) => t.status === 'DRAFT');
  const mine = me ? open.filter((t) => t.participants?.some((p) => p.id === me.id)) : [];
  const suggested = me ? open.filter((t) => !t.participants?.some((p) => p.id === me.id)) : open;

  const wins = stats?.wins ?? 0;
  const losses = Math.max(0, (stats?.completed ?? 0) - wins);
  const trend = stats ? [...stats.timeline].reverse().map((r) => (r.total ? Math.round(((r.total - r.rank + 1) / r.total) * 100) : 0)) : [];
  const byGame = (stats?.byGame ?? []).slice(0, 6).map((g) => ({ label: g.game, value: g.played }));

  // پرشدنِ ظرفیتِ یک تورنومنتِ شاخص برای کاشیِ ثبت‌نام
  const feature = [...mine, ...suggested].find((t) => (t.maxParticipants ?? 0) > 0);
  const filled = feature ? feature.participants?.length ?? 0 : 0;
  const cap = feature?.maxParticipants ?? 0;
  const pct = cap ? Math.round((filled / cap) * 100) : 0;

  return (
    <>
      {msg && <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-center text-sm text-accent">{msg}</p>}

      <section className="bento" aria-label="داشبورد">

        {/* ===== کیف پول و عملکرد (feature 2×2) ===== */}
        <article className="tile feature c2 r2">
          <TileHead amber icon={I.wallet} title="کیف پول و عملکرد" action={<span className="trend up">{stats?.winRate ?? 0}٪ برد</span>} />
          <div className="kpi-value tnum" style={{ color: '#fbbf24', fontSize: 'clamp(30px,4.4vw,46px)', marginTop: 0 }}>{balance !== null ? fmt(balance) : '—'}<span className="ms-1 align-middle text-base font-semibold text-muted">تومان</span></div>
          <p className="kpi-foot">موجودیِ قابلِ برداشت · {fmt(stats?.completed ?? 0)} مسابقهٔ تمام‌شده</p>

          <div className="mt-auto flex items-center gap-4 pt-3">
            <Ring value={stats?.winRate ?? 0} label="نرخِ برد" />
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
              {[
                { l: 'شرکت‌کرده', v: fmt(stats?.joined ?? 0) },
                { l: 'قهرمانی', v: fmt(wins), c: '#fbbf24' },
                { l: 'سکوها', v: fmt(stats?.podiums ?? 0) },
                { l: 'مسابقهٔ فعال', v: fmt(open.length) },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-[11px] text-faint">{s.l}</div>
                  <div className="font-display text-[17px] font-semibold tnum" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* ===== KPI: مسابقاتِ من ===== */}
        <article className="tile">
          <TileHead icon={I.game} title="مسابقاتِ من" />
          <div className="kpi-value tnum">{fmt(stats?.joined ?? 0)}</div>
          <div className="kpi-foot"><span className="trend up">{fmt(open.length)}</span> فعال اکنون</div>
          <Spark values={trend.length ? trend : [10, 30, 25, 50, 40, 70]} color="#2dd4bf" />
        </article>

        {/* ===== KPI: قهرمانی‌ها ===== */}
        <article className="tile">
          <TileHead amber icon={I.trophy} title="قهرمانی‌ها" />
          <div className="kpi-value tnum">{fmt(wins)}</div>
          <div className="kpi-foot"><span className="trend flat">{fmt(stats?.podiums ?? 0)}</span> بار روی سکو</div>
          <Spark values={(stats?.byGame ?? []).map((g) => g.wins).filter((x) => x >= 0).slice(0, 7).length ? (stats?.byGame ?? []).map((g) => g.wins).slice(0, 7) : [0, 1, 1, 2, 1, 3]} color="#fbbf24" />
        </article>

        {/* ===== تورنومنت‌های پیشِ‌روی من (2×2) ===== */}
        <article className="tile c2 r2">
          <TileHead icon={I.list} title="تورنومنت‌های پیشِ‌روی من" action={<a href="/tournaments" className="flex items-center gap-1 text-xs font-semibold text-accent">همه {I.arrow}</a>} />
          <div className="flex flex-col gap-2 overflow-hidden">
            {(mine.length ? mine : suggested).slice(0, 5).map((t) => (
              <a key={t.id} href={`/tournaments/${t.id}`} className="row-soft flex items-center gap-2.5 px-3 py-2.5">
                <Crest name={t.game ?? t.title} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{t.title}</span>
                  <span className="block text-[11px] text-faint">{t.game ?? '—'} · {formatFa[t.format] ?? t.format}</span>
                </span>
                <span className="chip flex-none" style={{ background: 'rgba(45,212,191,.14)', color: '#5eead4' }}>
                  {mine.some((m) => m.id === t.id) ? 'ثبت‌نام‌شده' : `${fmt(t.participants?.length ?? 0)} نفر`}
                </span>
              </a>
            ))}
            {open.length === 0 && (
              <div className="grid flex-1 place-items-center py-8 text-center text-sm text-faint">
                <span>تورنومنتِ فعالی نیست.<br /><a href="/tournaments/new" className="text-accent">یکی بساز ←</a></span>
              </div>
            )}
          </div>
        </article>

        {/* ===== ثبت‌نام (1×1) ===== */}
        <article className="tile">
          <TileHead amber icon={I.users} title="ظرفیتِ ثبت‌نام" />
          {feature ? (
            <>
              <div className="mt-auto flex items-baseline gap-2">
                <span className="font-display text-[30px] font-bold leading-none tnum">{fmt(filled)}</span>
                <span className="text-[13px] text-faint">/ {fmt(cap)} جایگاه</span>
              </div>
              <div className="pbar mt-3"><span style={{ width: `${pct}%` }} /></div>
              <div className="mt-2 flex justify-between text-[11px] text-faint"><span className="truncate">{feature.title}</span><span className="tnum">{pct}٪ پر</span></div>
            </>
          ) : (
            <div className="mt-auto"><span className="font-display text-[30px] font-bold tnum">{fmt(stats?.joined ?? 0)}</span><p className="mt-1 text-[11px] text-faint">مسابقهٔ ثبت‌نام‌شده</p></div>
          )}
        </article>

        {/* ===== بازی‌های من (1×1) ===== */}
        <article className="tile">
          <TileHead icon={I.bars} title="بازی‌های من" />
          {byGame.length ? <Bars data={byGame} /> : <div className="grid flex-1 place-items-center text-xs text-faint">هنوز بازی‌ای ثبت نشده</div>}
        </article>

        {/* ===== نتایجِ اخیر (2×2) ===== */}
        <article className="tile c2 r2">
          <TileHead icon={I.medal} title="نتایجِ اخیر" action={<a href="/tournaments" className="flex items-center gap-1 text-xs font-semibold text-accent">همه {I.arrow}</a>} />
          <div className="flex flex-col gap-0.5 overflow-hidden">
            {(stats?.timeline ?? []).slice(0, 6).map((r) => (
              <a key={r.id} href={`/tournaments/${r.id}`} className="grid grid-cols-[26px_1fr_auto] items-center gap-2.5 rounded-lg px-1.5 py-2 transition hover:bg-white/[.03]">
                <span className={`grid h-[26px] w-[26px] place-items-center rounded-md font-display text-[11px] font-bold ${r.rank === 1 ? 'bg-gold/20 text-gold' : r.rank <= 3 ? 'bg-white/10 text-slate-100' : 'bg-white/5 text-faint'}`}>{r.rank}</span>
                <span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{r.title}</span><span className="block text-[11px] text-faint">{r.game}</span></span>
                <span className="text-[11px] text-faint tnum">از {fmt(r.total)}</span>
              </a>
            ))}
            {(stats?.timeline.length ?? 0) === 0 && <div className="grid flex-1 place-items-center py-8 text-sm text-faint">هنوز نتیجه‌ای نداری.</div>}
          </div>
        </article>

        {/* ===== پیشنهاد برای تو (2×2) — ثبت‌نامِ یک‌کلیکی ===== */}
        <article className="tile c2 r2">
          <TileHead amber icon={I.star} title="پیشنهاد برای تو" action={<a href="/tournaments" className="flex items-center gap-1 text-xs font-semibold text-accent">کاوش {I.arrow}</a>} />
          <div className="flex flex-col gap-2 overflow-hidden">
            {suggested.slice(0, 5).map((t) => (
              <div key={t.id} className="row-soft flex items-center gap-2.5 px-3 py-2">
                <Crest name={t.game ?? t.title} />
                <a href={`/tournaments/${t.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{t.title}</span>
                  <span className="block text-[11px] text-faint">{t.game ?? '—'} · {formatFa[t.format] ?? t.format} · {fmt(t.participants?.length ?? 0)} نفر</span>
                </a>
                <button onClick={() => register(t.id)} className="btn-primary flex-none px-3 py-1.5 text-xs">ثبت‌نام</button>
              </div>
            ))}
            {suggested.length === 0 && <div className="grid flex-1 place-items-center py-8 text-center text-sm text-faint">پیشنهادِ جدیدی نیست.</div>}
          </div>
        </article>

        {/* ===== برد و باخت (2 wide) ===== */}
        <article className="tile c2">
          <TileHead icon={I.medal} title="برد و باخت" />
          <div className="flex flex-1 items-center gap-5">
            <Donut size={104} thickness={14} center={fmt(stats?.completed ?? 0)} segments={[{ label: 'برد', value: wins, color: '#2dd4bf' }, { label: 'باخت', value: losses, color: '#3a4150' }]} />
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> برد: <b className="num">{fmt(wins)}</b></p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#3a4150]" /> باخت: <b className="num">{fmt(losses)}</b></p>
              <p className="text-xs text-faint">سکوها: <b className="num text-slate-100">{fmt(stats?.podiums ?? 0)}</b></p>
            </div>
          </div>
        </article>

        {/* ===== روندِ جایگاه (2 wide) ===== */}
        <article className="tile c2">
          <TileHead icon={I.bars} title="روندِ جایگاه در مسابقات" />
          {trend.length ? (
            <div className="flex-1">
              <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                <defs><linearGradient id="trendg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2dd4bf" stopOpacity=".35" /><stop offset="1" stopColor="#2dd4bf" stopOpacity="0" /></linearGradient></defs>
                {(() => {
                  const pts = trend.map((v, i) => [(i / Math.max(1, trend.length - 1)) * 200, 66 - (v / 100) * 60] as const);
                  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
                  return <><path d={`${line} L200 70 L0 70 Z`} fill="url(#trendg)" /><path d={line} fill="none" stroke="#2dd4bf" strokeWidth="2" vectorEffect="non-scaling-stroke" /></>;
                })()}
              </svg>
            </div>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-faint">هنوز مسابقهٔ تمام‌شده‌ای نداری.</div>
          )}
        </article>

      </section>
    </>
  );
}
