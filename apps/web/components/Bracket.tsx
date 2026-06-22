'use client';

export interface BMatch {
  id: string;
  bracket: 'W' | 'L' | 'GF' | 'RR' | 'SW';
  round: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  loser: string | null;
  isBye: boolean;
}

function Slot({
  id,
  m,
  nameOf,
  onPlayer,
}: {
  id: string | null;
  m: BMatch;
  nameOf: (id: string) => string;
  onPlayer?: (id: string) => void;
}) {
  const isWinner = !!id && m.winner === id;
  const decided = !!m.winner;
  let label: string;
  let cls = 'text-slate-200';
  if (id) {
    label = nameOf(id);
    if (isWinner) cls = 'text-accent font-bold';
    else if (decided) cls = 'text-faint line-through';
  } else if (m.isBye) {
    label = '— استراحت —';
    cls = 'text-faint';
  } else {
    label = 'نامشخص';
    cls = 'text-faint italic';
  }
  return (
    <button
      type="button"
      disabled={!id}
      onClick={() => id && onPlayer?.(id)}
      className={`flex w-full items-center gap-1.5 px-2.5 py-1.5 text-right text-xs ${cls} ${id ? 'hover:bg-white/[.05]' : 'cursor-default'}`}
      title={id ? nameOf(id) : undefined}
    >
      {isWinner && <span className="text-accent">✓</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function MatchCard({ m, nameOf, onPlayer, highlightId }: { m: BMatch; nameOf: (id: string) => string; onPlayer?: (id: string) => void; highlightId?: string }) {
  const live = !!(m.a && m.b && !m.winner);
  const mine = !!highlightId && (m.a === highlightId || m.b === highlightId);
  return (
    <div className={`overflow-hidden rounded-lg border bg-tile2 ${mine ? 'border-accent ring-1 ring-accent/40' : live ? 'border-accent/40' : 'border-line'}`}>
      <Slot id={m.a} m={m} nameOf={nameOf} onPlayer={onPlayer} />
      <div className="h-px bg-line" />
      <Slot id={m.b} m={m} nameOf={nameOf} onPlayer={onPlayer} />
    </div>
  );
}

function elimTitle(round: number, maxRound: number): string {
  const fromEnd = maxRound - round;
  if (fromEnd === 0) return 'فینال';
  if (fromEnd === 1) return 'نیمه‌نهایی';
  if (fromEnd === 2) return 'یک‌چهارم‌نهایی';
  return `دور ${round}`;
}

function Columns({
  matches,
  nameOf,
  onPlayer,
  titleFn,
  highlightId,
}: {
  matches: BMatch[];
  nameOf: (id: string) => string;
  onPlayer?: (id: string) => void;
  titleFn: (round: number, maxRound: number) => string;
  highlightId?: string;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {rounds.map((r) => {
        const ms = matches.filter((m) => m.round === r);
        return (
          <div key={r} className="flex min-w-[160px] flex-col gap-3">
            <p className="rounded-md bg-tile py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-faint">
              {titleFn(r, maxRound)} <span className="text-faint/70">· {ms.length}</span>
            </p>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {ms.map((m) => (
                <MatchCard key={m.id} m={m} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** جدولِ درختیِ مسابقات (براکت/گروه) بسته به فرمت. */
export function Bracket({
  format,
  matches,
  nameOf,
  onPlayer,
  highlightId,
}: {
  format: string;
  matches: BMatch[];
  nameOf: (id: string) => string;
  onPlayer?: (id: string) => void;
  highlightId?: string;
}) {
  if (!matches.length) return <p className="text-sm text-faint">جدولی برای نمایش نیست.</p>;

  if (format === 'DOUBLE_ELIM') {
    const groups: { title: string; b: BMatch['bracket'] }[] = [
      { title: 'براکتِ برندگان', b: 'W' },
      { title: 'براکتِ بازندگان', b: 'L' },
      { title: 'فینالِ بزرگ', b: 'GF' },
    ];
    return (
      <div className="space-y-5">
        {groups.map((g) => {
          const ms = matches.filter((m) => m.bracket === g.b);
          if (!ms.length) return null;
          return (
            <div key={g.b}>
              <p className="mb-2 text-sm font-bold text-accent">{g.title}</p>
              <Columns matches={ms} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} titleFn={g.b === 'GF' ? () => 'فینال' : elimTitle} />
            </div>
          );
        })}
      </div>
    );
  }

  if (format === 'SINGLE_ELIM') {
    return <Columns matches={matches} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} titleFn={elimTitle} />;
  }

  // ROUND_ROBIN / SWISS — دورهای مسابقات (گروهِ همه‌باهمه)
  return <Columns matches={matches} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} titleFn={(r) => `دور ${r}`} />;
}
