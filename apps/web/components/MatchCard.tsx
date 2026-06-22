// کارتِ رویاروییِ تیم‌ها (VS) با هویتِ esports — سرور-کامپوننت (انیمیشن‌ها صرفاً CSS).
// استاندالون با defaultها رندر می‌شود؛ RTL-aware.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.replace(/\s+/g, '').slice(0, 2).toUpperCase() || '??';
}

function Side({
  name,
  color,
  align,
}: {
  name: string;
  color: string;
  align: 'start' | 'end';
}) {
  const crest = (
    <span
      className="grid h-9 w-9 flex-none place-items-center rounded-lg font-display text-[12px] font-bold leading-none shadow-[0_1px_0_rgba(255,255,255,.18)_inset]"
      style={{ background: color, color: '#0b0d12' }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
  const label = (
    <span className="min-w-0 truncate text-sm font-semibold text-[color:var(--text)]" dir="ltr">
      {name}
    </span>
  );
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 ${align === 'end' ? 'flex-row-reverse text-right' : 'text-left'}`}
    >
      {crest}
      {label}
    </div>
  );
}

export function MatchCard({
  a = 'Phantom X',
  b = 'Valor GG',
  sa = 13,
  sb = 9,
  live = true,
  map = 'Map 2 · Ascent',
  colorA = '#2dd4bf',
  colorB = '#fbbf24',
}: {
  a?: string;
  b?: string;
  sa?: number;
  sb?: number;
  live?: boolean;
  map?: string;
  colorA?: string;
  colorB?: string;
}) {
  const aWins = sa > sb;
  const bWins = sb > sa;

  return (
    <div className="rounded-xl border border-line bg-black/30 p-3 shadow-[var(--shadow)]">
      {/* ردیفِ رویارویی: دو سمت + چیپِ VS در مرکز */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Side name={a} color={colorA} align="start" />

        <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line2 bg-tile2 font-display text-[11px] font-bold tracking-wide text-muted">
          VS
        </span>

        <Side name={b} color={colorB} align="end" />
      </div>

      {/* امتیازها: برجسته، سمتِ برنده تیل */}
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span
          className={`font-display text-3xl font-bold leading-none tnum ${aWins ? 'text-accent' : 'text-muted'}`}
        >
          {sa}
        </span>
        <span className="font-display text-base font-bold leading-none text-faint">–</span>
        <span
          className={`text-end font-display text-3xl font-bold leading-none tnum ${bWins ? 'text-accent' : 'text-muted'}`}
        >
          {sb}
        </span>
      </div>

      {/* ردیفِ پایین: تگِ زنده + برچسبِ مپ */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-bad">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bad" />
            </span>
            LIVE
          </span>
        ) : (
          <span className="text-[11px] font-semibold tracking-wide text-faint">پایان‌یافته</span>
        )}

        <span className="truncate text-[11px] font-semibold text-gold" dir="ltr">
          {map}
        </span>
      </div>
    </div>
  );
}
