'use client';

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';

/** مراحلِ همکاری — انتشارِ کنترل‌شده پس از تأییدِ SHELTER. */
const STEPS: { title: string; desc: string; icon: 'send' | 'shield' | 'panel' }[] = [
  {
    title: 'درخواستِ همکاری',
    desc: 'تیم، برند، کلن یا مجموعه‌ات را معرفی می‌کنی.',
    icon: 'send',
  },
  {
    title: 'بررسیِ SHELTER',
    desc: 'تیمِ ما درخواست را بررسی و اعتبارسنجی می‌کند.',
    icon: 'shield',
  },
  {
    title: 'پنلِ محدود و انتشارِ پس از تأیید',
    desc: 'با دسترسیِ کنترل‌شده، تورنومنت پس از تأیید منتشر می‌شود.',
    icon: 'panel',
  },
];

function StepIcon({ name }: { name: 'send' | 'shield' | 'panel' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'send') return (<svg {...common}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>);
  if (name === 'shield') return (<svg {...common}><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>);
  return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M7 14h5" /></svg>);
}

export function OrganizerPartnershipSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28" aria-labelledby="organizer-partnership-title" dir="rtl">
      {/* گلوِ رادیال نرم — مهارشده، نه طلایی */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-breathe absolute -top-24 start-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,.16),transparent_62%)] blur-2xl" />
        <div className="arena-grid absolute inset-0 opacity-[.05] [background:linear-gradient(transparent_95%,rgba(255,255,255,.6)),linear-gradient(90deg,transparent_95%,rgba(255,255,255,.6))] [background-size:46px_46px]" />
      </div>

      <div className="relative mx-auto max-w-[1080px] px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          {/* ستونِ متن + CTA */}
          <div>
            <CineReveal>
              <span className="chip border border-white/10 bg-white/[.03] text-accent backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                همکاریِ رسمی
              </span>
            </CineReveal>

            <CineReveal delay={120}>
              <h2 id="organizer-partnership-title" className="mt-5 font-display text-[27px] font-bold leading-[1.25] tracking-tight md:text-[34px]">
                برگزارکننده‌ای؟ با <span className="text-accent">SHELTER</span> همکاری کن
              </h2>
            </CineReveal>

            <CineReveal delay={220}>
              <p className="mt-4 max-w-xl text-[15px] leading-8 text-muted">
                اگر تیم، برند، کلن یا مجموعه‌ی گیمینگ هستی، می‌توانی برای همکاری درخواست بدهی. انتشارِ تورنومنت‌ها پس از بررسی و تأییدِ SHELTER انجام می‌شود.
              </p>
            </CineReveal>

            <CineReveal delay={320}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/register" className="btn-primary px-5 py-2.5 text-sm" aria-label="ارسالِ درخواستِ همکاری با SHELTER">
                  درخواستِ همکاری
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ms-0.5"><path d="M19 12H5" /><path d="m12 5-7 7 7 7" /></svg>
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg>
                  انتشارِ کنترل‌شده و پس از تأیید
                </span>
              </div>
            </CineReveal>
          </div>

          {/* پنلِ شیشه‌ای — ۳ مرحله */}
          <CineReveal delay={260}>
            <div className="cine-float relative rounded-2xl border border-white/10 bg-white/[.03] p-5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_30px_60px_-30px_rgba(0,0,0,.8)] md:p-6">
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                مسیرِ همکاری
              </div>

              <ol className="relative space-y-1">
                {/* خطِ اتصالِ عمودی */}
                <span aria-hidden className="absolute bottom-7 end-[18px] top-7 w-px bg-gradient-to-b from-accent/40 via-white/10 to-transparent" />
                {STEPS.map((s, i) => (
                  <li key={s.title} className="relative flex gap-3.5 rounded-xl px-1.5 py-2.5">
                    <span className="relative z-10 grid h-9 w-9 flex-none place-items-center rounded-xl border border-white/10 bg-tile text-accent shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                      <StepIcon name={s.icon} />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="tnum text-[11px] font-bold text-faint">۰{i + 1}</span>
                        <h3 className="text-[14px] font-semibold leading-snug">{s.title}</h3>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-6 text-muted">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.02] px-3.5 py-3 text-[12px] leading-6 text-faint">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-accent"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                تنها برگزارکنندگانِ تأییدشده به پنلِ انتشار دسترسی دارند.
              </div>
            </div>
          </CineReveal>
        </div>
      </div>
    </section>
  );
}
