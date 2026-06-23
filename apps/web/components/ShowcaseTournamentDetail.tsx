'use client';

import Link from 'next/link';
import { SHOWCASE_TOURNAMENTS, STATUS_META, showcaseById } from '@/lib/landingShowcase';

const TONE: Record<string, string> = {
  live: 'border-bad/40 bg-bad/15 text-[#fca5a5]',
  open: 'border-accent/40 bg-accent/15 text-[#5eead4]',
  soon: 'border-gold/40 bg-gold/15 text-gold',
  done: 'border-line bg-tile2 text-muted',
};

export function ShowcaseTournamentDetail({ id }: { id: string }) {
  const t = showcaseById(id);
  if (!t)
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <p className="font-display text-lg font-bold">تورنومنت پیدا نشد</p>
          <Link href="/tournaments" className="btn-primary mt-4 px-5 py-2.5">مشاهده‌ی همه‌ی تورنومنت‌ها</Link>
        </div>
      </div>
    );

  const m = STATUS_META[t.status];
  const pct = t.capacity ? Math.round((t.participants / t.capacity) * 100) : 0;
  const others = SHOWCASE_TOURNAMENTS.filter((x) => x.id !== t.id).slice(0, 3);
  const primary = t.status === 'registration_open' ? { label: 'ورود برای ثبت‌نام', href: '/login' } : t.status === 'live' ? { label: 'مشاهده‌ی زنده', href: '/login' } : { label: 'مشاهده‌ی نتایج', href: '/login' };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link href="/tournaments" className="mb-5 inline-flex items-center gap-1.5 text-sm text-faint transition hover:text-text">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
        همه‌ی تورنومنت‌ها
      </Link>

      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-tile">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(60% 80% at 20% 0%, ${t.accent}40, transparent)` }} />
        {t.cover && <img src={t.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
        <div className="relative p-6 md:p-9">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${TONE[m.tone]}`}>
              {t.status === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
              {m.label}
            </span>
            <span className="text-xs text-faint">{t.game} · {t.platform} · {t.format}</span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight md:text-4xl">{t.title}</h1>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">جایزه</p><p className="mt-0.5 font-display text-base font-bold text-gold">{t.prize}</p></div>
            <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">شرکت‌کننده‌ها</p><p className="mt-0.5 font-display text-base font-bold tnum">{t.participants.toLocaleString('fa-IR')} / {t.capacity.toLocaleString('fa-IR')}</p></div>
            <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">پلتفرم</p><p className="mt-0.5 font-display text-base font-bold">{t.platform}</p></div>
            <div className="rounded-xl border border-line bg-tile2 p-3"><p className="text-[11px] text-faint">فرمت</p><p className="mt-0.5 font-display text-base font-bold">{t.format}</p></div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-faint"><span>ظرفیت</span><span className="tnum">{pct}٪</span></div>
            <div className="pbar"><span style={{ width: `${pct}%` }} /></div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={primary.href} className="btn-primary px-5 py-2.5">{primary.label}</Link>
            <Link href="/register" className="btn-ghost px-5 py-2.5">ثبت‌نام رایگان</Link>
          </div>
          <p className="mt-3 text-xs leading-6 text-faint">تورنومنت‌های رسمیِ SHELTER؛ برای شرکت یا دنبال‌کردنِ براکت، وارد شو یا ثبت‌نام کن.</p>
        </div>
      </div>

      {/* others */}
      {others.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 font-display text-sm font-bold text-muted">تورنومنت‌های دیگر</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.id} href={o.href} className="group rounded-2xl border border-line bg-tile p-4 transition hover:border-accent-dim hover:shadow-[0_16px_40px_-20px_rgba(45,212,191,.28)]">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${TONE[STATUS_META[o.status].tone]}`}>{STATUS_META[o.status].label}</span>
                <p className="mt-2 truncate font-display text-sm font-bold">{o.title}</p>
                <p className="text-[11px] text-faint">{o.game} · {o.prize}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
