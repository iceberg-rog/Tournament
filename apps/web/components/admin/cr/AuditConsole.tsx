'use client';

// گزارشِ ممیزیِ اتاقِ کنترل — فقط اقدام‌های حساس، با before/after، فیلتر، detail
// drawer و خروجیِ CSV. از core.auditLog (persisted) می‌خواند — جدا از activity.

import { useMemo, useState } from 'react';
import type { ControlRoomState, CRAuditEntry } from '@/lib/admin/controlRoom';
import { Drawer } from '@/components/admin/cr/Drawer';

const clock = (iso?: string) => { try { return iso ? new Date(iso).toLocaleString('fa-IR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; } catch { return '—'; } };

function Diff({ before, after }: { before?: string; after?: string }) {
  if (!before && !after) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-bad/25 bg-bad/[.05] p-2"><p className="text-[10px] text-faint">پیش از</p><p className="mt-0.5 text-[12px] text-[#fca5a5]">{before ?? '—'}</p></div>
      <div className="rounded-lg border border-good/25 bg-good/[.05] p-2"><p className="text-[10px] text-faint">پس از</p><p className="mt-0.5 text-[12px] text-good">{after ?? '—'}</p></div>
    </div>
  );
}

export function AuditConsole({ cr }: { cr: ControlRoomState }) {
  const all = cr.auditLog ?? [];
  const [actor, setActor] = useState('all');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<CRAuditEntry | null>(null);

  const actors = useMemo(() => Array.from(new Set(all.map((e) => e.actor))), [all]);
  const actions = useMemo(() => Array.from(new Set(all.map((e) => e.action))), [all]);
  const entities = useMemo(() => Array.from(new Set(all.map((e) => e.entityType))), [all]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((e) => {
      if (actor !== 'all' && e.actor !== actor) return false;
      if (action !== 'all' && e.action !== action) return false;
      if (entity !== 'all' && e.entityType !== entity) return false;
      if (term && !`${e.action} ${e.entityType} ${e.entityId} ${e.reason ?? ''} ${e.before ?? ''} ${e.after ?? ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [all, actor, action, entity, q]);

  function exportCsv() {
    const head = ['createdAt', 'actor', 'role', 'action', 'entityType', 'entityId', 'reason', 'before', 'after'];
    const rows = filtered.map((e) => [e.createdAt, e.actor, e.actorRole, e.action, e.entityType, e.entityId, e.reason ?? '', e.before ?? '', e.after ?? ''].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${cr.tournamentId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const sel2 = 'rounded-lg border border-line bg-tile2 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-accent-dim';

  return (
    <section className="rounded-2xl border border-line bg-tile p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold">گزارشِ ممیزی</h2>
          <p className="text-[11px] text-faint">اقدام‌های حساس با تغییرِ قبل/بعد — جدا از فعالیت.</p>
        </div>
        <button onClick={exportCsv} disabled={!filtered.length} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40">خروجیِ CSV</button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو…" className="min-w-[160px] flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim" />
        <select value={actor} onChange={(e) => setActor(e.target.value)} className={sel2}><option value="all">همه‌ی مدیران</option>{actors.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={sel2}><option value="all">همه‌ی اقدام‌ها</option>{actions.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className={sel2}><option value="all">همه‌ی موجودیت‌ها</option>{entities.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        <span className="ms-auto text-xs text-faint tnum">{filtered.length.toLocaleString('fa-IR')} رکورد</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-tile2 p-8 text-center text-sm text-faint">
          {all.length === 0 ? 'هنوز اقدامِ حساسی ثبت نشده؛ با حلِ اختلاف، ویرایشِ امتیاز، ثبتِ عدمِ حضور یا محرومیت اینجا پر می‌شود.' : 'رکوردی با این فیلتر پیدا نشد.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <button onClick={() => setSel(e)} className="block w-full rounded-xl border border-line bg-tile2 p-3 text-right transition hover:border-accent-dim">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-text">{e.action}</span>
                  <span className="text-[11px] text-faint">{clock(e.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-faint">{e.actor} ({e.actorRole}) · {e.entityType}:{e.entityId}{e.reason ? ` · «${e.reason}»` : ''}</p>
                {(e.before || e.after) && <div className="mt-2"><Diff before={e.before} after={e.after} /></div>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!sel} onClose={() => setSel(null)} width={460}
        title={sel ? <span className="font-display text-base font-bold">{sel.action}</span> : ''}
        subtitle={sel ? clock(sel.createdAt) : ''}
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-tile2 p-2.5"><p className="text-[11px] text-faint">مدیر</p><p className="mt-0.5">{sel.actor}</p></div>
              <div className="rounded-lg border border-line bg-tile2 p-2.5"><p className="text-[11px] text-faint">نقش</p><p className="mt-0.5">{sel.actorRole}</p></div>
              <div className="rounded-lg border border-line bg-tile2 p-2.5"><p className="text-[11px] text-faint">موجودیت</p><p className="mt-0.5">{sel.entityType}</p></div>
              <div className="rounded-lg border border-line bg-tile2 p-2.5"><p className="text-[11px] text-faint">شناسه</p><p className="mt-0.5 break-all tnum">{sel.entityId}</p></div>
            </div>
            {sel.reason && <div className="rounded-lg border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">دلیل</p><p className="mt-0.5">{sel.reason}</p></div>}
            <div><p className="mb-1.5 text-xs font-semibold text-muted">تغییرِ وضعیت (before / after)</p><Diff before={sel.before} after={sel.after} />{!sel.before && !sel.after && <p className="text-[12px] text-faint">برای این اقدام before/after ثبت نشده.</p>}</div>
          </div>
        )}
      </Drawer>
    </section>
  );
}
