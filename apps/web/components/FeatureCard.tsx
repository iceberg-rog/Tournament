import type { FeatureDef } from '@/lib/landing';
import { MiniBracketVisual } from './MiniBracketVisual';
import { EscrowVisual } from './EscrowVisual';
import { ChatVisual } from './ChatVisual';
import { ReportFlowVisual } from './ReportFlowVisual';
import { LeaderboardVisual } from './LeaderboardVisual';
import { PlatformChipsVisual } from './PlatformChipsVisual';

/** نگاشتِ نوعِ ویژوال به کامپوننتِ میکروِ مربوطه. */
function Visual({ kind }: { kind: FeatureDef['visual'] }) {
  switch (kind) {
    case 'bracket':
      return <MiniBracketVisual />;
    case 'escrow':
      return <EscrowVisual />;
    case 'chat':
      return <ChatVisual />;
    case 'report':
      return <ReportFlowVisual />;
    case 'leaderboard':
      return <LeaderboardVisual />;
    case 'platform':
      return <PlatformChipsVisual />;
  }
}

/** کارتِ یک ویژگی: ویژوالِ میکرو در بالا + عنوان و توضیح. هم‌ارتفاع، با hover lift و درخششِ درونی. */
export function FeatureCard({ f }: { f: FeatureDef }) {
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-line bg-tile p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,.8)] transition duration-200 hover:-translate-y-1 hover:border-accent/40">
      {/* ناحیه‌ی ویژوال (~۱۱۰px) با درخششِ درونیِ ملایم */}
      <div className="relative h-[110px] overflow-hidden rounded-xl border border-line bg-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120px_80px_at_85%_0,rgba(45,212,191,.10),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Visual kind={f.visual} />
      </div>

      <h3 className="mt-4 font-display text-base font-bold leading-7 text-white line-clamp-2">{f.title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{f.desc}</p>
    </div>
  );
}
