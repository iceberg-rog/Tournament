// براکتِ فشرده اما واقعی‌نما: تک‌حذفی، سه راند، RTL (راندِ اول سمتِ راست).
// خودبسنده و illustrative؛ token-driven، بدونِ emoji. آیکونِ خطی اینلاین.

type Side = { name: string; score: number; win: boolean; champ?: boolean };
type Match = { top: Side; bottom: Side; live?: boolean };

const QUARTER: Match[] = [
  { top: { name: 'Phantom X', score: 2, win: true }, bottom: { name: 'Cobalt', score: 1, win: false } },
  { top: { name: 'Valor GG', score: 0, win: false }, bottom: { name: 'Apex T', score: 2, win: true } },
  { top: { name: 'Nebula', score: 2, win: true }, bottom: { name: 'Storm', score: 0, win: false } },
  { top: { name: 'Cobalt', score: 2, win: true }, bottom: { name: 'Valor GG', score: 1, win: false } },
];

const SEMI: Match[] = [
  { top: { name: 'Phantom X', score: 2, win: true }, bottom: { name: 'Apex T', score: 1, win: false } },
  { live: true, top: { name: 'Nebula', score: 1, win: false }, bottom: { name: 'Cobalt', score: 1, win: false } },
];

const FINAL: Match = {
  top: { name: 'Phantom X', score: 3, win: true, champ: true },
  bottom: { name: '—', score: 0, win: false },
};

const ROUNDS = [
  { label: 'یک‌چهارم', matches: QUARTER },
  { label: 'نیمه‌نهایی', matches: SEMI },
] as const;

function TrophyIco() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3v6a6 6 0 0 0 12 0V3" />
      <path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function TeamRow({ s, champ = false }: { s: Side; champ?: boolean }) {
  const nameTone = champ ? 'text-gold' : s.win ? 'text-white' : 'text-faint';
  const scoreTone = champ ? 'text-gold' : s.win ? 'text-accent' : 'text-faint';
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1">
      <span className="flex min-w-0 items-center gap-1.5">
        {champ && (
          <span className="text-gold">
            <TrophyIco />
          </span>
        )}
        <span className={`truncate text-[11px] font-semibold ${nameTone}`} dir="ltr">
          {s.name}
        </span>
      </span>
      <span className={`tnum shrink-0 font-display text-[11px] font-bold ${scoreTone}`}>{s.score}</span>
    </div>
  );
}

function MatchNode({ m }: { m: Match }) {
  const base = 'relative w-full overflow-hidden rounded-md border bg-black/30 divide-y divide-line/70';
  const tone = m.live ? 'border-accent/45 anim-float-sm' : 'border-line';
  return (
    <div className={`${base} ${tone}`}>
      {m.live && (
        <>
          <span
            className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-accent/30"
            aria-hidden="true"
          />
          <span className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded-full bg-bad/15 px-1.5 py-0.5">
            <span className="dot" />
            <span className="text-[8px] font-bold leading-none text-bad">زنده</span>
          </span>
        </>
      )}
      <TeamRow s={m.top} />
      <TeamRow s={m.bottom} />
    </div>
  );
}

/** خطوطِ اتصالِ بینِ دو راند (RTL: ورودی از راست، خروجی به چپ). */
function Connectors({ pairs }: { pairs: number }) {
  return (
    <div className="flex w-5 shrink-0 flex-col" aria-hidden="true">
      {Array.from({ length: pairs }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 100" preserveAspectRatio="none" className="w-5 flex-1 text-line2" fill="none" stroke="currentColor" strokeWidth={1.5}>
          {/* دو شاخهٔ ورودی از راست که در وسط به هم می‌رسند و یک شاخه به چپ می‌رود */}
          <path d="M20 25 H10 V50 H0" />
          <path d="M20 75 H10 V50" />
        </svg>
      ))}
    </div>
  );
}

export function MiniBracket({ className = '' }: { className?: string }) {
  return (
    <div
      dir="rtl"
      className={`rounded-2xl border border-line bg-tile p-4 ${className}`}
      role="img"
      aria-label="نمونه‌براکتِ تک‌حذفی: یک‌چهارم، نیمه‌نهایی و فینال"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-accent" aria-hidden="true">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h6v14H4M14 9h6M10 12h4M14 15h6" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">براکتِ تک‌حذفی</span>
      </div>

      <div className="flex items-stretch">
        {ROUNDS.map((round, ri) => (
          <div key={round.label} className="flex items-stretch">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="mb-2 text-center text-[9.5px] font-bold uppercase tracking-wider text-faint">{round.label}</span>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {round.matches.map((m, mi) => (
                  <MatchNode key={mi} m={m} />
                ))}
              </div>
            </div>
            <div className="flex flex-col self-stretch pt-[18px]">
              {/* اتصال به راندِ بعد؛ تعدادِ جفت = نیمی از مسابقاتِ این راند */}
              <Connectors pairs={Math.max(1, round.matches.length / 2)} />
            </div>
            {ri < ROUNDS.length - 1 && <div className="w-1" />}
          </div>
        ))}

        {/* فینال + قهرمانِ طلایی */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="mb-2 text-center text-[9.5px] font-bold uppercase tracking-wider text-gold/80">فینال</span>
          <div className="flex flex-1 flex-col justify-center">
            <div className="relative overflow-hidden rounded-md border border-gold/40 bg-gold/[0.07] divide-y divide-gold/15 shadow-[0_0_22px_-10px_rgba(251,191,36,.7)]">
              <span className="pointer-events-none absolute inset-x-0 -top-6 h-12 bg-gold/15 blur-xl" aria-hidden="true" />
              <TeamRow s={FINAL.top} champ />
              <TeamRow s={FINAL.bottom} />
            </div>
            <span className="mt-2 flex items-center justify-center gap-1 text-[9px] font-semibold text-gold/80">
              <TrophyIco />
              قهرمان
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
