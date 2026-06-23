'use client';

// اتاقِ کنترل — کابینِ روزِ مسابقه. هر دکمه کاری واقعی انجام می‌دهد:
// runAction برای اکشن‌های چرخه‌ی حیات، و local-state + toast + audit برای اکشن‌های سطحِ بخش.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { TOURNAMENT_STATUS_META, fmt, type Tone } from '@/lib/admin';
import {
  participantsFor,
  matchesFor,
  disputesFor,
  PARTICIPANT_FA,
  MATCH_FA,
  DISPUTE_FA,
  type Match,
  type MatchStatus,
  type Dispute,
  type DisputeStatus,
  type ParticipantStatus,
} from '@/lib/admin/fixtures';
import { can, type TournamentAction } from '@/lib/admin/ops';
import {
  useAdminRole,
  useTournament,
  runAction,
  pushToast,
  appendAudit,
} from '@/lib/admin/store';

// ───────── آیکن‌های خطی (SVG inline؛ بدونِ emoji) ─────────
const I = {
  play: <path d="M8 5v14l11-7z" />,
  pause: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h3" /></>,
  live: <><circle cx="12" cy="12" r="3" /><path d="M5 12a7 7 0 0 1 14 0" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></>,
  ghost: <><path d="M9 14s-1.5 1-3 0M15 14s1.5 1 3 0" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /></>,
  tree: <><rect x="3" y="9" width="5" height="6" rx="1" /><rect x="16" y="4" width="5" height="6" rx="1" /><rect x="16" y="14" width="5" height="6" rx="1" /><path d="M8 12h4v-5h4M12 12v5h4" /></>,
};

function Ic({ d, cls = '' }: { d: React.ReactNode; cls?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      {d}
    </svg>
  );
}

function CardHead({ icon, title, count, tone }: { icon: React.ReactNode; title: string; count?: number; tone?: Tone }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      <h2 className="font-display text-sm font-bold text-white">{title}</h2>
      {count != null && <AdminBadge label={fmt(count)} tone={tone ?? 'muted'} />}
    </div>
  );
}

const matchTone = (s: MatchStatus): Tone =>
  s === 'live' ? 'bad' : s === 'result_submitted' ? 'gold' : s === 'disputed' || s === 'admin_review' ? 'bad' : s === 'completed' ? 'good' : 'muted';
const disputeTone = (s: DisputeStatus): Tone => (s === 'open' ? 'bad' : s === 'under_review' ? 'gold' : s === 'resolved' ? 'good' : 'muted');

