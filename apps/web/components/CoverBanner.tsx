const GAME_EMOJI: { label: string; emoji: string }[] = [
  { label: 'fc', emoji: '⚽' },
  { label: 'fifa', emoji: '⚽' },
  { label: 'pes', emoji: '⚽' },
  { label: 'efootball', emoji: '⚽' },
  { label: 'warzone', emoji: '🔫' },
  { label: 'call of duty', emoji: '🔫' },
  { label: 'cod', emoji: '🔫' },
  { label: 'pubg', emoji: '🪂' },
  { label: 'valorant', emoji: '🎯' },
  { label: 'counter', emoji: '🎯' },
  { label: 'cs', emoji: '🎯' },
  { label: 'apex', emoji: '🟥' },
  { label: 'fortnite', emoji: '🛠️' },
  { label: 'rocket', emoji: '🚗' },
  { label: 'clash', emoji: '⚔️' },
  { label: 'mobile legend', emoji: '🛡️' },
  { label: 'dota', emoji: '🗡️' },
  { label: 'league', emoji: '🗡️' },
];

export function gameEmoji(game?: string): string {
  const g = (game ?? '').toLowerCase();
  return GAME_EMOJI.find((x) => g.includes(x.label))?.emoji ?? '🎮';
}

function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** کاورِ تورنومنت: عکسِ داده‌شده، یا کاورِ گرادیانیِ مخصوصِ همان بازی با ایموجی. */
export function CoverBanner({
  coverImage,
  game,
  className = '',
  rounded = 'rounded-2xl',
}: {
  coverImage?: string;
  game?: string;
  className?: string;
  rounded?: string;
}) {
  const emoji = gameEmoji(game);
  if (coverImage) {
    return (
      <div
        className={`relative ${rounded} ${className} overflow-hidden bg-slate-800 bg-cover bg-center`}
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    );
  }
  const h = hueOf(game || 'game');
  return (
    <div
      className={`relative grid ${rounded} ${className} place-items-center overflow-hidden`}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${h} 65% 32%), hsl(${(h + 45) % 360} 70% 20%))`,
      }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <span className="text-4xl drop-shadow-lg md:text-5xl">{emoji}</span>
    </div>
  );
}
