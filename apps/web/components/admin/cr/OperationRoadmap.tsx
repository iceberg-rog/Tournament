'use client';

import type { RoadmapState, RoadmapStep, ControlRoomState } from '@/lib/admin/controlRoom';

const STATE: Record<RoadmapState, { ring: string; bg: string; text: string; badge: string; line: string; label: string }> = {
  completed: { ring: 'border-accent/50', bg: 'bg-accent/15', text: 'text-accent', badge: 'text-accent', line: 'bg-accent/40', label: 'انجام‌شده' },
  current: { ring: 'border-accent shadow-[0_0_0_4px_rgba(45,212,191,.15)]', bg: 'bg-accent/20', text: 'text-accent', badge: 'text-[#5eead4]', line: 'bg-line', label: 'جاری' },
  blocked: { ring: 'border-bad', bg: 'bg-bad/15', text: 'text-bad', badge: 'text-[#fca5a5]', line: 'bg-line', label: 'مسدود' },
  warning: { ring: 'border-gold/60', bg: 'bg-gold/15', text: 'text-gold', badge: 'text-gold', line: 'bg-line', label: 'هشدار' },
  pending_admin: { ring: 'border-gold/60', bg: 'bg-gold/15', text: 'text-gold', badge: 'text-gold', line: 'bg-line', label: 'نیازِ اقدام' },
  upcoming: { ring: 'border-line', bg: 'bg-tile2', text: 'text-faint', badge: 'text-faint', line: 'bg-line', label: 'بعدی' },
  locked: { ring: 'border-line border-dashed', bg: 'bg-tile2', text: 'text-faint', badge: 'text-faint', line: 'bg-line', label: 'قفل' },
};

const KIND_ICON: Record<string, string> = {
  registration: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  check_in: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5L16 9"/>',
  bracket: '<path d="M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6"/><circle cx="6" cy="3" r="0"/><path d="M4 5h4M4 19h4M16 19h4"/>',
  round: '<path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M5 21h14M9 21v-3a3 3 0 0 1 6 0v3"/>',
  verify: '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4V3h6v1M9 12l2 2 4-4"/>',
  payout: '<path d="M6 9h12l-1 11H7L6 9Z"/><path d="M9 9a3 3 0 1 1 6 0"/>',
};

function Lock() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
}
function Check() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}

export function OperationRoadmap({ cr, activeKey, onSelect }: { cr: ControlRoomState; activeKey?: string | null; onSelect?: (step: RoadmapStep) => void }) {
  const steps = cr.roadmap;
  return (
    <section className="rounded-2xl border border-line bg-tile p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">روندِ تورنومنت</h2>
        <span className="text-[11px] text-faint">برای جزئیاتِ هر مرحله رویش بزن</span>
      </div>

      <div className="hscroll flex items-start gap-0 pb-1">
        {steps.map((s, i) => {
          const st = STATE[s.state];
          const active = activeKey === s.key;
          const last = i === steps.length - 1;
          return (
            <div key={s.key} className="flex min-w-[96px] flex-1 flex-col items-center">
              {/* node + connector */}
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : STATE[steps[i - 1].state].line}`} />
                <button
                  onClick={() => onSelect?.(s)}
                  className={`relative grid h-11 w-11 flex-none place-items-center rounded-2xl border-2 transition ${st.ring} ${st.bg} ${st.text} ${active ? 'scale-110 ring-2 ring-white/20' : 'hover:scale-105'} ${s.state === 'current' ? 'animate-pulse' : ''}`}
                  title={s.label}
                  aria-current={active ? 'true' : undefined}
                >
                  {s.state === 'completed' ? <Check /> : s.state === 'locked' ? <Lock /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: KIND_ICON[s.kind] ?? KIND_ICON.round }} />}
                  {s.needsAction && <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-bad ring-2 ring-tile" />}
                </button>
                <span className={`h-0.5 flex-1 ${last ? 'opacity-0' : st.line}`} />
              </div>

              {/* label + badge */}
              <button onClick={() => onSelect?.(s)} className="mt-1.5 flex flex-col items-center px-1 text-center">
                <span className={`line-clamp-1 text-[11.5px] font-semibold ${s.state === 'upcoming' || s.state === 'locked' ? 'text-faint' : 'text-slate-200'}`}>{s.label}</span>
                {s.badge && <span className={`mt-0.5 line-clamp-1 text-[10px] ${st.badge}`}>{s.badge}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
