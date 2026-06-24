'use client';

import { useState } from 'react';
import { NOSHOW_PENALTY_FA, type NoShowPenalty, type NoShowPolicy } from '@/lib/admin/controlRoom';

/**
 * تنظیماتِ سیاستِ عدمِ حضور — روی رفتارِ صفِ اقدامات اثر می‌گذارد و persist می‌شود.
 * اگر «نیازِ تأییدِ مدیر» خاموش شود، غیبت‌ها خودکار اعمال می‌شوند و از صف خارج می‌مانند.
 */
export function NoShowSettings({ policy, onChange }: { policy: NoShowPolicy; onChange: (p: NoShowPolicy) => void }) {
  const [open, setOpen] = useState(false);
  const set = <K extends keyof NoShowPolicy>(k: K, v: NoShowPolicy[K]) => onChange({ ...policy, [k]: v });

  const Toggle = ({ label, value, onToggle, hint }: { label: string; value: boolean; onToggle: () => void; hint?: string }) => (
    <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-tile2 px-3 py-2 text-right transition hover:border-accent-dim">
      <span><span className="block text-[13px] text-slate-200">{label}</span>{hint && <span className="block text-[11px] text-faint">{hint}</span>}</span>
      <span className={`relative h-5 w-9 flex-none rounded-full transition ${value ? 'bg-accent' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? 'start-0.5' : 'start-4'}`} />
      </span>
    </button>
  );

  return (
    <section className="rounded-2xl border border-line bg-tile p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.3 1a7 7 0 0 0-1.7-1L16.5 2h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.3-1a7 7 0 0 0 1.7 1L12.5 22h4l.4-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.6c.07-.33.1-.66.1-1Z" /></svg>
          </span>
          <span className="text-right">
            <span className="block font-display text-sm font-bold">سیاستِ عدمِ حضور</span>
            <span className="block text-[11px] text-faint">{policy.requireAdminApprovalForNoShow ? 'نیازِ تأییدِ مدیر · ' : 'خودکار · '}جزای: {NOSHOW_PENALTY_FA[policy.penalty]}</span>
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`text-faint transition ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <Toggle label="باختِ خودکار در صورتِ عدمِ حضور" hint="پس از پایانِ مهلت، غایب بازنده می‌شود" value={policy.autoForfeitOnNoShow} onToggle={() => set('autoForfeitOnNoShow', !policy.autoForfeitOnNoShow)} />
          <Toggle label="نیازِ تأییدِ مدیر برای عدمِ حضور" hint="اگر خاموش شود، سیستم خودکار اعمال می‌کند و در صف نمی‌آید" value={policy.requireAdminApprovalForNoShow} onToggle={() => set('requireAdminApprovalForNoShow', !policy.requireAdminApprovalForNoShow)} />
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-lg border border-line bg-tile2 px-3 py-2">
              <span className="block text-[11px] text-faint">مهلتِ ارفاق (دقیقه)</span>
              <input type="number" min={0} value={policy.noShowGraceMinutes} onChange={(e) => set('noShowGraceMinutes', Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full bg-transparent text-sm tnum text-slate-200 outline-none" />
            </label>
            <label className="rounded-lg border border-line bg-tile2 px-3 py-2">
              <span className="block text-[11px] text-faint">جزای عدمِ حضور</span>
              <select value={policy.penalty} onChange={(e) => set('penalty', e.target.value as NoShowPenalty)} className="mt-1 w-full bg-transparent text-sm text-slate-200 outline-none">
                {(Object.keys(NOSHOW_PENALTY_FA) as NoShowPenalty[]).map((p) => (<option key={p} value={p} className="bg-tile">{NOSHOW_PENALTY_FA[p]}</option>))}
              </select>
            </label>
          </div>
          <p className="text-[11px] text-faint">یادآوری‌ها: {policy.reminderSchedule.join('، ')}</p>
        </div>
      )}
    </section>
  );
}
