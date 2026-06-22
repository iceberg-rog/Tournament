import { findGame } from '@/lib/games';

function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** کاورِ تورنومنت: عکسِ آپلودشده، یا کاورِ تایپوگرافیکِ حرفه‌ای با رنگِ برندِ بازی. */
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
  const c1 = g?.c1 || `hsl(${h} 62% 32%)`;
  const c2 = g?.c2 || `hsl(${(h + 40) % 360} 70% 16%)`;
  const name = g?.name ?? game ?? 'تورنومنت';

  return (
    <div
      className={`relative grid ${rounded} ${className} place-items-center overflow-hidden`}
      style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {/* فرم‌های هندسیِ تزئینی */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-black/25 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 16px)',
        }}
      />

      {g?.category && (
        <span className="absolute right-2 top-2 rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
          {g.category}
        </span>
      )}

      {showName && (
        <div className="relative z-10 flex h-full w-full items-center justify-center px-3">
          <span className="text-center text-base font-black uppercase leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-xl">
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
