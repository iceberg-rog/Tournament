import { CoverBanner } from './CoverBanner';
import { fmt, type TournamentRow, topPrize } from '@/lib/tournaments';

const Ico = ({ children, size = 13 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

/** یک خانه‌ی براکتِ مینی. */
function BrMatch({ a, b, sa, sb, win }: { a: string; b: string; sa: string; sb: string; win: 'a' | 'b' | null }) {
  const row = (name: string, score: string, w: boolean) => (
    <div className={`flex items-center justify-between gap-2 px-2 py-1 text-[10px] ${w ? 'text-white' : 'text-faint'}`}>
      <span className="truncate font-semibold">{name}</span>
      <span className={`font-display ${w ? 'text-accent' : ''}`}>{score}</span>
    </div>
  );
  return (
    <div className="overflow-hidden rounded-md border border-line bg-black/30">
      {row(a, sa, win === 'a')}
      <div className="h-px bg-line" />
      {row(b, sb, win === 'b')}
    </div>
  );
}

const MOCK: TournamentRow = {
  id: 'mock', title: 'Valorant Champions Arena', game: 'Valorant', format: 'SINGLE_ELIM', genre: 'TEAM',
  status: 'RUNNING', participants: Array.from({ length: 32 }, (_, i) => ({ id: 'p' + i })), maxParticipants: 32,
  platform: 'PC', prizePool: [{ rank: 1, amount: 50000000 }], startAt: undefined,
};

const FEED = [
  { t: 'Phantom X برد ۱۳-۹', kind: 'win' },
  { t: 'داور نتیجه را تأیید کرد', kind: 'ref' },
  { t: 'Valor GG وارد نیمه‌نهایی شد', kind: 'adv' },
];

export function HeroCommandCenterMockup({ featured }: { featured?: TournamentRow }) {
  const t = featured ?? MOCK;
  const prize = topPrize(t) ?? 50000000;
  const filled = t.participants?.length ?? 32;
  const cap = t.maxParticipants ?? 32;

  return (
    <div className="relative">
      {/* درخششِ پشتِ پنل */}
      <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-accent/20 to-gold/10 opacity-50 blur-2xl" />

      <div className="anim-float relative rounded-2xl border border-line bg-tile/85 p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl">
        {/* نوارِ بالا */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-black/30 p-2.5">
          <div className="relative h-12 w-20 flex-none overflow-hidden rounded-lg">
            <CoverBanner game={t.game} coverImage={t.coverImage} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white" dir="auto">{t.title}</p>
            <p className="text-[11px] text-faint">{t.game} · تک‌حذفی</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad/15 px-2.5 py-1 text-[10px] font-bold text-[#fca5a5]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" /> LIVE
          </span>
        </div>

        {/* بدنه: براکتِ مینی + کناری */}
        <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">
          {/* براکت */}
          <div className="rounded-xl border border-line bg-black/20 p-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-faint">براکتِ زنده</p>
            <div className="grid grid-cols-3 items-center gap-x-2 gap-y-2 text-[10px]">
              <div className="space-y-2">
                <BrMatch a="Phantom X" b="Valor GG" sa="13" sb="9" win="a" />
                <BrMatch a="Apex T" b="Cobalt" sa="16" sb="14" win="a" />
              </div>
              <div className="space-y-2">
                <BrMatch a="Phantom X" b="Apex T" sa="2" sb="1" win="a" />
              </div>
              <div>
                <div className="rounded-md border border-gold/40 bg-gold/5 p-1.5 text-center">
                  <p className="text-[9px] text-gold">فینال</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-white">Phantom X</p>
                  <p className="text-[9px] text-faint">vs Storm</p>
                </div>
              </div>
            </div>
          </div>

          {/* کناری: شمارنده‌ها + فید */}
          <div className="space-y-2.5">
            <div className="rounded-xl border border-line bg-black/20 p-2.5">
              <p className="text-[10px] text-faint">شرکت‌کننده‌ها</p>
              <p className="font-display text-lg font-bold tnum text-white">{fmt(filled)}<span className="text-xs text-faint">/{fmt(cap)}</span></p>
              <div className="pbar mt-1.5 h-1.5"><span style={{ width: `${Math.round((filled / cap) * 100)}%` }} /></div>
            </div>
            <div className="rounded-xl border border-line bg-black/20 p-2.5">
              <p className="text-[10px] text-faint">استخرِ جایزه</p>
              <p className="font-display text-lg font-bold tnum text-gold">{fmt(prize)}<span className="text-[10px] text-faint"> ت</span></p>
            </div>
            <div className="rounded-xl border border-line bg-black/20 p-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] text-faint"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> فعالیتِ زنده</p>
              <ul className="space-y-1">
                {FEED.map((f, i) => (
                  <li key={i} className="truncate text-[10px] text-slate-300"><span className="text-accent">•</span> {f.t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* چیپ‌های شناور */}
      <span className="anim-float-sm absolute -right-3 top-10 hidden rounded-xl border border-line bg-tile px-3 py-1.5 text-[11px] font-bold text-accent shadow-lg backdrop-blur sm:block" style={{ animationDelay: '.4s' }}>براکتِ خودکار</span>
      <span className="anim-float-sm absolute -left-3 top-1/2 hidden rounded-xl border border-line bg-tile px-3 py-1.5 text-[11px] font-bold text-gold shadow-lg backdrop-blur sm:block" style={{ animationDelay: '1.1s' }}>پرداختِ امن · escrow</span>
      <span className="anim-float-sm absolute -bottom-3 right-12 hidden rounded-xl border border-line bg-tile px-3 py-1.5 text-[11px] font-bold text-[#fca5a5] shadow-lg backdrop-blur sm:block" style={{ animationDelay: '.7s' }}>داوریِ فعال</span>
    </div>
  );
}
