'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ADMIN_TOURNAMENTS, fmt } from '@/lib/admin';
import { buildTournamentOps, STREAM_STATUS_FA, type StreamSession } from '@/lib/admin/tournamentOps';

// ───────── helpers ─────────
const clock = (iso: string) => new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

function Avatar({ initials, color, size = 'h-11 w-11 text-base' }: { initials: string; color: string; size?: string }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-xl font-display font-bold text-white shadow-lg`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
    >
      {initials}
    </span>
  );
}

function Equalizer() {
  // اکولایزرِ متحرکِ زنده — صرفاً نمایشِ «در حالِ پخش»
  const bars = [0, 1, 2, 3, 4, 5, 6];
  return (
    <span className="flex items-end gap-[3px]" aria-hidden="true">
      {bars.map((b) => (
        <span
          key={b}
          className="w-[3px] rounded-full bg-bad/80"
          style={{ height: 14, animation: `eq 0.9s ${b * 0.12}s ease-in-out infinite alternate` }}
        />
      ))}
    </span>
  );
}

export default function Page() {
  const id = String(useParams().id);
  const t = useMemo(() => ADMIN_TOURNAMENTS.find((x) => x.id === id), [id]);
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t]);

  // جلسه‌ی زنده‌ی فعال (در صورتِ نبودِ live، اولین جلسه)
  const session: StreamSession | null = useMemo(() => {
    if (!ops) return null;
    const list = ops.stream.sessions;
    if (!list.length) return null;
    return list.find((s) => s.status === 'live') ?? list[0];
  }, [ops]);

  // نامِ دور/براکتِ جاری برای زمینه‌ی مسابقه
  const roundLabel = useMemo(() => {
    if (!ops) return '';
    return (ops.schedule.find((r) => r.status === 'current') ?? ops.schedule.find((r) => r.status === 'blocked'))?.name ?? ops.schedule[0]?.name ?? '';
  }, [ops]);

  // امتیازِ زنده‌ی نمایشی (ثابت برای رفرش، مشتق از matchId)
  const score = useMemo(() => {
    if (!session) return [0, 0] as const;
    const seed = session.matchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return [seed % 4, (seed >> 2) % 4] as const;
  }, [session]);

  // گزارشِ مشکلِ پخش — تأییدِ درون‌خطی، بدونِ استورِ مدیریت
  const [reported, setReported] = useState(false);
  // ساعتِ زنده برای حسِ واقعی‌بودنِ صفحه
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, []);

  // ───────── حالتِ خالی: تورنومنت یا پخشِ زنده‌ای نیست ─────────
  if (!t || !ops || !session) {
    return (
      <main dir="rtl" className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-tile p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-tile2 text-faint">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m23 7-7 5 7 5z" /><rect x="1" y="5" width="15" height="14" rx="2" /><path d="M2 2 22 22" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold">در حالِ حاضر پخشِ زنده‌ای موجود نیست</h2>
          <p className="mt-1.5 text-sm text-muted">هیچ مسابقه‌ای روی این تورنومنت در حالِ پخش نیست. لطفاً بعداً سر بزنید.</p>
          <Link href="/tournaments" className="btn-primary mx-auto mt-6 inline-flex px-5 py-2.5 text-sm">
            بازگشت به تورنومنت‌ها
          </Link>
        </div>
      </main>
    );
  }

  const isLive = session.status === 'live';
  const upcoming = ops.stream.sessions.filter((s) => s.matchId !== session.matchId);
  const chatMessages = ops.stream.config.chatOverlay ? ops.chat.messages.slice(-5) : [];

  // آواتار/رنگِ دو بازیکنِ مسابقه‌ی روی پخش، از روی نامِ نمایشی
  const findP = (name: string) => ops.participants.find((p) => p.displayName === name);
  const pa = findP(session.a);
  const pb = findP(session.b);

  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {/* ===== برندینگِ صفحه‌ی عمومی ===== */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="live-pill">
              <span className="dot" /> زنده
            </span>
            <span className="chip bg-tile2 text-muted tnum" title="ساعتِ محلی">{now}</span>
          </div>
          <h1 className="truncate font-display text-xl font-bold md:text-2xl">{t.title}</h1>
          <p className="mt-0.5 text-sm text-muted">{t.game} · {ops.stream.config.title}</p>
        </div>
        <Link href={`/tournaments/${id}`} className="btn-ghost shrink-0 px-3 py-2 text-sm">
          صفحه‌ی تورنومنت
        </Link>
      </header>

      {/* ===== پخش‌کننده‌ی ویدیوی نمایشی (۱۶:۹) ===== */}
      <section className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,#16323a_0%,#0b0d12_60%)]" />
        {/* گلیفِ پخشِ مرکزی */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-accent-dim bg-black/40 text-accent shadow-[0_0_60px_-10px_rgba(45,212,191,.6)] backdrop-blur-sm">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
          </div>
        </div>

        {/* چیپِ LIVE + شمارِ بیننده — بالا/شروع ===== */}
        <div className="absolute start-3 top-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-extrabold tracking-wide ${isLive ? 'bg-bad text-white' : 'bg-tile2 text-muted'}`}>
            {isLive && <span className="h-2 w-2 animate-pulse rounded-full bg-white" />}
            {isLive ? 'LIVE' : STREAM_STATUS_FA[session.status]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm tnum">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            {fmt(session.viewers)}
          </span>
        </div>

        {/* اکولایزرِ بالا/پایان ===== */}
        <div className="absolute end-3 top-3 rounded-md bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
          <Equalizer />
        </div>

        {/* پوششِ پایین: عنوانِ مسابقه + نوارِ کنترلِ نمایشی ===== */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-4 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{roundLabel} · مسابقه‌ی {session.number}</p>
              <p className="truncate font-display text-base font-bold text-white md:text-lg">{session.a} <span className="text-faint">در برابرِ</span> {session.b}</p>
              {session.caster && <p className="mt-0.5 text-xs text-accent">{session.caster}</p>}
            </div>
            {/* نوارِ کنترلِ نمایشی */}
            <div className="flex items-center gap-3 text-white/90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg>
              <span className="inline-flex items-center gap-1.5 rounded bg-bad/20 px-2 py-0.5 text-[10px] font-bold text-[#fca5a5]"><span className="h-1.5 w-1.5 rounded-full bg-bad" /> تأخیرِ {session.latency.toLocaleString('fa-IR')} ثانیه</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ===== پنلِ اطلاعاتِ مسابقه + امتیازِ زنده ===== */}
      <section className="rounded-2xl border border-line bg-tile p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">مسابقه‌ی روی پخش</h2>
          <span className="chip bg-tile2 text-muted">{roundLabel}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar initials={pa?.initials ?? session.a.slice(0, 2)} color={pa?.color ?? '#2dd4bf'} />
            <div className="min-w-0">
              <p className="truncate font-bold">{session.a}</p>
              {pa && <p className="truncate text-xs text-faint">{pa.username}</p>}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 font-display text-3xl font-bold tnum">
              <span className={score[0] >= score[1] ? 'text-accent' : 'text-text'}>{fmt(score[0])}</span>
              <span className="text-faint">-</span>
              <span className={score[1] >= score[0] ? 'text-accent' : 'text-text'}>{fmt(score[1])}</span>
            </div>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-faint">امتیازِ زنده</span>
          </div>
          <div className="flex min-w-0 flex-row-reverse items-center gap-3 text-start">
            <Avatar initials={pb?.initials ?? session.b.slice(0, 2)} color={pb?.color ?? '#fbbf24'} />
            <div className="min-w-0 text-end">
              <p className="truncate font-bold">{session.b}</p>
              {pb && <p className="truncate text-xs text-faint">{pb.username}</p>}
            </div>
          </div>
        </div>
        {/* نوارِ آماری زنده */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <p className="font-display text-base font-bold tnum">{fmt(session.viewers)}</p>
            <p className="text-[11px] text-faint">بیننده</p>
          </div>
          <div>
            <p className="font-display text-base font-bold tnum">{fmt(session.bitrate)}<span className="text-xs text-faint"> kbps</span></p>
            <p className="text-[11px] text-faint">نرخِ بیت</p>
          </div>
          <div>
            <p className={`font-display text-base font-bold tnum ${session.dropped > 5 ? 'text-gold' : 'text-good'}`}>{fmt(session.dropped)}</p>
            <p className="text-[11px] text-faint">فریمِ افتاده</p>
          </div>
        </div>
      </section>

      {/* ===== مسابقاتِ بعدی + (در صورتِ وجود) چتِ فقط‌خواندنی ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-tile p-4 lg:col-span-2">
          <h2 className="mb-1 font-display text-lg font-bold">مسابقاتِ بعدی</h2>
          <p className="mb-3 text-xs text-faint">به‌محضِ شروع، پخش به این مسابقات می‌رود.</p>
          {upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-tile2 px-4 py-8 text-center text-sm text-muted">
              فعلاً مسابقه‌ی دیگری در صفِ پخش نیست.
            </div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li key={s.matchId} className="row-soft flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="chip bg-tile2 text-faint tnum">{s.number}</span>
                    <span className="truncate text-sm">{s.a} <span className="text-faint">در برابرِ</span> {s.b}</span>
                  </div>
                  <span className={`chip ${s.status === 'live' ? 'bg-bad/15 text-[#fca5a5]' : 'bg-tile2 text-muted'}`}>{STREAM_STATUS_FA[s.status]}</span>
                </li>
              ))}
            </ul>
          )}

          {/* گزارشِ مشکلِ پخش — تأییدِ درون‌خطی */}
          <div className="mt-4 border-t border-line pt-3">
            {reported ? (
              <p className="flex items-center gap-2 rounded-xl border border-good/30 bg-good/10 px-3 py-2.5 text-sm text-good">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                گزارشِ شما ثبت شد — با تشکر، تیمِ فنی بررسی می‌کند.
              </p>
            ) : (
              <button onClick={() => setReported(true)} className="btn-ghost border-bad/40 px-3 py-2 text-sm text-bad hover:border-bad">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                گزارشِ مشکلِ پخش
              </button>
            )}
          </div>
        </section>

        {/* چتِ فقط‌خواندنیِ سبک (تنها اگر chatOverlay فعال باشد) */}
        <section className="rounded-2xl border border-line bg-tile p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold">گفتگوی زنده</h2>
            <span className="chip bg-tile2 text-faint">فقط‌خواندنی</span>
          </div>
          {chatMessages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-tile2 px-4 py-8 text-center text-sm text-muted">
              {ops.stream.config.chatOverlay ? 'هنوز پیامی در گفتگو نیست.' : 'گفتگوی روی پخش غیرفعال است.'}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {chatMessages.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className={`font-bold ${m.role === 'admin' ? 'text-accent' : m.role === 'system' ? 'text-gold' : 'text-text'}`}>{m.author}</span>
                  <span className="ms-1 text-[10px] text-faint tnum">{clock(m.at)}</span>
                  <p className="mt-0.5 leading-relaxed text-muted">{m.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <style jsx global>{`
        @keyframes eq {
          0% { height: 4px; opacity: 0.6; }
          100% { height: 16px; opacity: 1; }
        }
      `}</style>
    </main>
  );
}
