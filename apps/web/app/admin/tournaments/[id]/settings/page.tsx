'use client';

// تنظیماتِ عملیاتیِ تورنومنت — همه‌ی سیاست‌ها، persisted (useOpsSlice).
// no-show و progression روی رفتارِ اتاقِ کنترل اثرِ واقعی دارند (نشانِ «اثرگذار»).

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTournament } from '@/lib/admin/store';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { CHAT_POLICY_FA, type ChatPolicy } from '@/lib/admin/tournamentOps';
import { NOSHOW_PENALTY_FA, type NoShowPenalty } from '@/lib/admin/controlRoom';
import { defaultOperationalSettings, mergeSettings, type OperationalSettings } from '@/lib/admin/opsSettings';

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-tile2 px-3 py-2.5 text-right transition hover:border-accent-dim">
      <span><span className="block text-[13px] text-slate-200">{label}</span>{hint && <span className="block text-[11px] text-faint">{hint}</span>}</span>
      <span className={`relative h-5 w-9 flex-none rounded-full transition ${value ? 'bg-accent' : 'bg-slate-600'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? 'start-0.5' : 'start-4'}`} /></span>
    </button>
  );
}
function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="block rounded-lg border border-line bg-tile2 px-3 py-2.5">
      <span className="block text-[11px] text-faint">{label}{suffix ? ` (${suffix})` : ''}</span>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className="mt-0.5 w-full bg-transparent text-sm tnum text-slate-200 outline-none" />
    </label>
  );
}
function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="block rounded-lg border border-line bg-tile2 px-3 py-2.5">
      <span className="block text-[11px] text-faint">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="mt-0.5 w-full bg-transparent text-sm text-slate-200 outline-none">
        {options.map((o) => <option key={o.v} value={o.v} className="bg-tile">{o.l}</option>)}
      </select>
    </label>
  );
}
function Section({ title, live, children }: { title: string; live?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-tile p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="font-display text-sm font-bold">{title}</h3>
        {live && <span className="chip border border-good/30 bg-good/10 text-good">اثرگذار بر رفتار</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const fallback = useMemo(() => defaultOperationalSettings(id), [id]);
  const [raw, setRaw] = useOpsSlice<OperationalSettings>(id, 'operational-settings', fallback);
  const s = useMemo(() => mergeSettings(raw, id), [raw, id]);
  const set = <K extends keyof OperationalSettings>(k: K, v: OperationalSettings[K]) => setRaw({ ...s, [k]: v });

  if (!t) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold">تنظیماتِ عملیاتی</h2>
        <p className="mt-0.5 text-xs text-faint">سیاست‌های اجرای تورنومنت. تغییرات بلافاصله ذخیره و پس از refresh حفظ می‌شوند.</p>
      </div>

      <Section title="چک‌این">
        <Toggle label="چک‌این الزامی است" value={s.checkIn.requireCheckIn} onChange={(v) => set('checkIn', { ...s.checkIn, requireCheckIn: v })} />
        <NumField label="پنجره‌ی چک‌این" suffix="دقیقه" value={s.checkIn.checkInWindowMinutes} onChange={(v) => set('checkIn', { ...s.checkIn, checkInWindowMinutes: v })} />
      </Section>

      <Section title="عدمِ حضور" live>
        <Toggle label="باختِ خودکار در صورتِ عدمِ حضور" value={s.noShow.autoForfeitOnNoShow} onChange={(v) => set('noShow', { ...s.noShow, autoForfeitOnNoShow: v })} />
        <Toggle label="نیازِ تأییدِ مدیر برای عدمِ حضور" hint="خاموش = خودکار اعمال، در صفِ دستی نمی‌آید" value={s.noShow.requireAdminApprovalForNoShow} onChange={(v) => set('noShow', { ...s.noShow, requireAdminApprovalForNoShow: v })} />
        <NumField label="مهلتِ ارفاق" suffix="دقیقه" value={s.noShow.noShowGraceMinutes} onChange={(v) => set('noShow', { ...s.noShow, noShowGraceMinutes: v })} />
        <Sel label="جزای عدمِ حضور" value={s.noShow.penalty} options={(Object.keys(NOSHOW_PENALTY_FA) as NoShowPenalty[]).map((p) => ({ v: p, l: NOSHOW_PENALTY_FA[p] }))} onChange={(v) => set('noShow', { ...s.noShow, penalty: v })} />
      </Section>

      <Section title="نتیجه">
        <NumField label="مهلتِ ثبتِ نتیجه" suffix="دقیقه" value={s.result.resultSubmissionDeadlineMinutes} onChange={(v) => set('result', { ...s.result, resultSubmissionDeadlineMinutes: v })} />
        <Toggle label="تأییدِ حریف لازم است" value={s.result.opponentConfirmationRequired} onChange={(v) => set('result', { ...s.result, opponentConfirmationRequired: v })} />
        <Toggle label="مدرک الزامی است" value={s.result.evidenceRequired} onChange={(v) => set('result', { ...s.result, evidenceRequired: v })} />
        <Toggle label="تأییدِ خودکار اگر هر دو موافق‌اند" value={s.result.autoApproveIfBothAgree} onChange={(v) => set('result', { ...s.result, autoApproveIfBothAgree: v })} />
        <Toggle label="بازبینیِ مدیر در تعارض" value={s.result.adminReviewOnConflict} onChange={(v) => set('result', { ...s.result, adminReviewOnConflict: v })} />
      </Section>

      <Section title="اختلاف">
        <NumField label="پنجره‌ی اعتراض" suffix="دقیقه" value={s.dispute.disputeWindowMinutes} onChange={(v) => set('dispute', { ...s.dispute, disputeWindowMinutes: v })} />
        <Toggle label="قفلِ دورِ بعد در صورتِ اختلاف" value={s.dispute.lockNextRoundOnDispute} onChange={(v) => set('dispute', { ...s.dispute, lockNextRoundOnDispute: v })} />
        <Toggle label="قفلِ پرداخت در صورتِ اختلاف" value={s.dispute.lockPayoutOnDispute} onChange={(v) => set('dispute', { ...s.dispute, lockPayoutOnDispute: v })} />
      </Section>

      <Section title="پیشروی (auto-start)" live>
        <Toggle label="ساختِ خودکارِ دورِ بعد" value={s.progression.autoGenerateNextRound} onChange={(v) => set('progression', { ...s.progression, autoGenerateNextRound: v })} />
        <Toggle label="شروعِ خودکارِ دورِ بعد وقتی آماده شد" value={s.progression.autoStartNextRoundWhenReady} onChange={(v) => set('progression', { ...s.progression, autoStartNextRoundWhenReady: v })} />
        <Toggle label="اعمالِ خودکارِ BYE" value={s.progression.applyByeAutomatically} onChange={(v) => set('progression', { ...s.progression, applyByeAutomatically: v })} />
        <Toggle label="نیازِ تأییدِ مدیر برای دورِ بعد" value={s.progression.requireAdminApprovalForNextRound} onChange={(v) => set('progression', { ...s.progression, requireAdminApprovalForNextRound: v })} />
      </Section>

      <Section title="اعلان‌ها">
        {(['in_app', 'chat', 'email', 'sms', 'push'] as const).map((ch) => (
          <Toggle key={ch} label={`کانال: ${ch === 'in_app' ? 'درون‌برنامه' : ch === 'chat' ? 'چت' : ch === 'email' ? 'ایمیل' : ch === 'sms' ? 'پیامک' : 'Push'}`} value={s.notifications.channels[ch]} onChange={(v) => set('notifications', { ...s.notifications, channels: { ...s.notifications.channels, [ch]: v } })} />
        ))}
        <p className="sm:col-span-2 text-[11px] text-faint">برنامه‌ی یادآوری: {s.notifications.reminderSchedule.join(' · ')}</p>
      </Section>

      <Section title="چت">
        <Sel label="سیاستِ چت" value={s.chat.policy} options={(Object.keys(CHAT_POLICY_FA) as ChatPolicy[]).map((p) => ({ v: p, l: CHAT_POLICY_FA[p] }))} onChange={(v) => set('chat', { ...s.chat, policy: v })} />
        <Toggle label="حالتِ آهسته" value={s.chat.slowMode} onChange={(v) => set('chat', { ...s.chat, slowMode: v })} />
        <Toggle label="قفلِ چت" value={s.chat.locked} onChange={(v) => set('chat', { ...s.chat, locked: v })} />
      </Section>

      <Section title="استریم">
        <Toggle label="استریم فعال است" value={s.streaming.streamEnabled} onChange={(v) => set('streaming', { ...s.streaming, streamEnabled: v })} />
        <Toggle label="صفحه‌ی پخشِ عمومی" value={s.streaming.publicLivePage} onChange={(v) => set('streaming', { ...s.streaming, publicLivePage: v })} />
        <Toggle label="ضبطِ VOD" value={s.streaming.recordVod} onChange={(v) => set('streaming', { ...s.streaming, recordVod: v })} />
        <Toggle label="چتِ روی پخش" value={s.streaming.chatOverlay} onChange={(v) => set('streaming', { ...s.streaming, chatOverlay: v })} />
      </Section>

      <Section title="پرداخت">
        <Toggle label="KYC برای پرداخت الزامی است" value={s.payout.kycRequiredForPayout} onChange={(v) => set('payout', { ...s.payout, kycRequiredForPayout: v })} />
        <Toggle label="قفلِ پرداخت تا رفعِ همه‌ی اختلاف‌ها" value={s.payout.lockPayoutUntilNoDisputes} onChange={(v) => set('payout', { ...s.payout, lockPayoutUntilNoDisputes: v })} />
        <Toggle label="قفلِ پرداخت تا تأییدِ همه‌ی نتایج" value={s.payout.lockPayoutUntilAllResultsApproved} onChange={(v) => set('payout', { ...s.payout, lockPayoutUntilAllResultsApproved: v })} />
      </Section>

      <p className="text-center text-[11px] text-faint">«اثرگذار بر رفتار» = این دسته همین حالا روی اتاقِ کنترل اثر دارد. بقیه persist و adapter-ready هستند.</p>
    </div>
  );
}