export default function ControlRoomPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  const role = useAdminRole();
  const [actorName, setActorName] = useState('مدیر سیستم');

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  // ───────── local patches (overlay روی fixtureها) ─────────
  const [matchPatch, setMatchPatch] = useState<Record<string, Partial<Match>>>({});
  const [disputePatch, setDisputePatch] = useState<Record<string, Partial<Dispute>>>({});
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [ann, setAnn] = useState({ title: '', body: '', target: 'all' });

  const baseMatches = useMemo(() => (t ? matchesFor(t) : []), [t]);
  const baseDisputes = useMemo(() => (t ? disputesFor(t) : []), [t]);
  const participants = useMemo(() => (t ? participantsFor(t) : []), [t]);

  if (!t) return null; // layout صفحه‌ی not-found را نشان می‌دهد

  const meta = TOURNAMENT_STATUS_META[t.status];
  const matches = baseMatches.map((m) => ({ ...m, ...matchPatch[m.id] }));
  const disputes = baseDisputes.map((d) => ({ ...d, ...disputePatch[d.id] }));

  const liveMatches = matches.filter((m) => m.status === 'live' || m.status === 'ready');
  const pendingResults = matches.filter((m) => m.status === 'result_submitted');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review');

  const maxRound = matches.reduce((mx, m) => Math.max(mx, m.round), 0);
  const currentRound = t.currentRound || maxRound;

  // شمارشِ شرکت‌کننده‌ها برای mini-stats
  const pCount = (...st: ParticipantStatus[]) => participants.filter((p) => st.includes(p.status)).length;
  const partStats: { label: string; value: number; tone: string }[] = [
    { label: PARTICIPANT_FA.registered, value: pCount('registered', 'waitlisted'), tone: 'text-accent' },
    { label: PARTICIPANT_FA.checked_in, value: pCount('checked_in', 'winner', 'eliminated'), tone: 'text-good' },
    { label: PARTICIPANT_FA.no_show, value: pCount('no_show'), tone: 'text-gold' },
    { label: PARTICIPANT_FA.disqualified, value: pCount('disqualified'), tone: 'text-bad' },
  ];

  // ───────── runAction helpers (lifecycle) ─────────
  const isPaused = t.status === 'paused';
  const pauseAction: TournamentAction = isPaused ? 'resume' : 'pause';
  const canPause = can(role, pauseAction);
  const canAnnounce = can(role, 'send_announcement');
  // «پایانِ تورنومنت» → اکشنِ end نداریم؛ از prepare_payout استفاده می‌کنیم (فقط در completed).
  const canPreparePayout = can(role, 'prepare_payout') && t.status === 'completed';

  function doPauseResume() {
    if (!canPause) return;
    if (!isPaused && !window.confirm('تورنومنت متوقف شود؟ مسابقاتِ زنده در حالتِ تعلیق قرار می‌گیرند.')) return;
    runAction(pauseAction, t!, { role, actorName, reason: isPaused ? undefined : 'توقفِ دستی از اتاقِ کنترل' });
  }
  function submitAnnounce() {
    if (!ann.title.trim() || !ann.body.trim()) {
      pushToast({ kind: 'error', msg: 'عنوان و متنِ اعلان الزامی است' });
      return;
    }
    const r = runAction('send_announcement', t!, { role, actorName, announcement: ann });
    if (r.ok) {
      setAnn({ title: '', body: '', target: 'all' });
      setAnnounceOpen(false);
    }
  }
  function doPreparePayout() {
    if (!canPreparePayout) return;
    if (!window.confirm('تورنومنت برای پرداختِ جوایز آماده شود؟')) return;
    runAction('prepare_payout', t!, { role, actorName });
  }

  // ───────── section actions (local + toast + audit) ─────────
  const canResult = can(role, 'review_results');
  const canDispute = can(role, 'review_disputes');

  function patchMatch(m: Match, patch: Partial<Match>, action: string, reason?: string) {
    setMatchPatch((prev) => ({ ...prev, [m.id]: { ...prev[m.id], ...patch } }));
    appendAudit({ actor: actorName, actorRole: role, action, entityType: 'match', entityId: m.id, reason });
  }
  function approveResult(m: Match) {
    if (!canResult) return;
    patchMatch(m, { status: 'completed' }, 'تأییدِ نتیجه', `${m.a} ${m.scoreA}–${m.scoreB} ${m.b}`);
    pushToast({ kind: 'success', msg: `نتیجه‌ی ${m.a} مقابل ${m.b} تأیید شد` });
  }
  function rejectResult(m: Match) {
    if (!canResult) return;
    if (!window.confirm('نتیجه رد شود و مسابقه برای ثبتِ مجدد بازگردد؟')) return;
    patchMatch(m, { status: 'ready', scoreA: 0, scoreB: 0, submittedBy: undefined }, 'ردِ نتیجه', 'نتیجه‌ی نامعتبر');
    pushToast({ kind: 'info', msg: `نتیجه‌ی ${m.a} مقابل ${m.b} رد شد` });
  }
  function saveScore(m: Match) {
    if (!canResult) return;
    patchMatch(m, { scoreA: scoreDraft.a, scoreB: scoreDraft.b, status: 'result_submitted' }, 'ویرایشِ امتیاز', `${scoreDraft.a}–${scoreDraft.b}`);
    pushToast({ kind: 'success', msg: `امتیازِ مسابقه به ${fmt(scoreDraft.a)}–${fmt(scoreDraft.b)} به‌روزرسانی شد` });
    setOpenMatch(null);
  }
  function markNoShow(m: Match) {
    if (!canResult) return;
    if (!window.confirm('عدمِ حضور برای این مسابقه ثبت شود؟')) return;
    patchMatch(m, { status: 'no_show' }, 'ثبتِ عدمِ حضور', 'یک طرف حاضر نشد');
    pushToast({ kind: 'info', msg: `عدمِ حضور برای ${m.a} مقابل ${m.b} ثبت شد` });
    setOpenMatch(null);
  }

  function patchDispute(d: Dispute, patch: Partial<Dispute>, action: string, reason?: string) {
    setDisputePatch((prev) => ({ ...prev, [d.id]: { ...prev[d.id], ...patch } }));
    appendAudit({ actor: actorName, actorRole: role, action, entityType: 'dispute', entityId: d.id, reason });
  }
  function assignDispute(d: Dispute) {
    if (!canDispute) return;
    patchDispute(d, { status: 'under_review' }, 'ارجاعِ اختلاف', `به ${actorName}`);
    pushToast({ kind: 'info', msg: 'اختلاف برای بررسی ارجاع شد' });
  }
  function resolveDispute(d: Dispute) {
    if (!canDispute) return;
    if (!window.confirm('این اختلاف حل‌شده علامت بخورد؟')) return;
    patchDispute(d, { status: 'resolved' }, 'حلِ اختلاف', 'بررسی و حل شد');
    pushToast({ kind: 'success', msg: 'اختلاف حل شد' });
  }

  const denyTitle = 'دسترسی لازم را ندارید';
  const card = 'rounded-2xl border border-line bg-tile p-5';
  const live = t.status === 'live' || t.status === 'dispute_review';

  return (
    <div className="space-y-4">
      {/* sticky sub-header — وضعیت + دورِ جاری + اکشن‌های سریع */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-tile/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-bad/10 text-bad"><Ic d={I.live} /></span>
          <div className="leading-tight">
            <h1 className="font-display text-sm font-bold text-white">اتاقِ کنترل</h1>
            <p className="text-[11px] text-faint">کابینِ مدیریتِ روزِ مسابقه</p>
          </div>
        </div>
        <span className="h-8 w-px bg-line" />
        <div className="flex items-center gap-2">
          <AdminBadge label={meta.label} tone={meta.tone} dot={live} />
          <span className="chip border border-line bg-tile2 text-muted">دورِ {fmt(currentRound)}{maxRound ? ` از ${fmt(maxRound)}` : ''}</span>
          <span className="chip border border-line bg-tile2 text-muted tnum">{fmt(liveMatches.length)} زنده · {fmt(pendingResults.length)} در انتظار · {fmt(openDisputes.length)} اختلاف</span>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <button
            onClick={doPauseResume}
            disabled={!canPause}
            title={canPause ? undefined : denyTitle}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isPaused ? 'border-good/30 text-good hover:bg-good/10' : 'border-gold/30 text-gold hover:bg-gold/10'
            }`}
          >
            <Ic d={isPaused ? I.play : I.pause} />
            {isPaused ? 'ادامه' : 'توقف'}
          </button>
          <button
            onClick={() => canAnnounce && setAnnounceOpen((v) => !v)}
            disabled={!canAnnounce}
            title={canAnnounce ? undefined : denyTitle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ic d={I.bell} />
            اعلان
          </button>
          <button
            onClick={doPreparePayout}
            disabled={!canPreparePayout}
            title={!can(role, 'prepare_payout') ? denyTitle : t.status !== 'completed' ? 'فقط پس از پایانِ تورنومنت فعال می‌شود' : undefined}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ic d={I.wallet} />
            پایانِ تورنومنت
          </button>
        </div>
      </div>

      {/* announcement composer (inline) */}
      {announceOpen && (
        <div className={card}>
          <CardHead icon={<Ic d={I.bell} />} title="ارسالِ اعلان" />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={ann.title}
              onChange={(e) => setAnn((s) => ({ ...s, title: e.target.value }))}
              placeholder="عنوانِ اعلان…"
              className="rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
            />
            <select
              value={ann.target}
              onChange={(e) => setAnn((s) => ({ ...s, target: e.target.value }))}
              className="rounded-lg border border-line bg-tile2 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-dim"
            >
              <option value="all">همه‌ی شرکت‌کننده‌ها</option>
              <option value="checked_in">چک‌این‌شده‌ها</option>
              <option value="live">مسابقاتِ زنده</option>
            </select>
          </div>
          <textarea
            value={ann.body}
            onChange={(e) => setAnn((s) => ({ ...s, body: e.target.value }))}
            placeholder="متنِ اعلان…"
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button onClick={() => setAnnounceOpen(false)} className="btn-ghost px-3 py-1.5 text-xs">انصراف</button>
            <button onClick={submitAnnounce} className="btn-primary px-4 py-1.5 text-xs">ارسالِ اعلان</button>
          </div>
        </div>
      )}

      {/* grid کابین */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* (1) مسابقاتِ زنده */}
        <section className={`${card} xl:col-span-2`}>
          <CardHead icon={<Ic d={I.live} />} title="مسابقاتِ زنده" count={liveMatches.length} tone="bad" />
          {liveMatches.length === 0 ? (
            <Empty text="مسابقه‌ی زنده‌ای در جریان نیست." />
          ) : (
            <ul className="space-y-2">
              {liveMatches.map((m) => (
                <li key={m.id} className="rounded-xl border border-line bg-tile2 p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="truncate font-semibold text-white">{m.a}</span>
                        <span className="rounded-md bg-tile px-2 py-0.5 font-display text-xs tnum text-gold">{fmt(m.scoreA)} : {fmt(m.scoreB)}</span>
                        <span className="truncate font-semibold text-white">{m.b}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-faint">دورِ {fmt(m.round)} · مسابقه {fmt(m.slot + 1)}</p>
                    </div>
                    <AdminBadge label={MATCH_FA[m.status]} tone={matchTone(m.status)} dot={m.status === 'live'} />
                    <button
                      onClick={() => {
                        setOpenMatch(openMatch === m.id ? null : m.id);
                        setScoreDraft({ a: m.scoreA, b: m.scoreB });
                      }}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-accent-dim hover:text-white"
                    >
                      بازکردنِ مسابقه
                    </button>
                  </div>

                  {/* پنلِ جزئیاتِ مسابقه (inline drawer) */}
                  {openMatch === m.id && (
                    <div className="mt-3 rounded-lg border border-line bg-tile p-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <ScoreField label={m.a} value={scoreDraft.a} onChange={(a) => setScoreDraft((s) => ({ ...s, a }))} disabled={!canResult} />
                        <span className="pb-2 text-faint">:</span>
                        <ScoreField label={m.b} value={scoreDraft.b} onChange={(b) => setScoreDraft((s) => ({ ...s, b }))} disabled={!canResult} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ActBtn onClick={() => saveScore(m)} disabled={!canResult} icon={I.edit} tone="primary">ویرایشِ امتیاز</ActBtn>
                        <ActBtn onClick={() => approveResult(m)} disabled={!canResult} icon={I.check} tone="good">تأیید</ActBtn>
                        <ActBtn onClick={() => rejectResult(m)} disabled={!canResult} icon={I.x} tone="bad">رد</ActBtn>
                        <ActBtn onClick={() => markNoShow(m)} disabled={!canResult} icon={I.ghost} tone="muted">عدمِ حضور</ActBtn>
                        {!canResult && <span className="text-[11px] text-faint">{denyTitle}</span>}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* (4) شرکت‌کننده‌ها — mini stats */}
        <section className={card}>
          <CardHead icon={<Ic d={I.users} />} title="شرکت‌کننده‌ها" count={participants.length} tone="accent" />
          <div className="grid grid-cols-2 gap-2">
            {partStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-tile2 p-3">
                <p className={`font-display text-2xl font-bold tnum ${s.tone}`}>{fmt(s.value)}</p>
                <p className="mt-0.5 text-[11px] text-faint">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* (2) نتایجِ در انتظار */}
        <section className={card}>
          <CardHead icon={<Ic d={I.check} />} title="نتایجِ در انتظار" count={pendingResults.length} tone="gold" />
          {pendingResults.length === 0 ? (
            <Empty text="نتیجه‌ای در انتظارِ تأیید نیست." />
          ) : (
            <ul className="space-y-2">
              {pendingResults.map((m) => (
                <li key={m.id} className="rounded-xl border border-line bg-tile2 p-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-white">{m.a} <span className="text-faint">vs</span> {m.b}</span>
                    <span className="rounded-md bg-tile px-2 py-0.5 font-display text-xs tnum text-gold">{fmt(m.scoreA)} : {fmt(m.scoreB)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-faint">ثبت‌شده توسطِ {m.submittedBy ?? '—'} · دورِ {fmt(m.round)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ActBtn onClick={() => approveResult(m)} disabled={!canResult} icon={I.check} tone="good">تأیید</ActBtn>
                    <ActBtn onClick={() => rejectResult(m)} disabled={!canResult} icon={I.x} tone="bad">رد</ActBtn>
                    {!canResult && <span className="text-[11px] text-faint">{denyTitle}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* (3) اختلاف‌ها */}
        <section className={card}>
          <CardHead icon={<Ic d={I.flag} />} title="اختلاف‌ها" count={disputes.length} tone={openDisputes.length ? 'bad' : 'muted'} />
          {disputes.length === 0 ? (
            <Empty text="اختلافی ثبت نشده است." />
          ) : (
            <ul className="space-y-2">
              {disputes.map((d) => (
                <li key={d.id} className="rounded-xl border border-line bg-tile2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{d.reporter}</span>
                    <AdminBadge label={DISPUTE_FA[d.status]} tone={disputeTone(d.status)} />
                  </div>
                  <p className="mt-1 text-xs text-muted">«{d.reason}»</p>
                  <p className="text-[11px] text-faint">مسابقه: {d.matchId}</p>
                  {(d.status === 'open' || d.status === 'under_review') && (
                    <div className="mt-2 flex items-center gap-2">
                      {d.status === 'open' && <ActBtn onClick={() => assignDispute(d)} disabled={!canDispute} icon={I.users} tone="muted">ارجاع</ActBtn>}
                      <ActBtn onClick={() => resolveDispute(d)} disabled={!canDispute} icon={I.check} tone="good">حلِ اختلاف</ActBtn>
                      {!canDispute && <span className="text-[11px] text-faint">{denyTitle}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* (5) پیش‌نمایشِ براکت */}
        <section className={`${card} xl:col-span-2`}>
          <CardHead icon={<Ic d={I.tree} />} title="پیش‌نمایشِ براکت" />
          <BracketPreview matches={matches} currentRound={currentRound} />
        </section>

        {/* (6) فعالیتِ زنده */}
        <section className={`${card} xl:col-span-1`}>
          <CardHead icon={<Ic d={I.live} />} title="فعالیتِ زنده" />
          <AuditLogList entityId={id} limit={8} />
        </section>
      </div>
    </div>
  );
}

// ───────── زیرکامپوننت‌ها ─────────
function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line py-8 text-center">
      <p className="text-xs text-faint">{text}</p>
    </div>
  );
}

function ScoreField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="max-w-[120px] truncate text-[11px] text-faint">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={disabled} onClick={() => onChange(Math.max(0, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-white disabled:opacity-40">−</button>
        <input
          type="number"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-14 rounded-lg border border-line bg-tile2 py-1.5 text-center font-display tnum outline-none focus:border-accent-dim disabled:opacity-40"
        />
        <button type="button" disabled={disabled} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-white disabled:opacity-40">+</button>
      </div>
    </label>
  );
}

function ActBtn({ onClick, disabled, icon, tone, children }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; tone: 'primary' | 'good' | 'bad' | 'muted'; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    primary: 'border-accent/30 text-accent hover:bg-accent/10',
    good: 'border-good/30 text-good hover:bg-good/10',
    bad: 'border-bad/30 text-[#fca5a5] hover:bg-bad/10',
    muted: 'border-line text-slate-200 hover:border-accent-dim hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'دسترسی لازم را ندارید' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      <Ic d={icon} />
      {children}
    </button>
  );
}

function BracketPreview({ matches, currentRound }: { matches: Match[]; currentRound: number }) {
  const rounds = [currentRound - 1, currentRound, currentRound + 1].filter((r) => r >= 1);
  const byRound = rounds
    .map((r) => ({ round: r, items: matches.filter((m) => m.round === r) }))
    .filter((g) => g.items.length > 0);

  if (byRound.length === 0) return <Empty text="هنوز براکتی ساخته نشده است." />;

  const roundLabel = (r: number) => (r < currentRound ? 'دورِ پیشین' : r === currentRound ? 'دورِ جاری' : 'دورِ بعدی');

  return (
    <div className="hscroll flex gap-4 pb-1">
      {byRound.map((g) => (
        <div key={g.round} className="min-w-[180px] flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">{roundLabel(g.round)}</span>
            {g.round === currentRound && <span className="h-1.5 w-1.5 rounded-full bg-bad" />}
          </div>
          <div className="space-y-2">
            {g.items.map((m) => {
              const aWin = m.status === 'completed' && m.scoreA > m.scoreB;
              const bWin = m.status === 'completed' && m.scoreB > m.scoreA;
              return (
                <div key={m.id} className={`rounded-lg border bg-tile2 p-2 text-xs ${m.status === 'live' ? 'border-bad/40' : 'border-line'}`}>
                  <Row name={m.a} score={m.scoreA} win={aWin} />
                  <div className="my-1 h-px bg-line" />
                  <Row name={m.b} score={m.scoreB} win={bWin} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ name, score, win }: { name: string; score: number; win: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`truncate ${win ? 'font-bold text-white' : 'text-muted'}`}>{name}</span>
      <span className={`font-display tnum ${win ? 'text-gold' : 'text-faint'}`}>{fmt(score)}</span>
    </div>
  );
}
