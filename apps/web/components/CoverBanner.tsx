import { findGame } from '@/lib/games';

function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** کاورِ تورنومنت: عکسِ داده‌شده، یا کاورِ طراحی‌شده با رنگِ برندِ بازی + آیکون + اسم. */
export function CoverBanner({
  coverImage,
  game,
  className = '',
  rounded = 'rounded-2xl',
  showName = true,
}: {
  coverImage?: string;
  game?: string;
  className?: string;
  rounded?: string;
  showName?: boolean;
}) {
  if (coverImage) {
    return (
      <div
        className={`relative ${rounded} ${className} overflow-hidden bg-slate-800 bg-cover bg-center`}
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {showName && game && (
          <span className="absolute bottom-2 right-3 text-sm font-bold text-white drop-shadow">{game}</span>
        )}
      </div>
    );
  }

  const g = findGame(game);
  const h = hueOf(game || 'game');
  const c1 = g?.c1 ?? `hsl(${h} 65% 34%)`;
  const c2 = g?.c2 ?? `hsl(${(h + 45) % 360} 70% 18%)`;
  const emoji = g?.emoji ?? '🎮';
  const name = g?.name ?? game;

  return (
    <div
      className={`relative grid ${rounded} ${className} place-items-center overflow-hidden`}
      style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 120%, rgba(255,255,255,0.25), transparent 45%)' }} />
      {g?.category && (
        <span className="absolute right-2 top-2 rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
          {g.category}
        </span>
      )}
      <div className="z-10 flex flex-col items-center px-2 text-center">
        <span className="text-4xl drop-shadow-lg md:text-5xl">{emoji}</span>
        {showName && name && (
          <span className="mt-1 line-clamp-1 max-w-full text-sm font-extrabold text-white drop-shadow md:text-base">{name}</span>
        )}
      </div>
    </div>
  );
}
