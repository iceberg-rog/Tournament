'use client';

// آرنای زنده — یک پنلِ شیشه‌ایِ کنترل‌سطحِ سینمایی که از ARENA + LANDING_ACTIVITY داده می‌گیرد.
// همه‌ی ویجت‌ها از داده map می‌شوند؛ هیچ تورنومنتی hardcode نشده.

import Link from 'next/link';
import { CineReveal } from '@/components/CineReveal';
import { ARENA, LANDING_ACTIVITY, ACTIVITY_DOT, FEATURED_TOURNAMENT } from '@/lib/landingShowcase';

/** آواتارِ حرفِ اول با گلوِ هم‌رنگ. */
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <span
      className="grid h-9 w-9 flex-none place-items-center rounded-xl font-display text-[13px] font-bold text-[#06120f]"
      style={{ background: color, boxShadow: `0 6px 16px -8px ${color}` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** سرِ هر ویجتِ شیشه‌ای: آیکون + عنوانِ uppercase. */
function WidgetHead({ icon, title, accent = 'accent' }: { icon: React.ReactNode; title: string; accent?: 'accent' | 'gold' }) {
  const tone = accent === 'gold' ? 'bg-gold/[.12] text-gold' : 'bg-accent/[.12] text-accent';
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${tone}`}>{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted">{title}</span>
    </div>
  );
}

export function ArenaPreviewPanel() {
  const { match, bracket, escrow, participants, countdownMinutes, disputeMatch, round } = ARENA;
  const featured = FEATURED_TOURNAMENT;
  const pct = Math.min(100, Math.round((participants.current / participants.capacity) * 100));
  const mm = String(countdownMinutes).padStart(2, '0');

  return (
    <section dir="rtl" className="relative mx-auto max-w-[1280px] px-4 py-20 md:px-6 md:py-28">
      {/* گلوِ پس‌زمینه‌ی رادیال + گریدِ متحرکِ آرنا */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="glow-breathe absolute end-[6%] top-[8%] h-[420px] w-[420px] rounded-full bg-accent/[.10] blur-[120px]" />
        <div className="glow-breathe absolute start-[2%] bottom-[6%] h-[360px] w-[360px] rounded-full bg-gold/[.06] blur-[120px]" />
      </div>

      {/* عنوانِ بخش */}
      <CineReveal>
        <div className="mb-10 text-center">
          <span className="chip mx-auto border border-accent/20 bg-accent/[.07] text-accent">آرنای زنده</span>
          <h2 className="mt-4 font-display text-[clamp(26px,4vw,40px)] font-bold tracking-tight">نگاهی به داخلِ آرنا</h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
            سطحِ کنترلِ زنده‌ی تورنومنت — نتیجه، براکت، escrow و اختلاف‌ها، همه در یک نگاه.
          </p>
        </div>
      </CineReveal>

      {/* پنلِ شیشه‌ایِ اصلی */}
      <CineReveal delay={120}>
        <div className="cine-float relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.05)_inset,0_40px_80px_-50px_rgba(0,0,0,.9)] backdrop-blur-xl md:p-6">
          {/* گریدِ متحرکِ زمینه‌ی پنل */}
          <div
            aria-hidden
            className="arena-grid pointer-events-none absolute inset-0 -z-10 opacity-[.5]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(45,212,191,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.05) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(120% 100% at 70% 0%, #000 35%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(120% 100% at 70% 0%, #000 35%, transparent 80%)',
            }}
          />

          {/* هدر: عنوانِ featured + چیپِ زنده + دور */}
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/10 pb-5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dim text-[#06231f] shadow-[0_8px_22px_-10px_rgba(45,212,191,.7)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-base font-bold md:text-lg">{featured.title}</h3>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">
                {featured.game} · {round}
              </p>
            </div>
            <span className="live-pill ms-auto">
              <span className="dot" />
              زنده
            </span>
          </div>

          {/* شبکه‌ی ویجت‌ها */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* (1) مسابقه‌ی زنده */}
            <CineReveal delay={60} className="sm:col-span-2 lg:col-span-2">
              <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  title="مسابقه‌ی زنده"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  }
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar initials={match.a.initials} color={match.a.color} />
                    <span className="truncate text-sm font-semibold">{match.a.name}</span>
                  </div>
                  <div className="flex flex-none items-center gap-2 font-display tnum text-3xl font-bold">
                    <span className="text-accent">{match.scoreA}</span>
                    <span className="text-faint">–</span>
                    <span className="text-text">{match.scoreB}</span>
                  </div>
                  <div className="flex min-w-0 items-center justify-end gap-2.5">
                    <span className="truncate text-end text-sm font-semibold">{match.b.name}</span>
                    <Avatar initials={match.b.initials} color={match.b.color} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                  <span>{match.round}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-bad">
                    <span className="dot" />
                    در حالِ پخش
                  </span>
                </div>
              </div>
            </CineReveal>

            {/* (3) جایزه / escrow */}
            <CineReveal delay={120}>
              <div className="h-full overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(280px_140px_at_100%_0,rgba(251,191,36,.12),transparent_70%)] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  accent="gold"
                  title="جایزه در escrow"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                />
                <div className="font-display tnum text-2xl font-bold text-gold">{escrow}</div>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold/80">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  در escrow قفل شد
                </p>
              </div>
            </CineReveal>

            {/* (2) مینی‌براکت */}
            <CineReveal delay={180}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  title="مینی براکت"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 4v4a2 2 0 0 0 2 2h4M6 20v-4a2 2 0 0 1 2-2h4M12 8h6M12 16h6" />
                    </svg>
                  }
                />
                <ul className="space-y-2">
                  {bracket.map((p) => {
                    const win: string | null = p.win;
                    return (
                      <li key={p.id} className="rounded-xl border border-white/[.06] bg-white/[.02] px-2.5 py-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`truncate ${win === 'a' ? 'font-bold text-accent' : 'text-muted'}`}>{p.a}</span>
                          <span className={`tnum ms-2 flex-none font-semibold ${win === 'a' ? 'text-accent' : 'text-faint'}`}>{p.sa}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className={`truncate ${win === 'b' ? 'font-bold text-accent' : 'text-muted'}`}>{p.b}</span>
                          <span className={`tnum ms-2 flex-none font-semibold ${win === 'b' ? 'text-accent' : 'text-faint'}`}>{p.sb}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CineReveal>

            {/* (4) شرکت‌کنندگان */}
            <CineReveal delay={240}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  title="شرکت‌کنندگان"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
                    </svg>
                  }
                />
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display tnum text-2xl font-bold">{participants.current}</span>
                  <span className="text-sm text-muted">/ {participants.capacity}</span>
                </div>
                <div className="pbar mt-3">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted">{pct}٪ ظرفیت تکمیل شد</p>
              </div>
            </CineReveal>

            {/* (5) شمارش معکوس + بَجِ اختلاف */}
            <CineReveal delay={300}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  title="دورِ بعد"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  }
                />
                <span className="chip border border-accent/20 bg-accent/[.08] font-display tnum text-base text-accent">
                  {mm}:۰۰
                </span>
                <p className="mt-2 text-[11px] text-muted">تا دورِ بعد</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad/[.12] px-2.5 py-1 text-[11px] font-bold text-bad">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  اختلافِ مسابقه‌ی {disputeMatch}
                </div>
              </div>
            </CineReveal>

            {/* (6) فعالیتِ زنده */}
            <CineReveal delay={360} className="sm:col-span-2 lg:col-span-3">
              <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]">
                <WidgetHead
                  title="فعالیتِ زنده"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  }
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {LANDING_ACTIVITY.map((item, i) => (
                    <CineReveal key={item.id} delay={420 + i * 90}>
                      <div className="flex items-center gap-2.5 rounded-xl border border-white/[.05] bg-white/[.02] px-3 py-2">
                        <span className={`h-2 w-2 flex-none rounded-full ${ACTIVITY_DOT[item.kind]}`} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-xs text-text">{item.text}</span>
                        <span className="flex-none text-[10.5px] text-faint">{item.at}</span>
                      </div>
                    </CineReveal>
                  ))}
                </div>
              </div>
            </CineReveal>
          </div>

          {/* فوتر: لینکِ ورود به آرنای featured (کارتِ واقعی، نه دکوراتیو) */}
          <div className="mt-5 flex justify-center border-t border-white/10 pt-5">
            <Link
              href={featured.href}
              aria-label={`ورود به آرنای زنده‌ی ${featured.title}`}
              className="btn-primary group px-5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              ورود به آرنای زنده
              <svg className="transition-transform group-hover:-translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </CineReveal>
    </section>
  );
}
