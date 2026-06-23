'use client';

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { FEATURED_TOURNAMENT } from '@/lib/landingShowcase';

/* آیکون‌های خطی (بدونِ emoji) */
function IcLock(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.4" r="1.3" />
      <path d="M12 16.7v2" />
    </svg>
  );
}
function IcPool(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
      <path d="M4.5 12v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </svg>
  );
}
function IcCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="M12 3 4 6v5c0 4.5 3.2 7.6 8 9 4.8-1.4 8-4.5 8-9V6z" />
      <path d="m9 11.5 2 2 4-4.2" />
    </svg>
  );
}
function IcWinner(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="M7 4h10v3a5 5 0 0 1-10 0z" />
      <path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 8 10M17 5h2.5v1.5A3.5 3.5 0 0 1 16 10" />
      <path d="M12 12v3M9 20h6M10 17.5h4l.8 2.5h-5.6z" />
    </svg>
  );
}
function IcShield(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="M12 3 5 5.5V11c0 4.2 3 7.6 7 8.8 4-1.2 7-4.6 7-8.8V5.5z" />
      <path d="m9.2 11.5 1.8 1.8 3.8-4" />
    </svg>
  );
}
function IcGavel(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="m13.5 6.5 4 4M11 9l4 4M15.5 4.5l4 4M9.5 11 4 16.5 6.5 19 12 13.5M4 21h7" />
    </svg>
  );
}
function IcAudit(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="M6 3h7l5 5v13H6z" />
      <path d="M13 3v5h5M9 13h6M9 16.5h4" />
    </svg>
  );
}
/* فلشِ جریان (RTL: جهتِ منطقیِ پیشروی به چپ) */
function IcFlowArrow(props: { className?: string }) {
  return (
    <svg viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden>
      <path d="M30 8H3" />
      <path d="M9 3 3 8l6 5" />
    </svg>
  );
}

const PRIZE = FEATURED_TOURNAMENT.prize ?? '۸٬۰۰۰٬۰۰۰ تومان';

type FlowNode = { key: string; label: string; sub: string; icon: (p: { className?: string }) => React.ReactElement; locked?: boolean };

const FLOW: FlowNode[] = [
  { key: 'pool', label: 'استخرِ جایزه', sub: 'تأمین‌شده', icon: IcPool },
  { key: 'escrow', label: 'escrow', sub: 'قفل‌شده', icon: IcLock, locked: true },
  { key: 'verify', label: 'تأییدِ نتیجه', sub: 'بستنِ اختلاف', icon: IcCheck },
  { key: 'payout', label: 'پرداخت به برنده', sub: 'نهایی', icon: IcWinner },
];

const TRUST: { key: string; text: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { key: 't1', text: 'جایزه در escrow قفل می‌شود', icon: IcShield },
  { key: 't2', text: 'پرداخت پس از تأییدِ نتیجه و بسته‌شدنِ اختلاف‌ها', icon: IcGavel },
  { key: 't3', text: 'هر اقدامِ حساس audit می‌شود — و KYC برای برداشت قابلِ فعال‌سازی است', icon: IcAudit },
];

