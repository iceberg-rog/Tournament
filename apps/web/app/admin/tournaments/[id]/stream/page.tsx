'use client';

// اتاقِ کنترلِ پخشِ زنده — mock و adapter-ready. حتی بدونِ backend هم شروع/توقفِ
// پخش واقعاً state را تغییر می‌دهد و در localStorage پایدار می‌ماند (refresh-safe).
// تنظیماتِ استریم، فهرستِ مسابقاتِ زنده، پخش‌کننده‌ی آزمایشی و سلامتِ سیگنال.

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTournament, useAdminRole, pushToast, appendAudit } from '@/lib/admin/store';
import { buildTournamentOps, STREAM_STATUS_FA, type StreamSession, type StreamConfig, type StreamStatus } from '@/lib/admin/tournamentOps';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { Drawer } from '@/components/admin/cr/Drawer';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { fmt, type Tone } from '@/lib/admin';

const STATUS_TONE: Record<StreamStatus, Tone> = {
  offline: 'muted',
  starting: 'gold',
  live: 'bad',
  degraded: 'gold',
  ended: 'muted',
};

const SOURCE_FA: Record<StreamConfig['source'], string> = {
  internal_mock_stream: 'استریمِ آزمایشیِ داخلی',
  rtmp: 'RTMP',
  hls: 'HLS',
  custom: 'سفارشی',
};
const VIS_FA: Record<StreamConfig['visibility'], string> = {
  public: 'عمومی',
  participants: 'شرکت‌کننده‌ها',
  admins: 'فقط مدیران',
};
const LATENCY_FA: Record<StreamConfig['latency'], string> = { low: 'کم (Low)', normal: 'معمولی (Normal)' };

const clock = (iso: string) => new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

