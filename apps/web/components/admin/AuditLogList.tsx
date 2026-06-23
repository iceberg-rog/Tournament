'use client';

import { ADMIN_ROLE_FA, type AdminRole } from '@/lib/admin/ops';
import { useAuditLog } from '@/lib/admin/store';
import type { AuditEntry } from '@/lib/admin';

const fa = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 10);
  }
};
const roleFa = (r: string) => ADMIN_ROLE_FA[r as AdminRole] ?? r;

export function AuditLogList({ entityId, limit, entries }: { entityId?: string; limit?: number; entries?: AuditEntry[] }) {
  const all = useAuditLog();
  let list = entries ?? all;
  if (entityId) list = list.filter((e) => e.entityId === entityId);
  if (limit) list = list.slice(0, limit);

  if (!list.length) return <p className="py-6 text-center text-xs text-faint">رویدادی ثبت نشده است.</p>;

  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li key={e.id} className="flex items-start gap-3 rounded-lg border border-line bg-tile2 px-3 py-2 text-xs">
          <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md bg-accent/10 text-accent">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-slate-200">
              <span className="font-semibold">{e.actor}</span>
              <span className="text-faint"> ({roleFa(e.actorRole)}) · </span>
              {e.action}
            </p>
            <p className="mt-0.5 text-faint">
              {e.entityType}:{e.entityId}
              {e.reason ? ` · «${e.reason}»` : ''}
            </p>
          </div>
          <span className="flex-none whitespace-nowrap text-faint">{fa(e.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
