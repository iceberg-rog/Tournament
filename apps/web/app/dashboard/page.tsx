'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, authedGet, authedPost, publicGet, isLoggedIn } from '@/lib/api';
import { AreaChart, BarChart, Donut, RadialProgress } from '@/components/charts';

interface Me {
  id: string;
  displayName: string;
  email: string;
  role: string;
}
interface Stats {
  joined: number;
  completed: number;
  wins: number;
  podiums: number;
  winRate: number;
  byGame: { game: string; played: number; wins: number }[];
  timeline: { id: string; title: string; game: string; rank: number; total: number; createdAt: string }[];
}
interface T {
  id: string;
  title: string;
  status: string;
  game?: string;
  format: string;
  participants?: { id: string }[];
}

const fmt = (n: number) => n.toLocaleString('fa-IR');
const formatFa: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی',
  DOUBLE_ELIM: 'دوحذفی',
  ROUND_ROBIN: 'دوره‌ای',
  SWISS: 'سوئیسی',
  FFA: 'Battle Royale',
};

function Section({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold">
          <span>{icon}</span> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

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
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('accessToken') ?? '';
    (async () => {
      try {
        setMe(await apiGet<Me>('/users/me', token));
      } catch {}
      try {
        setBalance((await authedGet<{ available: number }>('/wallet')).available);
      } catch {}
      try {
        setStats(await authedGet<Stats>('/me/stats'));
      } catch {}
      try {
        await loadTournaments();
      } catch {}
    })();
  }, [router]);

  async function register(id: string) {
    setMsg('');
    try {
      await authedPost(`/tournaments/${id}/register`, {});
      await loadTournaments();
      setStats(await authedGet<Stats>('/me/stats'));
      setMsg('ثبت‌نام انجام شد ✅');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطا');
    }
  }

  const draft = tournaments.filter((t) => t.status === 'DRAFT');
  const upcoming = me ? draft.filter((t) => t.participants?.some((p) => p.id === me.id)) : [];
  const suggested = me ? draft.filter((t) => !t.participants?.some((p) => p.id === me.id)) : draft;

  const wins = stats?.wins ?? 0;
  const losses = Math.max(0, (stats?.completed ?? 0) - wins);
  const trend = stats ? [...stats.timeline].reverse().map((r) => (r.total ? Math.round(((r.total - r.rank + 1) / r.total) * 100) : 0)) : [];

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-7">
      <h2 className="mb-6 text-center text-2xl font-extrabold">
        خوش آمدی، {me?.displayName ?? '...'} <span>👋</span>
      </h2>
      {msg && <p className="mb-4 text-center text-sm text-emerald-400">{msg}</p>}

      {/* stat cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { v: `${balance !== null ? fmt(balance) : '—'}`, l: 'کیف پول (تومان)', i: '💳', t: 'bg-teal-400/15 text-teal-300' },
          { v: fmt(stats?.joined ?? 0), l: 'مسابقاتِ شرکت‌کرده', i: '🎮', t: 'bg-violet-400/15 text-violet-300' },
          { v: fmt(wins), l: 'قهرمانی‌ها', i: '🏆', t: 'bg-amber-400/15 text-amber-300' },
          { v: `${stats?.winRate ?? 0}%`, l: 'نرخ برد', i: '📈', t: 'bg-emerald-400/15 text-emerald-300' },
        ].map((s) => (
          <div key={s.l} className="card flex items-center justify-between p-5">
            <div className="min-w-0">
              <p className="text-2xl font-extrabold">{s.v}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{s.l}</p>
            </div>
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${s.t}`}>{s.i}</span>
          </div>
        ))}
      </section>

      {/* charts */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center p-6">
          <p className="mb-3 self-start text-sm font-semibold text-slate-300">نرخ برد</p>
          <RadialProgress value={stats?.winRate ?? 0} label="از مسابقاتِ تمام‌شده" />
        </div>
        <div className="card flex items-center gap-5 p-6">
          <Donut
            size={130}
            center={fmt(stats?.completed ?? 0)}
            segments={[
              { label: 'برد', value: wins, color: '#34d399' },
              { label: 'باخت', value: losses, color: '#475569' },
            ]}
          />
          <div className="space-y-2 text-sm">
            <p className="mb-2 font-semibold text-slate-300">برد / باخت</p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-400" /> برد: {fmt(wins)}
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-slate-500" /> باخت: {fmt(losses)}
            </p>
            <p className="text-xs text-slate-400">سکوها: {fmt(stats?.podiums ?? 0)} 🥉</p>
          </div>
        </div>
        <div className="card p-6">
          <p className="mb-6 text-sm font-semibold text-slate-300">بازی‌های انجام‌شده</p>
          <BarChart data={(stats?.byGame ?? []).slice(0, 5).map((g) => ({ label: g.game, value: g.played }))} height={130} />
        </div>
      </section>

      {/* trend */}
      <Section title="روند عملکرد (جایگاه در مسابقات)" icon="📊">
        <div className="card p-6">
          {trend.length ? (
            <AreaChart values={trend} max={100} height={130} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">هنوز مسابقه‌ی تمام‌شده‌ای نداری.</p>
          )}
        </div>
      </Section>

      {/* upcoming */}
      <Section title="تورنومنت‌های پیشِ‌روی من" icon="📅">
        <div className="grid gap-3 md:grid-cols-2">
          {upcoming.map((t) => (
            <a key={t.id} href={`/tournaments/${t.id}`} className="card flex items-center justify-between p-4 hover:bg-slate-900/80">
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-slate-400">{t.game ?? '—'} · {formatFa[t.format] ?? t.format}</p>
              </div>
              <span className="chip bg-emerald-500/20 text-emerald-300">ثبت‌نام‌شده</span>
            </a>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-slate-500">در تورنومنتِ پیشِ‌رویی ثبت‌نام نکرده‌ای.</p>}
        </div>
      </Section>

      {/* suggested — one-click register */}
      <Section title="پیشنهاد برای تو" icon="✨" action={<a href="/tournaments" className="text-xs text-fuchsia-300 hover:underline">همه</a>}>
        <div className="grid gap-3 md:grid-cols-2">
          {suggested.slice(0, 6).map((t) => (
            <div key={t.id} className="card flex items-center justify-between gap-3 p-4">
              <a href={`/tournaments/${t.id}`} className="min-w-0">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="text-xs text-slate-400">
                  {t.game ?? '—'} · {formatFa[t.format] ?? t.format} · 👥 {fmt(t.participants?.length ?? 0)}
                </p>
              </a>
              <button
                onClick={() => register(t.id)}
                className="shrink-0 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-600/25 hover:opacity-90"
              >
                ثبت‌نام
              </button>
            </div>
          ))}
          {suggested.length === 0 && (
            <p className="text-sm text-slate-500">
              تورنومنتِ بازی نیست.{' '}
              <a href="/tournaments/new" className="text-fuchsia-300">
                یکی بساز
              </a>
            </p>
          )}
        </div>
      </Section>

      {/* recent results */}
      {stats && stats.timeline.length > 0 && (
        <Section title="نتایج اخیر" icon="📜">
          <div className="card divide-y divide-white/5 overflow-hidden">
            {stats.timeline.map((r) => (
              <a key={r.id} href={`/tournaments/${r.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                      r.rank === 1
                        ? 'bg-amber-400/20 text-amber-300'
                        : r.rank <= 3
                          ? 'bg-slate-400/20 text-slate-200'
                          : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {r.rank === 1 ? '🥇' : `#${r.rank}`}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="text-xs text-slate-400">{r.game}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  رتبه {fmt(r.rank)} از {fmt(r.total)}
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}
