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
  group?: number;
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

/** جدولِ گروه‌ها (مرحله‌ی گروهی): رتبه‌بندیِ هر گروه از روی نتایجِ مسابقات. */
function GroupTables({
  matches,
  nameOf,
  onPlayer,
  highlightId,
  qualifiers,
}: {
  matches: BMatch[];
  nameOf: (id: string) => string;
  onPlayer?: (id: string) => void;
  highlightId?: string;
  qualifiers: Set<string>;
}) {
  const groups = [...new Set(matches.map((m) => m.group ?? 0))].sort((a, b) => a - b);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const gm = matches.filter((m) => (m.group ?? 0) === g);
        const ids = new Set<string>();
        gm.forEach((m) => {
          if (m.a) ids.add(m.a);
          if (m.b) ids.add(m.b);
        });
        const wl = new Map<string, { w: number; l: number }>();
        ids.forEach((id) => wl.set(id, { w: 0, l: 0 }));
        gm.forEach((m) => {
          if (m.winner) {
            wl.get(m.winner)!.w++;
            const loser = m.winner === m.a ? m.b : m.a;
            if (loser) wl.get(loser)!.l++;
          }
        });
        const rows = [...ids]
          .map((id) => ({ id, w: wl.get(id)!.w, l: wl.get(id)!.l, pts: wl.get(id)!.w * 3 }))
          .sort((a, b) => b.pts - a.pts || b.w - a.w);
        return (
          <div key={g} className="rounded-xl border border-line bg-tile2 p-3">
            <p className="mb-2 text-xs font-bold text-accent">گروه {String.fromCharCode(65 + g)}</p>
            <div className="space-y-0.5">
              {rows.map((r, i) => {
                const q = qualifiers.has(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => onPlayer?.(r.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition hover:bg-white/[.05] ${r.id === highlightId ? 'ring-1 ring-accent/40' : ''}`}
                  >
                    <span className={`w-4 text-center font-bold ${q ? 'text-accent' : 'text-faint'}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-right" title={nameOf(r.id)}>{nameOf(r.id)}</span>
                    <span className="text-faint tnum">{r.w}-{r.l}</span>
                    <span className="w-6 text-left font-display font-bold text-accent tnum">{r.pts}</span>
                  </button>
                );
              })}
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

  if (format === 'GROUP_STAGE') {
    const groupM = matches.filter((m) => m.bracket === 'RR');
    const playoffM = matches.filter((m) => m.bracket !== 'RR');
    const qualifiers = new Set<string>();
    playoffM.forEach((m) => {
      if (m.a) qualifiers.add(m.a);
      if (m.b) qualifiers.add(m.b);
    });
    return (
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-bold text-accent">مرحله‌ی گروهی</p>
          <GroupTables matches={groupM} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} qualifiers={qualifiers} />
          <p className="mt-2 text-[11px] text-faint">نفراتِ سبزرنگ به پلی‌آف صعود می‌کنند.</p>
        </div>
        {playoffM.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-bold text-accent">پلی‌آف (حذفی)</p>
            <Columns matches={playoffM} nameOf={nameOf} onPlayer={onPlayer} highlightId={highlightId} titleFn={elimTitle} />
          </div>
        ) : (
          <p className="text-sm text-faint">پلی‌آف پس از پایانِ مرحله‌ی گروهی مشخص می‌شود.</p>
        )}
      </div>
    );
  }

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
