'use client';

// نقشه‌ی براکتِ کامل (۷ دوره برای FC26 ۱۲۸ نفره) + فهرستِ مسابقات.
// از control board می‌خواند (۱۱۲ مسابقه‌ی واقعیِ دورهای ۱–۳ + جای‌گیرِ دورهای بعد).
// کلیک روی هر مسابقه Match Drawerِ واقعی را باز می‌کند؛ اکشن‌هایش از cr.run کار می‌کنند.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { fmt } from '@/lib/admin';
import { useAdminRole, useTournament } from '@/lib/admin/store';
import { useControlRoom } from '@/lib/admin/useControlRoom';
import { roundName, participantById, CRMATCH_FA, type CRMatch, type CRMatchStatus, type ControlRoomState } from '@/lib/admin/controlRoom';
import { MatchDetailDrawer } from '@/components/admin/cr/MatchDetailDrawer';
import { PlayerProfileDrawer } from '@/components/admin/cr/PlayerProfileDrawer';

const ISSUE: CRMatchStatus[] = ['disputed', 'expired', 'no_show', 'double_no_show', 'admin_review'];
const TONE: Record<CRMatchStatus, { dot: string; border: string; text: string }> = {
  scheduled: { dot: 'bg-slate-500', border: 'border-line', text: 'text-faint' },
  waiting_for_players: { dot: 'bg-slate-500', border: 'border-line', text: 'text-faint' },
  ready: { dot: 'bg-accent', border: 'border-accent/30', text: 'text-[#5eead4]' },
  live: { dot: 'bg-bad', border: 'border-bad/50', text: 'text-[#fca5a5]' },
  result_submitted: { dot: 'bg-gold', border: 'border-gold/40', text: 'text-gold' },
  awaiting_opponent_confirmation: { dot: 'bg-gold', border: 'border-gold/40', text: 'text-gold' },
  admin_review: { dot: 'bg-gold', border: 'border-gold/50', text: 'text-gold' },
  disputed: { dot: 'bg-bad', border: 'border-bad/50', text: 'text-[#fca5a5]' },
  completed: { dot: 'bg-good', border: 'border-line', text: 'text-good' },
  no_show: { dot: 'bg-gold', border: 'border-gold/40', text: 'text-gold' },
  double_no_show: { dot: 'bg-bad', border: 'border-bad/40', text: 'text-[#fca5a5]' },
  expired: { dot: 'bg-bad', border: 'border-bad/40', text: 'text-[#fca5a5]' },
  cancelled: { dot: 'bg-slate-600', border: 'border-line', text: 'text-faint' },
};
const fa = (n: number) => n.toLocaleString('fa-IR');

function Side({ cr, id, score, win, dim }: { cr: ControlRoomState; id: string | null; score: number; win: boolean; dim: boolean }) {
  const p = participantById(cr, id);
  return (
    <div className={`flex items-center gap-1.5 ${dim ? 'opacity-45' : ''}`}>
      <span className="h-4 w-4 flex-none rounded" style={{ background: p?.color ?? '#334155' }} />
      <span className={`min-w-0 flex-1 truncate text-[12px] ${win ? 'font-bold text-text' : 'text-slate-300'}`}>{p?.name ?? 'TBD'}</span>
      <span className={`tnum text-[12px] ${win ? 'font-bold text-good' : 'text-faint'}`}>{fmt(score)}</span>
    </div>
  );
}

