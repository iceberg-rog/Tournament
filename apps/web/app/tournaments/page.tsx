'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, publicGet } from '@/lib/api';
import { CoverBanner } from '@/components/CoverBanner';

interface TournamentRow {
  id: string;
  title: string;
  game?: string;
  format: string;
  genre: string;
  status: string;
  participants: { id: string }[];
  platform?: string;
  coverImage?: string;
  organizerName?: string;
  startAt?: string;
}
interface GameCard {
  game: string;
  total: number;
}

const STATUS: Record<string, string[]> = {
  upcoming: ['DRAFT'],
  running: ['RUNNING'],
  finished: ['COMPLETED', 'CANCELLED'],
};
const TABS = [
  ['upcoming', 'پیش‌رو'],
  ['running', 'در حال انجام'],
  ['finished', 'اتمام‌یافته'],
] as const;
const fmtFa: Record<string, string> = {
  SINGLE_ELIM: 'تک‌حذفی',
  DOUBLE_ELIM: 'دوحذفی',
  ROUND_ROBIN: 'دوره‌ای',
  SWISS: 'سوئیسی',
  FFA: 'Battle Royale',
  GROUP_STAGE: 'گروهی + پلی‌آف',
};
const stFa: Record<string, string> = { DRAFT: 'پیش‌نویس', RUNNING: 'در حال اجرا', COMPLETED: 'پایان‌یافته', CANCELLED: 'لغوشده' };
const stColor: Record<string, string> = {
  DRAFT: 'bg-accent/15 text-[#5eead4]',
  RUNNING: 'bg-good/15 text-good',
  COMPLETED: 'bg-gold/15 text-gold',
  CANCELLED: 'bg-bad/15 text-bad',
};
const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  pad: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r="1" /><circle cx="18" cy="13" r="1" /><rect x="2" y="6" width="20" height="12" rx="4" /></svg>,
  users: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6" /></svg>,
  calendar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>,
};

export default function TournamentsPage() {
  const [list, setList] = useState<TournamentRow[]>([]);
  const [games, setGames] = useState<GameCard[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'running' | 'finished'>('upcoming');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setList(await publicGet<TournamentRow[]>('/tournaments'));
        setGames(await publicGet<GameCard[]>('/tournaments/games'));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا');
      }
    })();
    // اگر از هابِ دیسیپلین‌ها با ?game= آمده‌ایم، همان بازی را فیلتر کن
    const g = new URLSearchParams(window.location.search).get('game');
    if (g) setSelectedGame(g);
  }, []);

  const filtered = list.filter((t) => STATUS[tab].includes(t.status) && (!selectedGame || t.game === selectedGame));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[clamp(18px,2.2vw,22px)] font-semibold">تورنومنت‌ها</h2>
        {isLoggedIn() && (
          <Link href="/tournaments/new" className="btn-primary">
            {I.plus}
            <span>ساخت تورنومنت</span>
          </Link>
        )}
      </div>
      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>}

      {/* discipline header (وقتی از هابِ بازی‌ها آمده‌ایم) */}
      {selectedGame && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-tile p-3">
          <CoverBanner game={selectedGame} rounded="rounded-xl" className="h-14 w-24 shrink-0" showName={false} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-faint">دیسیپلین</p>
            <p className="truncate font-bold">{selectedGame}</p>
          </div>
          <Link href="/games" className="shrink-0 text-sm font-semibold text-accent">همه‌ی دیسیپلین‌ها</Link>
        </div>
      )}

      {/* فیلترِ بصریِ بازی‌ها (تامنیلِ کاورِ واقعی) */}
      {games.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setSelectedGame(null)}
            className={`grid h-[60px] w-20 place-items-center rounded-xl border text-xs font-bold transition ${selectedGame === null ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-tile2 text-muted hover:text-text'}`}
          >
            <span className="text-center leading-tight">همه‌ی<br />بازی‌ها</span>
          </button>
          {games.map((g) => (
            <button
              key={g.game}
              onClick={() => setSelectedGame(g.game)}
              title={g.game}
              className={`group relative h-[60px] w-28 overflow-hidden rounded-xl border transition hover:-translate-y-0.5 ${selectedGame === g.game ? 'border-accent ring-2 ring-accent/40' : 'border-line hover:border-line2'}`}
            >
              <CoverBanner game={g.game} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
              <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/10" />
              <span className="absolute left-1 top-1 rounded bg-accent px-1.5 text-[10px] font-bold text-[#06231f] tnum">{fmt(g.total)}</span>
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-bold text-white" dir="ltr">
                {g.game}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* status tabs */}
      <div className="inline-flex gap-1 rounded-2xl border border-line bg-tile p-1">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm transition ${tab === k ? 'bg-gradient-to-l from-accent to-accent-dim font-semibold text-[#06231f]' : 'text-muted hover:text-text'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Link key={t.id} href={`/tournaments/${t.id}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/30">
            <CoverBanner coverImage={t.coverImage} game={t.game} rounded="rounded-none" className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-bold">{t.title}</h3>
                <span className={`chip shrink-0 ${stColor[t.status] ?? 'bg-tile2 text-muted'}`}>{stFa[t.status] ?? t.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {t.game ?? 'بدون بازی'} · {fmtFa[t.format] ?? t.format}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {t.platform && <span className="chip bg-tile2 text-muted">{I.pad} {t.platform}</span>}
                <span className="chip bg-tile2 text-muted">{I.users} <span className="tnum">{fmt(t.participants.length)}</span></span>
                {t.startAt && <span className="chip bg-tile2 text-muted">{I.calendar} <span className="tnum">{new Date(t.startAt).toLocaleDateString('fa-IR')}</span></span>}
              </div>
              {t.organizerName && <p className="mt-2 text-[11px] text-faint">سازنده: {t.organizerName}</p>}
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-16 text-center text-faint">
          موردی در این بخش نیست.{' '}
          {isLoggedIn() && (
            <Link href="/tournaments/new" className="text-accent">
              یکی بساز
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
