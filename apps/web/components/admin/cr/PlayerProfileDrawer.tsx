'use client';

import { useMemo, useState } from 'react';
import {
  CRPART_FA,
  relTime,
  participantById,
  type ControlRoomState,
  type CRMatch,
  type CRParticipant,
} from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';
import { fmt, type Tone } from '@/lib/admin';
import { Avatar } from '@/components/admin/cr/Avatar';
import { Drawer } from '@/components/admin/cr/Drawer';
import { AdminBadge } from '@/components/admin/AdminBadge';

const STATUS_TONE: Record<CRParticipant['status'], Tone> = {
  registered: 'muted',
  checked_in: 'accent',
  playing: 'good',
  waiting: 'muted',
  eliminated: 'muted',
  winner: 'gold',
  no_show: 'bad',
  disqualified: 'bad',
  withdrawn: 'muted',
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function InfoCell({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'good' | 'bad' | 'muted' }) {
  const color = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-text';
  return (
    <div className="rounded-xl border border-line bg-tile2 px-3 py-2">
      <div className="text-[11px] text-faint">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

/** کشوی پروفایلِ بازیکن/تیم در اتاقِ کنترل — تاریخچه، پیام، و اقداماتِ مدیریتی. */
export function PlayerProfileDrawer({
  cr,
  participantId,
  onClose,
  onRun,
  onOpenMatch,
}: {
  cr: ControlRoomState;
  participantId: string | null;
  onClose: () => void;
  onRun: (a: CRAction, p?: CRPayload) => void;
  onOpenMatch: (id: string) => void;
}) {
  const p = participantById(cr, participantId);
  const [msg, setMsg] = useState('');

  const history = useMemo<CRMatch[]>(
    () => (p ? cr.matches.filter((m) => m.aId === p.id || m.bId === p.id) : []),
    [cr.matches, p],
  );

  if (!p) {
    return (
      <Drawer open={!!participantId} onClose={onClose} title={<span className="font-display text-base font-bold text-text">پروفایلِ بازیکن</span>}>
        <p className="rounded-xl border border-dashed border-line bg-tile2 p-4 text-sm text-muted">
          بازیکنِ موردِ نظر یافت نشد؛ ممکن است حذف شده باشد. یک بازیکن را از فهرستِ شرکت‌کننده‌ها انتخاب کنید.
        </p>
      </Drawer>
    );
  }

  const currentMatch = p.currentMatchId ? cr.matches.find((m) => m.id === p.currentMatchId) : undefined;
  const blocked = p.status === 'disqualified' || p.status === 'no_show';

  const kycLabel = p.kyc === 'verified' ? 'تأییدشده' : p.kyc === 'pending' ? 'در انتظار' : 'بدونِ احراز';
  const kycTone: Tone = p.kyc === 'verified' ? 'good' : p.kyc === 'pending' ? 'gold' : 'muted';

  const walletLabel = p.walletStatus === 'ok' ? 'سالم' : p.walletStatus === 'locked' ? 'قفل‌شده' : p.walletStatus === 'empty' ? 'خالی' : 'نامشخص';
  const walletTone: Tone = p.walletStatus === 'ok' ? 'good' : p.walletStatus === 'locked' ? 'gold' : 'muted';

  const warnings = p.warnings ?? 0;
  const noShows = p.noShows ?? 0;
  const lastSeenIso = p.lastSeen ?? p.lastActivity;

  const sendMessage = () => {
    const text = msg.trim();
    if (!text) return;
    onRun('message', { participantId: p.id, message: text });
    setMsg('');
  };

  const warn = () => onRun('warn', { participantId: p.id });
  const mute = () => onRun('mute', { participantId: p.id });

  const disqualify = () => {
    if (typeof window !== 'undefined' && !window.confirm(`«${p.name}» محروم شود؟ این کار از براکت/رده‌بندی حذفش می‌کند.`)) return;
    onRun('disqualify', { participantId: p.id });
  };

  return (
    <Drawer
      open={!!participantId}
      onClose={onClose}
      title={<span className="font-display text-base font-bold text-text">پروفایلِ بازیکن</span>}
      subtitle={p.isTeam ? 'تیم' : 'بازیکنِ انفرادی'}
    >
      <div className="space-y-4">
        {/* هدر: آواتار + نام + سید + وضعیت */}
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${blocked ? 'border-bad/40 bg-bad/5' : 'border-line bg-tile2'}`}>
          <Avatar p={p} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-display text-lg font-bold text-text">{p.name}</span>
              <AdminBadge label={CRPART_FA[p.status]} tone={STATUS_TONE[p.status]} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-faint">
              <span className="chip bg-tile text-muted">سید {fmt(p.seed)}</span>
              {p.isTeam && p.members?.length ? <span className="chip bg-tile text-muted">{fmt(p.members.length)} عضو</span> : null}
              {p.reports > 0 && (
                <span className="chip bg-bad/15 text-[#fca5a5]">
                  <Icon d="m12 9 0 4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  {fmt(p.reports)} گزارش
                </span>
              )}
              {p.suspicious && (
                <span className="chip bg-bad/15 text-[#fca5a5]">
                  <Icon d="M12 9v4M12 17h.01M12 3 2 21h20L12 3Z" />
                  مشکوک
                </span>
              )}
            </div>
          </div>
        </div>

        {blocked && (
          <div className="rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm font-semibold text-[#fca5a5]">
            {p.status === 'disqualified'
              ? 'این بازیکن محروم شده و در دورهای بعد شرکت داده نمی‌شود. در صورتِ نیاز می‌توانید بازگردانی کنید.'
              : 'این بازیکن غایب اعلام شده است؛ تکلیفِ مسابقه‌اش را روشن کنید یا بازگردانی نمایید.'}
          </div>
        )}

        {/* شبکه‌ی اطلاعات */}
        <div className="grid grid-cols-2 gap-2">
          <InfoCell label="سید" value={fmt(p.seed)} />
          <InfoCell label="پرداخت" value={p.paid ? 'پرداخت‌شده' : 'پرداخت‌نشده'} tone={p.paid ? 'good' : 'bad'} />
          <div className="col-span-2">
            {currentMatch ? (
              <button
                type="button"
                onClick={() => onOpenMatch(currentMatch.id)}
                className="flex w-full items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-start transition hover:border-accent/60"
              >
                <span>
                  <span className="block text-[11px] text-faint">مسابقه‌ی جاری</span>
                  <span className="mt-0.5 block text-sm font-bold text-[#5eead4]">#{fmt(currentMatch.number)} · {currentMatch.roundName}</span>
                </span>
                <Icon d="m15 18-6-6 6-6" />
              </button>
            ) : (
              <InfoCell label="مسابقه‌ی جاری" value="در هیچ مسابقه‌ای نیست" tone="muted" />
            )}
          </div>
        </div>

        {/* اطلاعاتِ بازیکن */}
        <section>
          <h3 className="mb-2 font-display text-sm font-bold text-text">اطلاعاتِ بازیکن</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 rounded-xl border border-line bg-tile2 px-3 py-2">
              <div className="text-[11px] text-faint">شناسه‌ی PSN</div>
              <div className="tnum mt-0.5 text-sm font-bold text-text" dir="ltr">{p.psnId ?? '—'}</div>
            </div>

            <div className="rounded-xl border border-line bg-tile2 px-3 py-2">
              <div className="text-[11px] text-faint">وضعیتِ KYC</div>
              <div className="mt-1"><AdminBadge label={kycLabel} tone={kycTone} /></div>
            </div>
            <div className="rounded-xl border border-line bg-tile2 px-3 py-2">
              <div className="text-[11px] text-faint">وضعیتِ کیف‌پول</div>
              <div className="mt-1"><AdminBadge label={walletLabel} tone={walletTone} /></div>
            </div>

            <InfoCell label="اخطارها" value={warnings > 0 ? `${fmt(warnings)} مورد` : 'ندارد'} tone={warnings > 0 ? 'bad' : 'good'} />
            <InfoCell label="عدمِ حضور" value={noShows > 0 ? `${fmt(noShows)} بار` : 'ندارد'} tone={noShows > 0 ? 'bad' : 'good'} />
            <InfoCell label="گزارش‌ها" value={p.reports > 0 ? `${fmt(p.reports)} مورد` : 'بدونِ گزارش'} tone={p.reports > 0 ? 'bad' : 'good'} />
            <InfoCell label="آخرین فعالیت" value={relTime(lastSeenIso)} />
          </div>
        </section>

        {/* تاریخچه‌ی مسابقات */}
        <section>
          <h3 className="mb-2 font-display text-sm font-bold text-text">تاریخچه‌ی مسابقات در این تورنومنت</h3>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-tile2 p-3 text-xs text-muted">
              هنوز در هیچ مسابقه‌ای حاضر نشده؛ به‌محضِ تخصیصِ مسابقه، نتایجش اینجا نمایش داده می‌شود.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((m) => {
                const isA = m.aId === p.id;
                const oppId = isA ? m.bId : m.aId;
                const opp = participantById(cr, oppId);
                const myScore = isA ? m.scoreA : m.scoreB;
                const oppScore = isA ? m.scoreB : m.scoreA;
                const done = m.status === 'completed';
                const won = done && m.winnerId === p.id;
                const lost = done && !!m.winnerId && m.winnerId !== p.id;
                const disputed = m.status === 'disputed';
                const live = m.status === 'live';

                const resultTone: Tone = won ? 'good' : lost ? 'bad' : disputed ? 'bad' : live ? 'accent' : 'muted';
                const resultLabel = done ? (won ? 'برد' : lost ? 'باخت' : 'مساوی') : disputed ? 'اختلاف' : live ? 'زنده' : 'در جریان';

                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onOpenMatch(m.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition ${
                        disputed ? 'border-bad/40 bg-bad/5' : won ? 'border-good/30 bg-good/5' : 'border-line bg-tile2'
                      } hover:border-accent/40 ${live ? 'animate-pulse' : ''}`}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar p={opp} size={28} />
                        <span className="min-w-0">
                          <span className="block text-[11px] text-faint">#{fmt(m.number)} · {m.roundName}</span>
                          <span className={`block truncate text-sm font-semibold ${opp ? 'text-text' : 'text-faint'}`}>
                            {opp ? opp.name : 'حریفِ نامشخص (TBD)'}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-none items-center gap-2">
                        <span className={`tnum font-display text-sm font-bold ${won ? 'text-good' : lost ? 'text-faint' : 'text-text'}`}>
                          {fmt(myScore)}‑{fmt(oppScore)}
                        </span>
                        <AdminBadge label={resultLabel} tone={resultTone} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* پیام به بازیکن */}
        <section className="rounded-2xl border border-line bg-tile2 p-3">
          <label className="mb-2 block font-display text-sm font-bold text-text">ارسالِ پیامِ مستقیم</label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            placeholder={`پیام به «${p.name}» بنویسید…`}
            className="w-full resize-none rounded-xl border border-line bg-tile p-2.5 text-sm text-text outline-none placeholder:text-faint focus:border-accent/50"
          />
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={sendMessage} disabled={!msg.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
              ارسالِ پیام
            </button>
          </div>
        </section>

        {/* اقداماتِ مدیریتی */}
        <section>
          <h3 className="mb-2 font-display text-sm font-bold text-text">اقداماتِ مدیریتی</h3>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={warn} className="btn-ghost justify-center gap-1.5">
              <Icon d="m12 9 0 4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              اخطار
            </button>
            <button type="button" onClick={mute} className="btn-ghost justify-center gap-1.5">
              <Icon d="M16 9a5 5 0 0 1 .95 2.9M19.07 4.93a10 10 0 0 1 0 14.14M3 3l18 18M9.5 5.4A2 2 0 0 1 13 7v1.5M13 13.4V17a2 2 0 0 1-3.6 1.2L6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2" />
              بی‌صداکردن
            </button>
            <button
              type="button"
              onClick={() => onRun('mark_no_show', { participantId: p.id })}
              disabled={p.status === 'no_show'}
              className="btn-ghost col-span-2 justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon d="M18 6 6 18M6 6l12 12" />
              ثبتِ عدمِ حضور
            </button>
            {blocked ? (
              <button type="button" onClick={() => onRun('restore', { participantId: p.id })} className="btn-primary col-span-2 justify-center gap-1.5">
                <Icon d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8M3 3v5h5" />
                بازگردانی به تورنومنت
              </button>
            ) : (
              <button type="button" onClick={disqualify} className="btn-danger col-span-2 justify-center gap-1.5">
                <Icon d="M18 6 6 18M6 6l12 12" />
                محروم‌سازی
              </button>
            )}
          </div>
        </section>

        {/* پروفایلِ کامل */}
        <a href="#" className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-tile2 px-3 py-2 text-sm font-semibold text-muted transition hover:text-text">
          مشاهده‌ی پروفایلِ کامل
          <Icon d="m9 18 6-6-6-6" />
        </a>
      </div>
    </Drawer>
  );
}

export default PlayerProfileDrawer;
