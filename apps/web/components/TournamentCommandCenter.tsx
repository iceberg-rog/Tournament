'use client';

// پنلِ شیشه‌ایِ «مرکزِ فرماندهیِ تورنومنت» — همه‌چیز داخلِ یک پنلِ منظم و خوانا
// (نه کارت‌های شناورِ پراکنده). data-driven از landingShowcase.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ARENA, FEATURED_TOURNAMENT, LANDING_ACTIVITY, ACTIVITY_DOT, STATUS_META } from '@/lib/landingShowcase';

function Initials({ name, color, size = 26 }: { name: string; color: string; size?: number }) {
  const initials = name.replace(/[#\d]/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="grid flex-none place-items-center rounded-lg font-display text-[11px] font-bold text-[#0b0c10]" style={{ width: size, height: size, background: color }}>
      {initials}
    </span>
  );
}

export function TournamentCommandCenter() {
  const t = FEATURED_TOURNAMENT;
  const meta = STATUS_META[t.status];
  const [hi, setHi] = useState(0);

  // فعالیتِ زنده — تغییرِ آرامِ آیتمِ برجسته
  useEffect(() => {
    const id = setInterval(() => setHi((v) => (v + 1) % LANDING_ACTIVITY.length), 2800);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round((ARENA.participants.current / ARENA.participants.capacity) * 100);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* گلوِ پشتِ پنل */}
      <div aria-hidden="true" className="glow-breathe pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(45,212,191,.16),transparent_70%)] blur-2xl" />

      <div className="cine-float overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(20,24,30,.92),rgba(12,14,18,.92))] shadow-[0_1px_0_rgba(255,255,255,.05)_inset,0_50px_120px_-40px_rgba(0,0,0,.9)] backdrop-blur-2xl">
        {/* نوارِ سرِ پنل */}
        <div className="flex items-center gap-2 border-b border-white/[.06] px-4 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-good/70" />
          </span>
          <span className="ms-1 text-[12px] font-semibold text-muted">مرکزِ فرماندهیِ تورنومنت</span>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-bad/40 bg-bad/15 px-2.5 py-0.5 text-[11px] font-bold text-[#fca5a5]">
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bad" /></span>
            زنده
          </span>
        </div>

        <div className="space-y-3 p-4">
          {/* تورنومنتِ featured — کلیک‌پذیر */}
          <Link href={t.href} aria-label={`${t.title} — ${t.game}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3 transition hover:border-accent/40 hover:bg-white/[.05] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-xl font-display text-[11px] font-extrabold text-white" style={{ background: 'linear-gradient(135deg,#0c2a1a,#1a2d10)' }}>FC&nbsp;26</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[15px] font-bold text-text">{t.title}</span>
              <span className="block text-[11.5px] text-muted">{t.game} · {t.platform} · {t.format}</span>
            </span>
            <span className="flex-none text-end">
              <span className="block font-display text-[13px] font-bold tnum text-gold">{t.prize}</span>
              <span className="block text-[11px] text-muted transition-colors group-hover:text-accent">مشاهده ←</span>
            </span>
          </Link>

          {/* مسابقه‌ی زنده + escrow */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
              <p className="mb-2 text-[11px] text-faint">مسابقه‌ی زنده · {ARENA.match.round}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Initials name={ARENA.match.a.name} color={ARENA.match.a.color} />
                  <span className="flex-1 truncate text-[13px] font-semibold text-accent">{ARENA.match.a.name}</span>
                  <span className="font-display text-lg font-bold tnum text-accent">{ARENA.match.scoreA}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Initials name={ARENA.match.b.name} color={ARENA.match.b.color} />
                  <span className="flex-1 truncate text-[13px] text-muted">{ARENA.match.b.name}</span>
                  <span className="font-display text-lg font-bold tnum text-muted">{ARENA.match.scoreB}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gold/25 bg-gold/[.06] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] text-gold/80">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                جایزه در escrow
              </p>
              <p className="font-display text-lg font-bold tnum text-gold">{ARENA.escrow}</p>
              <p className="mt-1 text-[11px] leading-5 text-faint">قفل‌شده تا تأییدِ نتیجه و بسته‌شدنِ اختلاف‌ها</p>
            </div>
          </div>

          {/* مینی‌براکت */}
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <p className="mb-2 text-[11px] text-faint">براکتِ زنده · {ARENA.round}</p>
            <div className="grid grid-cols-2 gap-2">
              {ARENA.bracket.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/[.07] bg-white/[.02] p-2 text-[11px]">
                  <div className={`flex items-center justify-between ${m.win === 'a' ? 'text-accent' : 'text-muted'}`}>
                    <span className="truncate">{m.a}</span><span className="tnum font-bold">{m.sa}</span>
                  </div>
                  <div className={`mt-0.5 flex items-center justify-between ${m.win === 'b' ? 'text-accent' : 'text-muted'}`}>
                    <span className="truncate">{m.b}</span><span className="tnum font-bold">{m.sb}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* شرکت‌کننده‌ها */}
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="text-faint">شرکت‌کننده‌ها</span>
              <span className="tnum text-text">{ARENA.participants.current.toLocaleString('fa-IR')} / {ARENA.participants.capacity.toLocaleString('fa-IR')}</span>
            </div>
            <div className="pbar"><span style={{ width: `${pct}%` }} /></div>
          </div>

          {/* فعالیت */}
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] text-faint">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" /></span>
              فعالیتِ زنده
            </p>
            <ul className="space-y-1.5">
              {LANDING_ACTIVITY.slice(0, 3).map((a, i) => (
                <li key={a.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-colors duration-500 ${i === hi % 3 ? 'bg-white/[.04] text-slate-200' : 'text-muted'}`}>
                  <span className={`h-1.5 w-1.5 flex-none rounded-full ${ACTIVITY_DOT[a.kind]}`} />
                  <span className="flex-1 truncate">{a.text}</span>
                  <span className="flex-none text-[10px] text-faint">{a.at}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
