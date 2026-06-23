'use client';

import { money, fmt } from '@/lib/admin';
import {
  participantById,
  relTime,
  type ControlRoomState,
  type CRMatch,
} from '@/lib/admin/controlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';

/** خلاصه‌ی وضعیتِ تورنومنت — قهرمان/پرداخت در پایان، صدرنشین/مانع/اقدامِ بعد در حین برگزاری. */
export function OutcomeSummary({ cr }: { cr: ControlRoomState }) {
  const s = cr.summary;
  const finished = cr.phase === 'completed' || cr.phase === 'paid';
  const payoutPending = cr.phase === 'payout_pending';

  // یک سطرِ بازیکن (آواتار + نام) با برچسبِ نقش
  const PersonRow = ({
    label,
    id,
    tone,
    big,
  }: {
    label: string;
    id?: string | null;
    tone?: 'gold' | 'muted' | 'accent';
    big?: boolean;
  }) => {
    const p = participantById(cr, id);
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-tile2 px-3 py-2.5">
        <span className="flex-none text-xs text-faint">{label}</span>
        {p ? (
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={`min-w-0 truncate font-display font-bold ${
                tone === 'muted' ? 'text-muted' : big ? 'text-text' : 'text-text'
              } ${big ? 'text-lg' : 'text-sm'}`}
            >
              {p.name}
            </span>
            <Avatar p={p} size={big ? 40 : 30} />
          </span>
        ) : (
          <span className="text-sm text-faint">—</span>
        )}
      </div>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">
      {children}
    </div>
  );

  // ───────── حالتِ پایان‌یافته / پرداخت‌شده ─────────
  if (finished) {
    const paid = cr.phase === 'paid';
    return (
      <section className="rounded-2xl border border-line bg-tile p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold text-text">خلاصه‌ی نتیجه</h3>
          <AdminBadge label="پایان‌یافته" tone="muted" />
        </header>

        {/* قهرمان — برجسته با درخششِ طلایی */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gold/[0.07] p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0V4ZM9 18h6m-3 0v3m-3 1h6" />
            </svg>
            قهرمان
          </div>
          {(() => {
            const champ = participantById(cr, s.championId);
            return champ ? (
              <div className="flex items-center gap-3">
                <Avatar p={champ} size={48} />
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-bold text-text">{champ.name}</div>
                  {s.finalScore && (
                    <div className="mt-0.5 text-xs text-muted">
                      نتیجه‌ی نهایی <span className="tnum font-bold text-text">{s.finalScore}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-faint">قهرمان هنوز مشخص نیست.</div>
            );
          })()}
        </div>

        {/* نایب‌قهرمان */}
        <div className="mt-2.5">
          <PersonRow label="نایب‌قهرمان" id={s.runnerUpId} tone="muted" />
        </div>

        {/* وضعیتِ پرداخت + اختلاف‌ها */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-line bg-tile2 p-3">
            <div className="mb-1 text-[11px] text-faint">وضعیتِ پرداخت</div>
            <AdminBadge label={s.payoutStatus ?? (paid ? 'پرداخت‌شده' : 'در انتظارِ پرداخت')} tone={paid ? 'good' : 'gold'} />
            <div className="mt-2 text-xs text-muted">
              مبلغِ جایزه <span className="tnum font-bold text-text">{money(cr.prize)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-tile2 p-3">
            <div className="mb-1 text-[11px] text-faint">اختلاف‌های بسته‌شده؟</div>
            <AdminBadge label="بله" tone="good" dot />
            <div className="mt-2 text-xs text-muted">هیچ اختلافِ بازی باقی نمانده است.</div>
          </div>
        </div>
      </section>
    );
  }

  // ───────── حالتِ در انتظارِ پرداخت ─────────
  if (payoutPending) {
    return (
      <section className="rounded-2xl border border-line bg-tile p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold text-text">خلاصه‌ی نتیجه</h3>
          <AdminBadge label="در انتظارِ پرداخت" tone="gold" dot />
        </header>

        <div className="rounded-2xl border border-gold/40 bg-gold/[0.07] p-4">
          <div className="mb-1.5 text-[11px] font-bold text-gold">قهرمان</div>
          {(() => {
            const champ = participantById(cr, s.championId);
            return champ ? (
              <div className="flex items-center gap-3">
                <Avatar p={champ} size={44} />
                <div className="truncate font-display text-lg font-bold text-text">{champ.name}</div>
              </div>
            ) : (
              <div className="text-sm text-faint">قهرمان هنوز مشخص نیست.</div>
            );
          })()}
        </div>

        <div className="mt-3 rounded-xl border border-gold/30 bg-tile2 p-3">
          <div className="mb-1 text-[11px] text-faint">وضعیتِ پرداخت</div>
          <AdminBadge label={s.payoutStatus ?? 'در انتظارِ آزادسازیِ جایزه'} tone="gold" />
          <div className="mt-2 text-xs text-muted">
            مبلغِ جایزه <span className="tnum font-bold text-text">{money(cr.prize)}</span>
          </div>
        </div>

        {s.nextAction && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="text-xs text-faint">اقدامِ بعدیِ ادمین</span>
            <span className="font-display text-sm font-bold text-text">{s.nextAction}</span>
          </div>
        )}
      </section>
    );
  }

  // ───────── حالتِ زنده / در حالِ برگزاری ─────────
  const curMatch: CRMatch | undefined = cr.matches.find((m) => m.id === s.currentMatchId);
  const mA = participantById(cr, curMatch?.aId);
  const mB = participantById(cr, curMatch?.bId);
  const aLead = curMatch ? curMatch.scoreA >= curMatch.scoreB : false;
  const hasBlockers = s.blockers.length > 0;

  return (
    <section className="rounded-2xl border border-line bg-tile p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold text-text">خلاصه‌ی وضعیت</h3>
        {hasBlockers ? (
          <AdminBadge label={`${fmt(s.blockers.length)} مانع`} tone="bad" />
        ) : (
          <AdminBadge label="در جریان" tone="good" dot />
        )}
      </header>

      {/* در صدر */}
      <SectionTitle>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 2 2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21 8 14 2 9.6h7.6z" />
        </svg>
        در صدر
      </SectionTitle>
      <PersonRow label="صدرنشین" id={s.leadingId} tone="accent" big />

      {/* مسابقه‌ی جاری */}
      <div className="mt-3">
        <SectionTitle>
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
          مسابقه‌ی جاری
        </SectionTitle>
        {curMatch ? (
          <div className="rounded-xl border border-line bg-tile2 p-3">
            <div className="flex items-center justify-between gap-3">
              {/* طرفِ A */}
              <div className={`flex min-w-0 flex-1 items-center gap-2 ${aLead ? '' : 'opacity-60'}`}>
                <Avatar p={mA} size={32} />
                <span className={`min-w-0 truncate text-sm font-bold ${aLead ? 'text-good' : 'text-muted'}`}>
                  {mA?.name ?? '—'}
                </span>
              </div>
              {/* امتیاز */}
              <div className="tnum flex flex-none items-center gap-1.5 font-display text-lg font-bold">
                <span className={aLead ? 'text-good' : 'text-muted'}>{fmt(curMatch.scoreA)}</span>
                <span className="text-faint">:</span>
                <span className={!aLead ? 'text-good' : 'text-muted'}>{fmt(curMatch.scoreB)}</span>
              </div>
              {/* طرفِ B */}
              <div className={`flex min-w-0 flex-1 items-center justify-end gap-2 ${!aLead ? '' : 'opacity-60'}`}>
                <span className={`min-w-0 truncate text-sm font-bold ${!aLead ? 'text-good' : 'text-muted'}`}>
                  {mB?.name ?? '—'}
                </span>
                <Avatar p={mB} size={32} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
              <span>{curMatch.roundName}{curMatch.map ? ` · ${curMatch.map}` : ''}</span>
              <span className="inline-flex items-center gap-1 text-good">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
                زنده
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-tile2 px-3 py-3 text-xs text-faint">
            مسابقه‌ای به‌صورتِ زنده در جریان نیست؛ با شروعِ بازیِ بعدی اینجا نمایش داده می‌شود.
          </div>
        )}
      </div>

      {/* موانع */}
      <div className="mt-3">
        <SectionTitle>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          موانع
        </SectionTitle>
        {hasBlockers ? (
          <ul className="space-y-1.5">
            {s.blockers.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-xl border border-bad/40 bg-bad/[0.08] px-3 py-2 text-sm font-bold text-[#fca5a5]"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-current" />
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-good/30 bg-good/[0.07] px-3 py-2 text-sm font-bold text-good">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            بدونِ مانع — دور بدونِ مشکل پیش می‌رود.
          </div>
        )}
      </div>

      {/* اقدامِ بعدی + دورِ بعد تا */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-3">
          <div className="mb-1 flex items-center gap-1 text-[11px] text-faint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
            اقدامِ بعدیِ ادمین
          </div>
          <div className="font-display text-sm font-bold text-text">{s.nextAction ?? 'ادامه‌ی دور'}</div>
        </div>
        <div className="rounded-xl border border-line bg-tile2 p-3">
          <div className="mb-1 flex items-center gap-1 text-[11px] text-faint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            دورِ بعد تا
          </div>
          <div className="font-display text-sm font-bold text-text">
            {s.estimatedNext ?? (cr.nextScheduled ? relTime(cr.nextScheduled) : '—')}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OutcomeSummary;