function MatchCard({ cr, m, onOpen, highlight }: { cr: ControlRoomState; m: CRMatch; onOpen: (id: string) => void; highlight?: boolean }) {
  const t = TONE[m.status];
  const issue = ISSUE.includes(m.status);
  const aWin = m.winnerId === m.aId;
  const bWin = m.winnerId === m.bId;
  return (
    <button
      onClick={() => onOpen(m.id)}
      className={`w-[176px] flex-none rounded-xl border bg-tile2 p-2.5 text-right transition hover:border-accent-dim ${issue ? t.border : 'border-line'} ${highlight ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="tnum text-[10px] text-faint">#{fa(m.number)}</span>
        <span className={`inline-flex items-center gap-1 text-[10px] ${t.text}`}><span className={`h-1.5 w-1.5 rounded-full ${t.dot} ${m.status === 'live' ? 'animate-pulse' : ''}`} />{CRMATCH_FA[m.status]}</span>
      </div>
      <div className="space-y-1">
        <Side cr={cr} id={m.aId} score={m.scoreA} win={aWin} dim={bWin} />
        <Side cr={cr} id={m.bId} score={m.scoreB} win={bWin} dim={aWin} />
      </div>
    </button>
  );
}

function BracketMap({ cr, total, current, onOpen, zoom, highlightIds }: { cr: ControlRoomState; total: number; current: number; onOpen: (id: string) => void; zoom: number; highlightIds: Set<string> }) {
  const byRound = useMemo(() => {
    const map = new Map<number, CRMatch[]>();
    for (const m of cr.matches) { if (!map.has(m.round)) map.set(m.round, []); map.get(m.round)!.push(m); }
    for (const arr of map.values()) arr.sort((a, b) => a.number - b.number);
    return map;
  }, [cr.matches]);

  return (
    <div className="overflow-auto rounded-2xl border border-line bg-tile p-3">
      <div className="flex items-start gap-4" style={{ transform: `scale(${zoom})`, transformOrigin: 'top right', width: zoom < 1 ? `${100 / zoom}%` : undefined }}>
        {Array.from({ length: total }, (_, i) => i + 1).map((r) => {
          const matches = byRound.get(r);
          const generated = !!matches && matches.length > 0;
          return (
            <div key={r} className="flex w-[188px] flex-none flex-col">
              <div className={`mb-2 rounded-lg border px-2 py-1.5 text-center text-[12px] font-bold ${r === current ? 'border-accent/40 bg-accent/10 text-[#5eead4]' : 'border-line bg-tile2 text-muted'}`}>
                {roundName(cr.format, r, total)}
                <span className="ms-1 text-[10px] font-normal text-faint">({generated ? fa(matches!.length) : fa(Math.max(1, 128 / Math.pow(2, r)))})</span>
              </div>
              {generated ? (
                <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto pe-1">
                  {matches!.map((m) => <MatchCard key={m.id} cr={cr} m={m} onOpen={onOpen} highlight={highlightIds.has(m.id)} />)}
                </div>
              ) : (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line bg-tile2 p-4 text-center text-[11px] leading-5 text-faint">
                  پس از تکمیلِ {roundName(cr.format, r - 1, total)} ساخته می‌شود
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchList({ cr, total, onOpen }: { cr: ControlRoomState; total: number; onOpen: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [round, setRound] = useState<'all' | number>('all');
  const [status, setStatus] = useState<'all' | CRMatchStatus>('all');
  const [issueOnly, setIssueOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cr.matches
      .filter((m) => {
        if (round !== 'all' && m.round !== round) return false;
        if (status !== 'all' && m.status !== status) return false;
        if (issueOnly && !ISSUE.includes(m.status)) return false;
        if (term) {
          const a = participantById(cr, m.aId)?.name?.toLowerCase() ?? '';
          const b = participantById(cr, m.bId)?.name?.toLowerCase() ?? '';
          if (!`#${m.number} ${a} ${b}`.toLowerCase().includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => a.number - b.number);
  }, [cr.matches, q, round, status, issueOnly]);

  const sel = 'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';
  const statuses = Array.from(new Set(cr.matches.map((m) => m.status)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-tile p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو: شماره‌ی مسابقه یا نامِ بازیکن…" className="min-w-[200px] flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" />
        <select value={round} onChange={(e) => setRound(e.target.value === 'all' ? 'all' : Number(e.target.value))} className={sel}>
          <option value="all">همه‌ی دورها</option>
          {Array.from({ length: total }, (_, i) => i + 1).map((r) => <option key={r} value={r}>{roundName(cr.format, r, total)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | CRMatchStatus)} className={sel}>
          <option value="all">همه‌ی وضعیت‌ها</option>
          {statuses.map((s) => <option key={s} value={s}>{CRMATCH_FA[s]}</option>)}
        </select>
        <button onClick={() => setIssueOnly((v) => !v)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${issueOnly ? 'border-bad/40 bg-bad/10 text-[#fca5a5]' : 'border-line text-muted hover:text-text'}`}>فقط مشکل‌دارها</button>
        <span className="ms-auto text-xs text-faint tnum">{fa(filtered.length)} مسابقه</span>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-tile2 p-10 text-center text-sm text-faint">مسابقه‌ای با این فیلتر پیدا نشد</div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const t = TONE[m.status];
            return (
              <li key={m.id}>
                <button onClick={() => onOpen(m.id)} className={`w-full rounded-xl border bg-tile p-3 text-right transition hover:border-accent-dim ${ISSUE.includes(m.status) ? t.border : 'border-line'}`}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-faint">{roundName(cr.format, m.round, total)} · <span className="tnum">#{fa(m.number)}</span></span>
                    <span className={`inline-flex items-center gap-1 text-[11px] ${t.text}`}><span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />{CRMATCH_FA[m.status]}</span>
                  </div>
                  <Side cr={cr} id={m.aId} score={m.scoreA} win={m.winnerId === m.aId} dim={m.winnerId === m.bId} />
                  <Side cr={cr} id={m.bId} score={m.scoreB} win={m.winnerId === m.bId} dim={m.winnerId === m.aId} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FullscreenBracket({ cr, total, current, onOpen, onClose }: { cr: ControlRoomState; total: number; current: number; onOpen: (id: string) => void; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.85);
  const [q, setQ] = useState('');
  const highlightIds = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return new Set<string>();
    const ids = new Set<string>();
    for (const m of cr.matches) {
      const a = participantById(cr, m.aId)?.name?.toLowerCase() ?? '';
      const b = participantById(cr, m.bId)?.name?.toLowerCase() ?? '';
      if (`#${m.number} ${a} ${b}`.includes(term)) ids.add(m.id);
    }
    return ids;
  }, [cr.matches, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-tile p-3">
        <h3 className="font-display text-sm font-bold">نقشه‌ی کاملِ براکت</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی بازیکن…" className="w-48 rounded-lg border border-line bg-tile2 px-3 py-1.5 text-xs outline-none focus:border-accent-dim" />
        {q && <span className="text-[11px] text-accent tnum">{fa(highlightIds.size)} مسابقه</span>}
        <div className="ms-auto flex items-center gap-2">
          <span className="text-[11px] text-faint">بزرگ‌نمایی</span>
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:text-text">−</button>
          <span className="tnum w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:text-text">+</button>
          <button onClick={onClose} className="btn-ghost px-3 py-1.5 text-xs">بستن</button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-3">
        <BracketMap cr={cr} total={total} current={current} onOpen={onOpen} zoom={zoom} highlightIds={highlightIds} />
      </div>
    </div>
  );
}

function Bracket({ t, role, actorName }: { t: NonNullable<ReturnType<typeof useTournament>>; role: ReturnType<typeof useAdminRole>; actorName: string }) {
  const cr = useControlRoom(t, role, actorName);
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [full, setFull] = useState(false);
  const total = cr.cr.totalRounds || 1;
  const current = cr.cr.currentRound || 1;

  const issues = cr.cr.matches.filter((m) => ISSUE.includes(m.status)).length;
  const live = cr.cr.matches.filter((m) => m.status === 'live').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">براکت و مسابقات</h2>
          <p className="mt-0.5 text-xs text-faint">
            {fa(total)} دور · دورِ جاری {roundName(cr.cr.format, current, total)} · <span className="tnum">{fa(cr.cr.matches.length)}</span> مسابقه
            {live > 0 && <span className="text-[#fca5a5]"> · {fa(live)} زنده</span>}
            {issues > 0 && <span className="text-gold"> · {fa(issues)} مشکل‌دار</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-tile p-0.5">
            <button onClick={() => setMode('map')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${mode === 'map' ? 'bg-accent/15 text-white' : 'text-muted'}`}>نقشه‌ی براکت</button>
            <button onClick={() => setMode('list')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${mode === 'list' ? 'bg-accent/15 text-white' : 'text-muted'}`}>فهرستِ مسابقات</button>
          </div>
          <button onClick={() => setFull(true)} className="btn-ghost px-3 py-1.5 text-xs">نمایشِ تمام‌صفحه</button>
        </div>
      </div>

      {mode === 'map' ? (
        <BracketMap cr={cr.cr} total={total} current={current} onOpen={cr.openMatch} zoom={1} highlightIds={new Set()} />
      ) : (
        <MatchList cr={cr.cr} total={total} onOpen={cr.openMatch} />
      )}

      {full && <FullscreenBracket cr={cr.cr} total={total} current={current} onOpen={cr.openMatch} onClose={() => setFull(false)} />}

      <MatchDetailDrawer cr={cr.cr} matchId={cr.matchId} onClose={cr.closeDrawers} onRun={cr.run} onOpenParticipant={cr.openParticipant} />
      <PlayerProfileDrawer cr={cr.cr} participantId={cr.participantId} onClose={cr.closeDrawers} onRun={cr.run} onOpenMatch={cr.openMatch} />
    </div>
  );
}

export default function BracketPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');
  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);
  if (!t) return null;
  return <Bracket t={t} role={role} actorName={actorName} />;
}
