import { findGame } from '@/lib/games';

function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** نقشِ هنریِ SVG مخصوصِ هر ژانر. */
function GenreArt({ category }: { category?: string }) {
  const s = { stroke: '#fff', strokeOpacity: 0.2, fill: 'none', strokeWidth: 2.5 } as const;
  let art: React.ReactNode;
  switch (category) {
    case 'تیراندازی':
      art = (
        <g {...s}>
          <circle cx="305" cy="80" r="74" />
          <circle cx="305" cy="80" r="48" />
          <circle cx="305" cy="80" r="22" />
          <line x1="305" y1="-10" x2="305" y2="170" />
          <line x1="185" y1="80" x2="425" y2="80" />
        </g>
      );
      break;
    case 'بتل‌رویال':
      art = (
        <g {...s}>
          <circle cx="320" cy="55" r="98" />
          <circle cx="320" cy="55" r="64" strokeDasharray="6 8" />
          <circle cx="320" cy="55" r="32" />
        </g>
      );
      break;
    case 'ورزشی':
      art = (
        <g {...s}>
          <circle cx="40" cy="200" r="135" />
          <circle cx="40" cy="200" r="90" />
          <path d="M0 45 Q210 0 410 60" />
        </g>
      );
      break;
    case 'MOBA':
      art = (
        <g {...s}>
          <rect x="276" y="22" width="92" height="92" transform="rotate(45 322 68)" />
          <rect x="296" y="42" width="52" height="52" transform="rotate(45 322 68)" strokeOpacity="0.12" />
          <line x1="-20" y1="-10" x2="430" y2="210" strokeOpacity="0.1" />
        </g>
      );
      break;
    case 'مبارزه‌ای':
      art = (
        <g {...s}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={305} y1={80} x2={305 + Math.cos(a) * 130} y2={80 + Math.sin(a) * 130} />;
          })}
          <circle cx="305" cy="80" r="26" />
        </g>
      );
      break;
    case 'مسابقه‌ای':
      art = (
        <g>
          <g {...s} strokeWidth={3.5}>
            <line x1="0" y1="35" x2="220" y2="35" />
            <line x1="50" y1="85" x2="300" y2="85" />
            <line x1="0" y1="135" x2="200" y2="135" />
          </g>
          <g fill="#fff" fillOpacity="0.14">
            {Array.from({ length: 16 }).map((_, i) => {
              const r = Math.floor(i / 4);
              const c = i % 4;
              return (r + c) % 2 === 0 ? <rect key={i} x={305 + c * 18} y={25 + r * 18} width="18" height="18" /> : null;
            })}
          </g>
        </g>
      );
      break;
    case 'استراتژی':
      art = (
        <g {...s} strokeOpacity={0.16}>
          {Array.from({ length: 8 }).map((_, i) => {
            const cx = 255 + (i % 4) * 52;
            const cy = 35 + Math.floor(i / 4) * 62;
            const pts = Array.from({ length: 6 }, (_, k) => {
              const a = (Math.PI / 3) * k - Math.PI / 6;
              return `${cx + Math.cos(a) * 28},${cy + Math.sin(a) * 28}`;
            }).join(' ');
            return <polygon key={i} points={pts} />;
          })}
        </g>
      );
      break;
    case 'موبایل/پارتی':
      art = (
        <g fill="#fff" fillOpacity="0.14">
          {[[325, 35, 32], [255, 105, 18], [355, 125, 24], [205, 55, 13], [300, 165, 15]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
      break;
    default:
      art = (
        <g {...s}>
          <circle cx="320" cy="60" r="85" />
          <line x1="-10" y1="-10" x2="410" y2="210" strokeOpacity="0.1" />
        </g>
      );
  }
  return (
    <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      {art}
    </svg>
  );
}

/** کاورِ تورنومنت: عکسِ آپلودشده، یا کاورِ هنریِ تولیدشده با ترکیب‌بندیِ تایلِ واقعی. */
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
  const g = findGame(game);
  const name = g?.name ?? game ?? 'تورنومنت';
  // عکسِ آپلودیِ کاربر، یا کاورِ واقعیِ لوکالِ بازی (در صورت وجود)
  const realImage = coverImage || g?.image;

  if (realImage) {
    return (
      <div className={`relative ${rounded} ${className} overflow-hidden bg-slate-800 bg-cover bg-center`} style={{ backgroundImage: `url(${realImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {showName && (
          <span className="absolute bottom-2.5 left-3 text-sm font-extrabold text-white drop-shadow" dir="ltr">
            {game}
          </span>
        )}
      </div>
    );
  }

  const h = hueOf(game || 'game');
  const c1 = g?.c1 || `hsl(${h} 62% 32%)`;
  const c2 = g?.c2 || `hsl(${(h + 40) % 360} 70% 14%)`;

  return (
    <div className={`relative ${rounded} ${className} overflow-hidden`} style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      <GenreArt category={g?.category} />
      {/* درخشش و سایه */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 50px 8px rgba(0,0,0,0.4)' }} />
      {/* اسکریمِ پایین برای خوانایی اسم */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {g?.category && (
        <span className="absolute right-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
          {g.category}
        </span>
      )}

      {showName && (
        <div className="absolute inset-x-3 bottom-2.5" dir="ltr">
          <span className="block text-base font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-lg">
            {name}
          </span>
          <span className="mt-1.5 block h-[3px] w-9 rounded-full bg-gradient-to-l from-white to-white/40" />
        </div>
      )}
    </div>
  );
}