export default function Page() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t]);

  const [config, setConfig] = useOpsSlice<StreamConfig>(id, 'stream-config', ops?.stream.config ?? {
    enabled: false, source: 'internal_mock_stream', title: '', streamKey: '', ingestUrl: '', playbackUrl: '', latency: 'low', visibility: 'public', recording: false, vod: false, chatOverlay: true,
  });
  const [sessions, setSessions] = useOpsSlice<StreamSession[]>(id, 'stream-sessions', ops?.stream.sessions ?? []);

  const [revealKey, setRevealKey] = useState(false);
  const [preview, setPreview] = useState<StreamSession | null>(null);

  if (!t || !ops) return null;

  // ───────── computed overview ─────────
  const liveSessions = sessions.filter((s) => s.status === 'live');
  const totalViewers = liveSessions.reduce((acc, s) => acc + s.viewers, 0);
  const anyDegraded = liveSessions.some((s) => s.status === 'degraded' || s.dropped > 30 || s.latency > 4);
  const healthLabel = liveSessions.length === 0 ? 'بی‌کار' : anyDegraded ? 'افتِ کیفیت' : 'سالم';
  const healthTone: Tone = liveSessions.length === 0 ? 'muted' : anyDegraded ? 'gold' : 'good';
  const primary = liveSessions[0];

  // ───────── audit + toast helpers ─────────
  function audit(action: string, entityId: string, reason?: string) {
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action, entityType: entityId === id ? 'tournament' : 'match', entityId, reason });
  }

  function patchConfig(p: Partial<StreamConfig>, reason: string) {
    setConfig((prev) => ({ ...prev, ...p }));
    audit('تنظیماتِ استریم به‌روزرسانی شد', id, reason);
    pushToast({ kind: 'success', msg: 'تنظیماتِ استریم به‌روزرسانی شد' });
  }

  async function copy(label: string, value: string) {
    if (!value) {
      pushToast({ kind: 'info', msg: 'مقداری برای کپی وجود ندارد' });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      pushToast({ kind: 'success', msg: `${label} کپی شد` });
    } catch {
      pushToast({ kind: 'info', msg: 'کپی ممکن نشد — دستی کپی کنید' });
    }
  }

  function patchSession(matchId: string, p: Partial<StreamSession>) {
    setSessions((prev) => prev.map((s) => (s.matchId === matchId ? { ...s, ...p } : s)));
  }

  function startStream(s: StreamSession, idx: number) {
    const viewers = 1200 + ((idx * 137) % 600);
    patchSession(s.matchId, { status: 'live', viewers, bitrate: 6000, latency: 2.1, dropped: 3 });
    setPreview((prev) => (prev && prev.matchId === s.matchId ? { ...prev, status: 'live', viewers, bitrate: 6000, latency: 2.1, dropped: 3 } : prev));
    audit('شروعِ پخشِ زنده', s.matchId, `مسابقه ${s.number}`);
    pushToast({ kind: 'success', msg: `پخشِ مسابقه ${s.number} زنده شد` });
  }

  function stopStream(s: StreamSession) {
    patchSession(s.matchId, { status: 'ended', viewers: 0, bitrate: 0, latency: 0, dropped: 0 });
    setPreview((prev) => (prev && prev.matchId === s.matchId ? { ...prev, status: 'ended', viewers: 0, bitrate: 0, latency: 0, dropped: 0 } : prev));
    audit('توقفِ پخشِ زنده', s.matchId, `مسابقه ${s.number}`);
    pushToast({ kind: 'info', msg: `پخشِ مسابقه ${s.number} متوقف شد` });
  }

  function assignCaster(s: StreamSession) {
    const current = (s.caster ?? '').replace(/^کستر:\s*/, '');
    const name = window.prompt('نامِ کسترِ مسئولِ این مسابقه را وارد کنید:', current)?.trim();
    if (name === undefined || name === null) return;
    const caster = name ? `کستر: ${name}` : undefined;
    patchSession(s.matchId, { caster });
    setPreview((prev) => (prev && prev.matchId === s.matchId ? { ...prev, caster } : prev));
    audit('واگذاریِ کستر', s.matchId, name ? `کستر: ${name}` : 'کستر برداشته شد');
    pushToast({ kind: name ? 'success' : 'info', msg: name ? `کستر «${name}» به مسابقه ${s.number} واگذار شد` : 'کستر برداشته شد' });
  }

  return (
    <div className="space-y-4">
      {/* heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">استریمِ زنده</h2>
          <p className="mt-0.5 text-xs text-faint">راه‌اندازی، کنترل و سلامتِ پخشِ زنده‌ی مسابقات</p>
        </div>
        <Link
          href={`/tournaments/${id}/live`}
          target="_blank"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M10 8.5 16 12l-6 3.5z" fill="currentColor" stroke="none" />
            <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
          </svg>
          صفحه‌ی پخشِ عمومی
        </Link>
      </div>

      {/* A. OVERVIEW summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label="وضعیتِ کلی"
          value={config.enabled ? 'فعال' : 'غیرفعال'}
          tone={config.enabled ? 'accent' : 'muted'}
          hint={SOURCE_FA[config.source]}
        />
        <Stat
          label="مسابقاتِ زنده"
          value={fmt(liveSessions.length)}
          tone={liveSessions.length > 0 ? 'bad' : 'muted'}
          hint={`از ${fmt(sessions.length)} مسابقه`}
        />
        <Stat
          label="کلِ بینندگان"
          value={fmt(totalViewers)}
          tone={totalViewers > 0 ? 'good' : 'muted'}
          hint="بینندگانِ هم‌زمان"
        />
        <Stat label="سلامت" value={healthLabel} tone={healthTone} hint={liveSessions.length > 0 ? 'پایشِ سیگنال' : 'هیچ پخشِ فعالی'} />
        <Stat
          label="ضبط"
          value={config.recording ? 'روشن' : 'خاموش'}
          tone={config.recording ? 'good' : 'muted'}
          hint={config.vod ? 'VOD فعال' : 'بدونِ VOD'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* B. SETUP */}
        <section className="rounded-2xl border border-line bg-tile p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-accent">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.18-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              تنظیماتِ استریم
            </h3>
            <AdminBadge label={config.enabled ? 'فعال' : 'غیرفعال'} tone={config.enabled ? 'accent' : 'muted'} dot={config.enabled} />
          </div>

          {/* enable toggle */}
          <Toggle
            label="فعال‌سازیِ استریم"
            hint="بدونِ فعال‌سازی، صفحه‌ی پخشِ عمومی پیامِ آفلاین نشان می‌دهد."
            on={config.enabled}
            onChange={(v) => patchConfig({ enabled: v }, v ? 'استریم فعال شد' : 'استریم غیرفعال شد')}
          />

          {/* source */}
          <Field label="منبعِ پخش">
            <select
              value={config.source}
              onChange={(e) => patchConfig({ source: e.target.value as StreamConfig['source'] }, `منبع: ${SOURCE_FA[e.target.value as StreamConfig['source']]}`)}
              className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
            >
              {(Object.keys(SOURCE_FA) as StreamConfig['source'][]).map((s) => (
                <option key={s} value={s}>{SOURCE_FA[s]}</option>
              ))}
            </select>
          </Field>

          {/* title */}
          <Field label="عنوانِ پخش">
            <input
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              onBlur={(e) => patchConfig({ title: e.target.value.trim() }, `عنوان: ${e.target.value.trim() || '—'}`)}
              placeholder="مثلاً: فینالِ FC26 Champions Cup"
              className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
            />
          </Field>

          {/* stream key (masked) */}
          <Field label="کلیدِ استریم">
            <div className="flex gap-1.5">
              <input
                type={revealKey ? 'text' : 'password'}
                value={config.streamKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, streamKey: e.target.value }))}
                onBlur={(e) => patchConfig({ streamKey: e.target.value.trim() }, 'کلیدِ استریم تغییر کرد')}
                placeholder="sk_live_…"
                className="min-w-0 flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 font-mono text-sm outline-none focus:border-accent-dim"
              />
              <button
                onClick={() => setRevealKey((v) => !v)}
                className="chip flex-none border border-line bg-tile2 text-muted hover:text-text"
                title={revealKey ? 'پنهان‌کردن' : 'نمایش'}
              >
                {revealKey ? 'پنهان' : 'نمایش'}
              </button>
              <button
                onClick={() => copy('کلیدِ استریم', config.streamKey)}
                className="chip flex-none border border-line bg-tile2 text-muted hover:text-text"
              >
                کپی
              </button>
            </div>
          </Field>

          {/* ingest url (read-only + copy) */}
          <Field label="آدرسِ ingest">
            <ReadonlyCopy value={config.ingestUrl} placeholder="rtmp://ingest…" onCopy={() => copy('آدرسِ ingest', config.ingestUrl)} />
          </Field>

          {/* playback url (read-only + copy) */}
          <Field label="آدرسِ پخش">
            <ReadonlyCopy value={config.playbackUrl} placeholder="https://…/live" onCopy={() => copy('آدرسِ پخش', config.playbackUrl)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="دیداری‌بودن">
              <select
                value={config.visibility}
                onChange={(e) => patchConfig({ visibility: e.target.value as StreamConfig['visibility'] }, `دیداری‌بودن: ${VIS_FA[e.target.value as StreamConfig['visibility']]}`)}
                className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
              >
                {(Object.keys(VIS_FA) as StreamConfig['visibility'][]).map((v) => (
                  <option key={v} value={v}>{VIS_FA[v]}</option>
                ))}
              </select>
            </Field>
            <Field label="تأخیر">
              <select
                value={config.latency}
                onChange={(e) => patchConfig({ latency: e.target.value as StreamConfig['latency'] }, `تأخیر: ${LATENCY_FA[e.target.value as StreamConfig['latency']]}`)}
                className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
              >
                {(Object.keys(LATENCY_FA) as StreamConfig['latency'][]).map((l) => (
                  <option key={l} value={l}>{LATENCY_FA[l]}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-2 rounded-xl border border-line bg-tile2/40 p-3">
            <Toggle compact label="ضبطِ پخش" on={config.recording} onChange={(v) => patchConfig({ recording: v }, v ? 'ضبط روشن شد' : 'ضبط خاموش شد')} />
            <Toggle compact label="آرشیوِ VOD پس از پایان" on={config.vod} onChange={(v) => patchConfig({ vod: v }, v ? 'VOD روشن شد' : 'VOD خاموش شد')} />
            <Toggle compact label="نمایشِ چت روی پخش" on={config.chatOverlay} onChange={(v) => patchConfig({ chatOverlay: v }, v ? 'چت‌اورلِی روشن شد' : 'چت‌اورلِی خاموش شد')} />
          </div>

          <p className="text-[11px] text-faint">این بخش mock و adapter-ready است؛ برای پخشِ واقعی به سرورِ RTMP/HLS نیاز است.</p>
        </section>

        {/* C + D right column */}
        <div className="space-y-4">
          {/* D. HEALTH */}
          <section className="rounded-2xl border border-line bg-tile p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-accent">
                  <path d="M3 12h4l2 6 4-14 2 8h6" />
                </svg>
                سلامتِ پخش
              </h3>
              {primary && <AdminBadge label={STREAM_STATUS_FA[primary.status]} tone={STATUS_TONE[primary.status]} dot />}
            </div>
            {primary ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  پایشِ مسابقه <span className="tnum font-semibold text-text">{primary.number}</span> — {primary.a} <span className="text-faint">در برابر</span> {primary.b}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="بیت‌ریت" value={`${fmt(primary.bitrate)}`} unit="kbps" ok={primary.bitrate >= 4000} />
                  <Metric label="تأخیر" value={fmt(primary.latency)} unit="ثانیه" ok={primary.latency <= 3} />
                  <Metric label="فریمِ افتاده" value={fmt(primary.dropped)} unit="فریم" ok={primary.dropped <= 20} />
                  <Metric label="بینندگان" value={fmt(primary.viewers)} unit="نفر" ok />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-line bg-tile2/50 px-3 py-2 text-xs">
                  <span className="text-faint">آخرین سیگنال: همین حالا</span>
                  <span className={anyDegraded ? 'font-semibold text-gold' : 'font-semibold text-good'}>
                    {anyDegraded ? 'افتِ کیفیت — بررسیِ شبکه' : 'سیگنال پایدار است'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-line bg-tile2/30 px-4 py-10 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-tile2 text-faint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M3 12h4l2 6 4-14 2 8h6" />
                  </svg>
                </span>
                <p className="text-sm font-bold">هیچ پخشِ زنده‌ای فعال نیست</p>
                <p className="mt-1 max-w-xs text-xs text-faint">برای دیدنِ سلامتِ سیگنال، پخشِ یکی از مسابقه‌های پایین را شروع کنید.</p>
              </div>
            )}
          </section>

          {/* C. LIVE MATCHES */}
          <section className="rounded-2xl border border-line bg-tile p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-accent">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
                  <path d="M10 8.5 16 12l-6 3.5z" fill="currentColor" stroke="none" />
                </svg>
                مسابقاتِ قابلِ پخش
              </h3>
              <span className="text-xs text-faint tnum">{fmt(liveSessions.length)} زنده / {fmt(sessions.length)} کل</span>
            </div>

            {sessions.length === 0 ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-line bg-tile2/30 px-4 py-10 text-center">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-tile2 text-faint">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
                    <path d="M10 8.5 16 12l-6 3.5z" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <p className="text-sm font-bold">مسابقه‌ای برای پخش وجود ندارد</p>
                <p className="mt-1 max-w-xs text-xs text-faint">وقتی مسابقه‌ها وارد مرحله‌ی زنده شوند، اینجا برای شروعِ پخش نمایش داده می‌شوند.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {sessions.map((s, idx) => {
                  const live = s.status === 'live';
                  return (
                    <li key={s.matchId} className="rounded-xl border border-line bg-tile2/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="tnum rounded-md border border-line bg-tile px-1.5 py-0.5 text-[11px] text-muted">{s.number}</span>
                          <span className="truncate text-sm font-semibold">
                            {s.a} <span className="text-faint">در برابر</span> {s.b}
                          </span>
                        </div>
                        <AdminBadge label={STREAM_STATUS_FA[s.status]} tone={STATUS_TONE[s.status]} dot={live} />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-faint">
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                          </svg>
                          <span className="tnum">{fmt(s.viewers)}</span> بیننده
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 1v3M12 14a3 3 0 0 0 3-3V4a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 18v3" />
                          </svg>
                          {s.caster ? s.caster.replace(/^کستر:\s*/, '') : 'بدونِ کستر'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {live ? (
                          <button
                            onClick={() => stopStream(s)}
                            className="rounded-lg border border-bad/30 px-2.5 py-1 text-xs font-semibold text-[#fca5a5] transition hover:bg-bad/10"
                          >
                            توقفِ پخش
                          </button>
                        ) : (
                          <button
                            onClick={() => startStream(s, idx)}
                            className="rounded-lg border border-good/30 px-2.5 py-1 text-xs font-semibold text-good transition hover:bg-good/10"
                          >
                            شروعِ پخش
                          </button>
                        )}
                        <button
                          onClick={() => assignCaster(s)}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white"
                        >
                          واگذاریِ کستر
                        </button>
                        <button
                          onClick={() => setPreview(s)}
                          className="ms-auto rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-accent-dim hover:text-white"
                        >
                          پیش‌نمایش
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* preview drawer */}
      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={<h3 className="font-display text-base font-bold">پیش‌نمایشِ پخش</h3>}
        subtitle={preview ? `مسابقه ${preview.number} — ${preview.a} در برابر ${preview.b}` : undefined}
        width={560}
      >
        {preview && (
          <div className="space-y-4">
            <MockPlayer session={preview} title={config.title || t.title} />
            <div className="grid grid-cols-2 gap-2">
              <Metric label="وضعیت" value={STREAM_STATUS_FA[preview.status]} ok={preview.status === 'live'} />
              <Metric label="بینندگان" value={fmt(preview.viewers)} unit="نفر" ok />
              <Metric label="بیت‌ریت" value={fmt(preview.bitrate)} unit="kbps" ok={preview.bitrate >= 4000} />
              <Metric label="تأخیر" value={fmt(preview.latency)} unit="ثانیه" ok={preview.latency <= 3} />
            </div>
            <div className="flex gap-2">
              {preview.status === 'live' ? (
                <button onClick={() => stopStream(preview)} className="btn-danger flex-1 px-3 py-2 text-sm">توقفِ پخش</button>
              ) : (
                <button
                  onClick={() => startStream(preview, sessions.findIndex((x) => x.matchId === preview.matchId))}
                  className="btn-primary flex-1 px-3 py-2 text-sm"
                >
                  شروعِ پخش
                </button>
              )}
              <button onClick={() => assignCaster(preview)} className="btn-ghost px-3 py-2 text-sm">واگذاریِ کستر</button>
            </div>
            <p className="text-[11px] text-faint">پخشِ آزمایشیِ داخلی (internal mock stream) — ویدئوی واقعی نیست؛ برای پخشِ واقعی به سرورِ RTMP/HLS نیاز است.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ───────── MOCK PLAYER ─────────
function MockPlayer({ session, title }: { session: StreamSession; title: string }) {
  const live = session.status === 'live';
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-gradient-to-br from-[#0b1b1f] via-[#0a1417] to-black">
      {/* LIVE chip top-start */}
      {live && (
        <span className="absolute start-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-bad/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
      )}
      {/* title + score */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 pt-12">
        <p className="max-w-[70%] truncate text-xs font-semibold text-slate-200">{title}</p>
      </div>

      {/* center play glyph */}
      <div className="absolute inset-0 grid place-items-center">
        <span className={`grid h-16 w-16 place-items-center rounded-full border ${live ? 'border-accent-dim bg-accent/15 text-accent' : 'border-line bg-black/40 text-faint'}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.5 18 12 8 18.5z" />
          </svg>
        </span>
      </div>

      {/* score area */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-3">
        <span className="truncate text-sm font-bold text-text">{session.a}</span>
        <span className="tnum rounded-md border border-line bg-black/50 px-2 py-0.5 text-sm font-bold text-text">
          {live ? '۲ — ۱' : '— — —'}
        </span>
        <span className="truncate text-end text-sm font-bold text-text">{session.b}</span>
      </div>

      {/* equalizer bottom-end */}
      {live && (
        <div className="absolute bottom-12 end-3 z-10 flex items-end gap-0.5">
          {[10, 18, 8, 22, 14, 20].map((h, i) => (
            <span
              key={i}
              className="w-1 animate-pulse rounded-full bg-accent/80"
              style={{ height: h, animationDelay: `${i * 120}ms`, animationDuration: '900ms' }}
            />
          ))}
        </div>
      )}

      <span className="absolute end-3 top-3 z-10 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-faint">
        پخشِ آزمایشیِ داخلی (internal mock stream)
      </span>
    </div>
  );
}

// ───────── small primitives ─────────
function Stat({ label, value, tone, hint }: { label: string; value: string; tone: Tone; hint: string }) {
  const color: Record<Tone, string> = {
    accent: 'text-accent',
    good: 'text-good',
    bad: 'text-bad',
    gold: 'text-gold',
    muted: 'text-muted',
  };
  return (
    <div className="rounded-2xl border border-line bg-tile p-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`mt-1 truncate text-lg font-bold ${color[tone]}`}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-faint">{hint}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function ReadonlyCopy({ value, placeholder, onCopy }: { value: string; placeholder: string; onCopy: () => void }) {
  return (
    <div className="flex gap-1.5">
      <input
        readOnly
        value={value}
        placeholder={placeholder}
        className="min-w-0 flex-1 cursor-default rounded-lg border border-line bg-tile2/60 px-3 py-2 font-mono text-xs text-muted outline-none"
      />
      <button onClick={onCopy} className="chip flex-none border border-line bg-tile2 text-muted hover:text-text">کپی</button>
    </div>
  );
}

function Toggle({ label, hint, on, onChange, compact }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={`font-medium ${compact ? 'text-xs text-slate-200' : 'text-sm'}`}>{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 flex-none rounded-full border transition ${on ? 'border-accent-dim bg-accent/30' : 'border-line bg-tile2'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${on ? 'start-[22px] bg-accent' : 'start-0.5 bg-faint'}`} />
      </button>
    </div>
  );
}

function Metric({ label, value, unit, ok }: { label: string; value: string; unit?: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-tile2/50 px-2.5 py-2">
      <p className="text-[10px] text-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tnum ${ok ? 'text-good' : 'text-gold'}`}>
        {value}
        {unit && <span className="ms-1 text-[10px] font-normal text-faint">{unit}</span>}
      </p>
    </div>
  );
}
