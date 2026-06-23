'use client';

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { ARENA, FEATURED_TOURNAMENT } from '@/lib/landingShowcase';

/** نکته‌های کوتاهِ ستونِ چپ — ثابت، توضیحیِ سیستم. */
const POINTS = [
  {
    title: 'هر نتیجه، یک مدرک دارد',
    body: 'اسکورِ هر مسابقه با اسکرین‌شات و تأییدِ دو طرف ثبت می‌شود — نه ادعای شفاهی.',
    icon: (
      <path d="M9 12.5 11 14.5 15.5 10M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
    ),
    tone: 'accent' as const,
  },
  {
    title: 'اعتراض، مسیرِ رسمی دارد',
    body: 'اگر اختلافی پیش بیاید، مسابقه قفل می‌شود و داور بر اساسِ مدارک تصمیم می‌گیرد.',
    icon: <path d="M12 9v4m0 4h.01M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />,
    tone: 'bad' as const,
  },
  {
    title: 'صعود، خودکار و قابلِ ردیابی',
    body: 'برنده‌ی هر مسابقه به‌صورتِ خودکار به دورِ بعد می‌رود و در براکتِ زنده دیده می‌شود.',
    icon: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
    tone: 'good' as const,
  },
];

const TONE_RING: Record<'accent' | 'bad' | 'good', string> = {
  accent: 'bg-accent/12 text-accent ring-accent/25',
  bad: 'bg-bad/12 text-bad ring-bad/25',
  good: 'bg-good/12 text-good ring-good/25',
};

/** وضعیتِ بصریِ هر گرهِ براکت بر اساسِ دادهٔ ARENA.bracket. */
type NodeState = 'winner' | 'pending' | 'disputed';
function nodeState(m: (typeof ARENA.bracket)[number]): NodeState {
  if (m.win) return 'winner';
  // مسابقه‌ای که آغاز شده ولی برنده ندارد = در حالِ اعتراض؛ مسابقه‌ی صفر-صفر = در انتظار.
  if (m.sa + m.sb > 0) return 'disputed';
  return 'pending';
}

const NODE_META: Record<NodeState, { ring: string; label: string; dot: string; tip: string }> = {
  winner: { ring: 'border-accent/45 bg-accent/[.05]', label: 'تأییدشده', dot: 'bg-accent', tip: 'text-accent' },
  pending: { ring: 'border-gold/40 bg-gold/[.04]', label: 'در انتظار', dot: 'bg-gold', tip: 'text-gold' },
  disputed: { ring: 'border-bad/55 bg-bad/[.05]', label: 'اعتراض', dot: 'bg-bad', tip: 'text-bad' },
};

