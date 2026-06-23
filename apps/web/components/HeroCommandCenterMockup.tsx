import { CoverBanner } from './CoverBanner';
import { MiniBracket } from './MiniBracket';
import { MatchCard } from './MatchCard';
import { LiveActivityFeed } from './LiveActivityFeed';
import { PrizeEscrowWidget } from './PrizeEscrowWidget';
import { TournamentProgress } from './TournamentProgress';
import { topPrize, type TournamentRow } from '@/lib/tournaments';
import { FEATURED_TOURNAMENT } from '@/lib/landingTournaments';

export function HeroCommandCenterMockup({ featured }: { featured?: TournamentRow }) {
  const t = featured ?? FEATURED_TOURNAMENT;
  const prize = topPrize(t) ?? 50000000;
  const filled = t.participants?.length ?? 28;
  const cap = t.maxParticipants ?? 32;
  const live = t.status === 'RUNNING';

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-accent/20 to-gold/10 opacity-50 blur-2xl" />

      <div className="anim-float relative space-y-3 rounded-2xl border border-line bg-tile/85 p-3 shadow-[0_30px_70px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl">
        {/* نوارِ بالا */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-black/30 p-2.5">
          <div className="relative h-11 w-20 flex-none overflow-hidden rounded-lg">
            <CoverBanner game={t.game} coverImage={t.coverImage} rounded="rounded-none" className="absolute inset-0 h-full w-full" showName={false} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white" dir="auto">{t.title}</p>
            <p className="text-[11px] text-faint">{t.game} · کنترلِ مسابقه توسطِ SHELTER</p>
          </div>
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad/15 px-2.5 py-1 text-[10px] font-bold text-[#fca5a5]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" /> LIVE
            </span>
          )}
        </div>

        {/* نمای کلیِ براکت */}
        <MiniBracket />

        {/* مسابقه‌ی زنده */}
        <MatchCard />

        {/* پیشرفت + escrow */}
        <div className="grid grid-cols-2 gap-3">
          <TournamentProgress filled={filled} cap={cap} status={t.status} />
          <PrizeEscrowWidget amount={prize} />
        </div>

        {/* فیدِ فعالیتِ زنده (متحرک) */}
        <LiveActivityFeed max={2} />
      </div>

      {/* چیپ‌های شناور */}
      <span className="anim-float-sm absolute -right-3 top-8 hidden rounded-xl border border-line bg-tile px-3 py-1.5 text-[11px] font-bold text-accent shadow-lg backdrop-blur lg:block" style={{ animationDelay: '.4s' }}>براکتِ رسمی</span>
      <span className="anim-float-sm absolute -left-3 bottom-24 hidden rounded-xl border border-line bg-tile px-3 py-1.5 text-[11px] font-bold text-gold shadow-lg backdrop-blur lg:block" style={{ animationDelay: '1s' }}>پرداختِ امن</span>
    </div>
  );
}
