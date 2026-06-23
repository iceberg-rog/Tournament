'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminTournament } from '@/lib/admin';
import {
  ACTIONS_BY_STATUS,
  ACTION_LABEL,
  DANGER_ACTIONS,
  NAV_ACTIONS,
  can,
  navHref,
  type AdminRole,
  type TournamentAction,
} from '@/lib/admin/ops';
import { runAction } from '@/lib/admin/store';
import { ActionDialog, AnnouncementDialog } from '@/components/admin/dialogs';

export function TournamentRowActions({
  t,
  role,
  actorName,
  inline = 2,
  onDone,
}: {
  t: AdminTournament;
  role: AdminRole;
  actorName: string;
  inline?: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<TournamentAction | null>(null);
  const [announce, setAnnounce] = useState(false);
  const [busy, setBusy] = useState(false);

  const all = ACTIONS_BY_STATUS[t.status];
  const permitted = all.filter((a) => can(role, a));
  const inlineActions = permitted.slice(0, inline);
  const menuActions = all.filter((a) => !inlineActions.includes(a)); // بقیه (شاملِ غیرمجاز، disabled)

  function trigger(a: TournamentAction) {
    setMenu(false);
    if (!can(role, a)) return;
    if (NAV_ACTIONS.has(a)) {
      router.push(navHref(a, t));
      return;
    }
    if (a === 'send_announcement') {
      setAnnounce(true);
      return;
    }
    setDialog(a);
  }

  function confirmDialog(extra: { reason?: string }) {
    if (!dialog) return;
    setBusy(true);
    const action = dialog;
    setTimeout(() => {
      runAction(action, t, { role, actorName, reason: extra.reason });
      setBusy(false);
      setDialog(null);
      onDone?.();
    }, 350);
  }
  function confirmAnnounce(a: { title: string; body: string; target: string }) {
    setBusy(true);
    setTimeout(() => {
      runAction('send_announcement', t, { role, actorName, announcement: a });
      setBusy(false);
      setAnnounce(false);
      onDone?.();
    }, 350);
  }

  const btnCls = (a: TournamentAction) =>
    `rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
      DANGER_ACTIONS.has(a) ? 'border-bad/30 text-[#fca5a5] hover:bg-bad/10' : 'border-line text-slate-200 hover:border-accent-dim hover:text-white'
    }`;

  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {inlineActions.map((a) => (
        <button key={a} onClick={() => trigger(a)} className={btnCls(a)}>
          {ACTION_LABEL[a]}
        </button>
      ))}

      {menuActions.length > 0 && (
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} className="grid h-7 w-7 place-items-center rounded-lg border border-line text-muted hover:border-accent-dim hover:text-white" aria-label="اکشن‌های بیشتر">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
          </button>
          {menu && (
            <>
              <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} aria-hidden tabIndex={-1} />
              <div className="absolute end-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-tile2 py-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)]">
                {menuActions.map((a) => {
                  const allowed = can(role, a);
                  return (
                    <button
                      key={a}
                      onClick={() => trigger(a)}
                      disabled={!allowed}
                      title={allowed ? undefined : 'دسترسی لازم را ندارید'}
                      className={`flex w-full items-center justify-between px-3 py-2 text-right text-xs transition ${
                        allowed ? 'hover:bg-white/[.05] ' + (DANGER_ACTIONS.has(a) ? 'text-[#fca5a5]' : 'text-slate-200') : 'cursor-not-allowed text-faint'
                      }`}
                    >
                      {ACTION_LABEL[a]}
                      {!allowed && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {dialog && <ActionDialog action={dialog} tournament={t} busy={busy} onCancel={() => setDialog(null)} onConfirm={confirmDialog} />}
      {announce && <AnnouncementDialog tournament={t} busy={busy} onCancel={() => setAnnounce(false)} onConfirm={confirmAnnounce} />}
    </div>
  );
}