export function BracketExperienceSection() {
  const hasDispute = ARENA.bracket.some((m) => nodeState(m) === 'disputed');

  return (
    <section className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="bracket-exp-title">
      {/* گلوِ پس‌زمینه‌ی سینمایی */}
      <div
        aria-hidden
        className="glow-breathe pointer-events-none absolute -top-24 start-[-10%] h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,.18), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12%] end-[-8%] h-[360px] w-[360px] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(248,113,113,.10), transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-[1180px] px-4 md:px-6">
        {/* سرتیتر */}
        <CineReveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip mb-4 bg-white/[.04] text-muted ring-1 ring-white/10">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12h4l2 6 4-12 2 6h4" />
              </svg>
              سیستمِ رقابت، نه فقط فهرستِ تورنومنت
            </span>
            <h2 id="bracket-exp-title" className="font-display text-[clamp(26px,4vw,40px)] font-bold leading-tight">
              هر مسابقه شفاف است
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted sm:text-base">
              نتیجه، مدرک، اعتراض و صعود — همه قابلِ پیگیری‌اند.
            </p>
          </div>
        </CineReveal>

        <div className="mt-12 grid items-center gap-6 lg:mt-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-10">
          {/* ستونِ چپ — سه نکته‌ی کوتاه */}
          <div className="space-y-3.5">
            {POINTS.map((p, i) => (
              <CineReveal key={p.title} delay={i * 120}>
                <div className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_18px_40px_-30px_rgba(0,0,0,.9)] backdrop-blur-sm transition-colors duration-500 hover:border-white/20 sm:p-5">
                  <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ring-1 ${TONE_RING[p.tone]}`}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {p.icon}
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[15px] font-bold sm:text-base">{p.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-muted">{p.body}</p>
                  </div>
                </div>
              </CineReveal>
            ))}
          </div>

          {/* ستونِ راست — پنلِ شیشه‌ایِ براکتِ زنده */}
          <CineReveal delay={120}>
            <div className="cine-float relative">
              {/* هاله‌ی نرمِ پشتِ پنل */}
              <div
                aria-hidden
                className="glow-breathe pointer-events-none absolute inset-6 rounded-[28px] blur-2xl"
                style={{ background: 'radial-gradient(60% 60% at 70% 20%, rgba(45,212,191,.14), transparent 70%)' }}
              />
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_40px_90px_-50px_rgba(0,0,0,.95)] backdrop-blur-xl sm:p-6">
                {/* شبکه‌ی متحرکِ آرنا */}
                <div
                  aria-hidden
                  className="arena-grid pointer-events-none absolute inset-0 opacity-[.5]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    maskImage: 'radial-gradient(100% 70% at 50% 0%, #000, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(100% 70% at 50% 0%, #000, transparent 80%)',
                  }}
                />

                <div className="relative">
                  {/* سرِ پنل: لِیبلِ دورِ جاری + لایو */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-faint">دورِ جاری</div>
                      <div className="mt-1 font-display text-[15px] font-bold leading-snug">{ARENA.round}</div>
                    </div>
                    <span className="live-pill flex-none">
                      <span className="dot" />
                      زنده
                    </span>
                  </div>

                  {/* گرهای براکت */}
                  <ul className="mt-5 space-y-2.5">
                    {ARENA.bracket.map((m) => {
                      const st = nodeState(m);
                      const meta = NODE_META[st];
                      return (
                        <li
                          key={m.id}
                          className={`relative overflow-hidden rounded-2xl border ${meta.ring} px-3.5 py-3 transition-colors duration-500`}
                        >
                          {/* خطِ کنارهٔ وضعیت */}
                          <span aria-hidden className={`absolute inset-y-0 start-0 w-1 ${meta.dot}`} />
                          <div className="flex items-center justify-between gap-3 ps-2">
                            <div className="min-w-0 space-y-1.5">
                              <PlayerRow name={m.a} score={m.sa} win={m.win === 'a'} />
                              <PlayerRow name={m.b} score={m.sb} win={(m.win as string | null) === 'b'} />
                            </div>
                            <span className={`chip flex-none ${meta.tip} bg-white/[.04] ring-1 ring-white/10`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* چیپ‌های وضعیت: اختلاف + مهلت */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="chip bg-bad/10 text-bad ring-1 ring-bad/25">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 9v4m0 4h.01M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
                      </svg>
                      اعتراض روی مسابقه‌ی {ARENA.disputeMatch}
                    </span>
                    <span className="chip bg-gold/10 text-gold ring-1 ring-gold/25">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2.5 1.5M9 2h6" />
                      </svg>
                      <span className="tnum">مهلتِ پاسخ {toFa(ARENA.countdownMinutes)} دقیقه</span>
                    </span>
                  </div>

                  {/* یادداشتِ قفلِ دورِ بعد */}
                  <div
                    className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-semibold ${
                      hasDispute
                        ? 'border-gold/25 bg-gold/[.06] text-gold'
                        : 'border-good/25 bg-good/[.06] text-good'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none" aria-hidden>
                      {hasDispute ? (
                        <>
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </>
                      ) : (
                        <>
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 7.5-1.7" />
                        </>
                      )}
                    </svg>
                    {hasDispute ? 'دورِ بعد قفل است تا حلِ اختلاف' : 'دورِ بعد آماده است'}
                  </div>

                  {/* لینکِ مشاهده‌ی آرنای کامل */}
                  <Link
                    href={FEATURED_TOURNAMENT.href}
                    aria-label={`مشاهده‌ی براکتِ زنده‌ی ${FEATURED_TOURNAMENT.title}`}
                    className="group mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-sm font-semibold text-text outline-none transition-colors duration-300 hover:border-accent/40 hover:bg-accent/[.05] focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <span className="line-clamp-1">مشاهده‌ی براکتِ زنده‌ی {FEATURED_TOURNAMENT.game}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-accent transition-transform duration-300 group-hover:-translate-x-1" aria-hidden>
                      <path d="M19 12H5m6-7-7 7 7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </CineReveal>
        </div>
      </div>
    </section>
  );
}

/** یک ردیفِ بازیکن داخلِ گرهِ براکت. */
function PlayerRow({ name, score, win }: { name: string; score: number; win: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={`grid h-6 w-6 flex-none place-items-center rounded-md font-display text-[10px] font-bold ${
          win ? 'bg-accent/15 text-accent' : 'bg-white/[.05] text-muted'
        }`}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
      <span className={`truncate text-[13px] ${win ? 'font-bold text-text' : 'font-medium text-muted'}`}>{name}</span>
      <span className={`tnum ms-1 font-display text-sm font-bold ${win ? 'text-accent' : 'text-faint'}`}>{toFa(score)}</span>
    </div>
  );
}

/** عددِ لاتین به فارسی. */
function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}
