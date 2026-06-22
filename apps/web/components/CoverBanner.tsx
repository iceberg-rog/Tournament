import { findGame } from '@/lib/games';

function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** نقشِ هنریِ SVG مخصوصِ هر ژانر (خطوطِ سفیدِ کم‌رنگ روی گرادیان). */
function GenreArt({ category }: { category?: string }) {
  const common = { stroke: '#fff', strokeOpacity: 0.13, fill: 'none', strokeWidth: 2 } as const;
  let art: React.ReactNode;
  switch (category) {
    case 'تیراندازی':
      art = (
        <g {...common}>
          <circle cx="300" cy="90" r="72" />
          <circle cx="300" cy="90" r="46" />
          <circle cx="300" cy="90" r="22" />
          <line x1="300" y1="0" x2="300" y2="200" />
          <line x1="180" y1="90" x2="420" y2="90" />
        </g>
      );
      break;
    case 'بتل‌رویال':
      art = (
        <g {...common}>
          <circle cx="320" cy="60" r="95" />
          <circle cx="320" cy="60" r="62" strokeDasharray="5 7" />
          <circle cx="320" cy="60" r="32" />
        </g>
      );
      break;
    case 'ورزشی':
      art = (
        <g {...common}>
          <circle cx="50" cy="210" r="130" />
          <circle cx="50" cy="210" r="85" />
          <path d="M0 55 Q200 10 400 70" />
          <line x1="0" y1="150" x2="400" y2="150" strokeOpacity="0.07" />
        </g>
      );
      break;
    case 'MOBA':
      art = (
        <g {...common}>
          <rect x="278" y="36" width="84" height="84" transform="rotate(45 320 78)" />
          <rect x="296" y="54" width="48" height="48" transform="rotate(45 320 78)" strokeOpacity="0.08" />
          <line x1="-20" y1="0" x2="420" y2="210" strokeOpacity="0.07" />
          <line x1="-20" y1="40" x2="380" y2="210" strokeOpacity="0.07" />
        </g>
      );
      break;
    case 'مبارزه‌ای':
      art = (
        <g {...common}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={300} y1={95} x2={300 + Math.cos(a) * 120} y2={95 + Math.sin(a) * 120} />;
          })}
          <circle cx="300" cy="95" r="26" />
        </g>
      );
      break;
    case 'مسابقه‌ای':
      art = (
        <g>
          <g {...common} strokeWidth={3}>
            <line x1="0" y1="45" x2="210" y2="45" />
            <line x1="40" y1="95" x2="280" y2="95" />
            <line x1="0" y1="145" x2="190" y2="145" />
          </g>
          <g fill="#fff" fillOpacity="0.1">
            {Array.from({ length: 16 }).map((_, i) => {
              const r = Math.floor(i / 4);
              const c = i % 4;
              return (r + c) % 2 === 0 ? <rect key={i} x={300 + c * 16} y={40 + r * 16} width="16" height="16" /> : null;
            })}
          </g>
        </g>
      );
      break;
    case 'استراتژی':
      art = (
        <g {...common} strokeOpacity={0.1}>
          {Array.from({ length: 8 }).map((_, i) => {
            const cx = 250 + (i % 4) * 50;
            const cy = 40 + Math.floor(i / 4) * 60;
            const pts = Array.from({ length: 6 }, (_, k) => {
              const a = (Math.PI / 3) * k - Math.PI / 6;
              return `${cx + Math.cos(a) * 26},${cy + Math.sin(a) * 26}`;
            }).join(' ');
            return <polygon key={i} points={pts} />;
          })}
        </g>
      );
      break;
    case 'موبایل/پارتی':
      art = (
        <g fill="#fff" fillOpacity="0.1">
          {[[320, 40, 30], [260, 110, 16], [350, 130, 22], [210, 60, 12], [300, 170, 14]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
      break;
    default:
      art = (
        <g {...common}>
          <circle cx="320" cy="70" r="80" />
          <line x1="0" y1="0" x2="400" y2="200" strokeOpacity="0.07" />
        </g>
      );
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {art}
    </svg>
  );
}

/** کاورِ تورنومنت: عکسِ آپلودشده، یا کاورِ هنریِ تولیدشده با رنگِ برندِ بازی. */
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
  const c2 = g?.c2 || `hsl(${(h + 40) % 360} 70% 15%)`;
  const name = g?.name ?? game ?? 'تورنومنت';

  return (
    <div
      className={`relative grid ${rounded} ${className} place-items-center overflow-hidden`}
      style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      <GenreArt category={g?.category} />
      {/* نورپردازی و vignette */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 60px 10px rgba(0,0,0,0.45)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />

      {g?.category && (
        <span className="absolute right-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
          {g.category}
        </span>
      )}

      {showName && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-3">
          <span className="text-center text-base font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] md:text-2xl">
            {name}
          </span>
          <span className="mt-2 h-[3px] w-10 rounded-full bg-white/70" />
        </div>
      )}
    </div>
  );
}