/** جایزه‌ی امن — گاوصندوقِ escrow، جریانِ پرداخت و نکاتِ اعتماد (تنها بخشِ با accentِ طلایی). */
export function PrizeEscrowSection() {
  return (
    <section aria-labelledby="prize-escrow-title" className="relative overflow-hidden">
      <CineReveal>
        <header className="max-w-2xl">
          <span className="chip border border-gold/30 bg-gold/[.08] text-gold">
            <IcLock className="h-3.5 w-3.5" />
            escrow امن
          </span>
          <h2 id="prize-escrow-title" className="mt-4 font-display text-[clamp(22px,3vw,34px)] font-bold leading-tight">
            جایزه امن، پرداخت شفاف
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            جایزه از لحظه‌ی شروع تا تعیینِ برنده در escrow قفل می‌ماند؛ هیچ پرداختی پیش از تأییدِ نتیجه و بسته‌شدنِ اختلاف‌ها انجام نمی‌شود.
          </p>
        </header>
      </CineReveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-stretch">
        {/* گاوصندوقِ جایزه */}
        <CineReveal delay={120}>
          <div className="relative h-full">
            {/* گلوِ طلاییِ تنفسی پشتِ گاوصندوق */}
            <div
              aria-hidden
              className="glow-breathe pointer-events-none absolute inset-0 -z-10 mx-auto blur-2xl"
              style={{ background: 'radial-gradient(closest-side, rgba(251,191,36,.32), transparent 72%)' }}
            />
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-gold/20 bg-white/[.03] px-6 py-9 text-center shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_24px_60px_-30px_rgba(251,191,36,.45)] backdrop-blur-xl">
              {/* قابِ گاوصندوق */}
              <div className="cine-float relative grid h-16 w-16 place-items-center rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/20 to-transparent text-gold shadow-[0_0_30px_-6px_rgba(251,191,36,.6)]">
                <IcLock className="h-8 w-8" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-gold/40 bg-bg text-gold">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                </span>
              </div>

              <div className="mt-6 text-[11px] font-semibold uppercase tracking-[.18em] text-muted">جایزه‌ی قفل‌شده در escrow</div>
              <div className="mt-2 font-display text-[clamp(26px,4vw,38px)] font-extrabold leading-none tnum text-gold drop-shadow-[0_0_18px_rgba(251,191,36,.45)]">
                {PRIZE}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[.06] px-3 py-1.5 text-xs font-semibold text-gold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                قفل تا تعیینِ برنده
              </div>

              <p className="mt-4 text-[12px] leading-6 text-faint">
                موجودی در حسابِ نگه‌داریِ مستقل (escrow) نگهداری می‌شود — نه در دستِ برگزارکننده.
              </p>
            </div>
          </div>
        </CineReveal>

        {/* جریانِ پرداخت + نکاتِ اعتماد */}
        <div className="flex flex-col gap-6">
          <CineReveal delay={200}>
            <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[.03] p-6 shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_20px_50px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl">
              <div className="mb-5 text-[11px] font-semibold uppercase tracking-[.16em] text-muted">جریانِ پرداخت</div>

              {/* نودها + فلش‌ها (RTL: ردیف معکوس می‌شود؛ flex-col روی موبایل) */}
              <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
                {FLOW.map((n, i) => (
                  <li key={n.key} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-0">
                    <div
                      className={`flex w-full flex-1 items-center gap-3 rounded-2xl border px-3.5 py-3 sm:flex-col sm:gap-2 sm:py-4 sm:text-center ${
                        n.locked
                          ? 'border-gold/25 bg-gold/[.06] shadow-[0_0_24px_-12px_rgba(251,191,36,.6)]'
                          : 'border-white/10 bg-white/[.02]'
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 flex-none place-items-center rounded-xl border ${
                          n.locked ? 'border-gold/30 bg-gold/10 text-gold' : 'border-white/10 bg-white/[.04] text-accent'
                        }`}
                      >
                        <n.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 sm:mt-0.5">
                        <div className={`truncate text-[13px] font-bold ${n.locked ? 'text-gold' : 'text-text'}`}>{n.label}</div>
                        <div className="truncate text-[11px] text-faint">{n.sub}</div>
                      </div>
                    </div>
                    {/* فلشِ بینِ نودها (نه بعد از آخری) */}
                    {i < FLOW.length - 1 && (
                      <span
                        aria-hidden
                        className={`flex-none rotate-90 px-1 sm:rotate-0 sm:px-2 ${i === 0 || i === 1 ? 'text-gold/70' : 'text-accent/60'}`}
                      >
                        <IcFlowArrow className="h-3.5 w-8" />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </CineReveal>

          {/* نکاتِ اعتماد */}
          <div className="grid gap-3 sm:grid-cols-3">
            {TRUST.map((t, i) => (
              <CineReveal key={t.key} delay={280 + i * 90} className="h-full">
                <div className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 backdrop-blur-xl">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-gold/20 bg-gold/[.07] text-gold">
                    <t.icon className="h-[18px] w-[18px]" />
                  </span>
                  <p className="text-[12.5px] leading-6 text-muted">{t.text}</p>
                </div>
              </CineReveal>
            ))}
          </div>

          <CineReveal delay={560}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.02] px-5 py-4">
              <p className="text-[13px] text-muted">
                می‌خواهی جایزه‌ی تورنومنتت امن و شفاف پرداخت شود؟
              </p>
              <Link
                href="/register"
                aria-label="شروعِ برگزاری با پرداختِ امنِ escrow"
                className="btn-ghost cursor-pointer border-gold/30 px-4 py-2 text-sm text-gold transition hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                شروعِ برگزاری
                <IcFlowArrow className="h-3 w-6" />
              </Link>
            </div>
          </CineReveal>
        </div>
      </div>
    </section>
  );
}
