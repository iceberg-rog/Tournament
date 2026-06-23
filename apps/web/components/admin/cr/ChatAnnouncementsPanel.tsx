'use client';

import { useMemo, useState } from 'react';
import type { ControlRoomState } from '@/lib/admin/controlRoom';
import { participantById } from '@/lib/admin/controlRoom';
import type { CRAction, CRPayload } from '@/lib/admin/useControlRoom';
import { Avatar } from '@/components/admin/cr/Avatar';
import { AdminBadge } from '@/components/admin/AdminBadge';

const fa = (n: number) => n.toLocaleString('fa-IR');

type TargetKey = 'all' | 'checked_in' | 'current_round' | 'match';

const TARGETS: { key: TargetKey; label: string }[] = [
  { key: 'all', label: 'همه‌ی شرکت‌کننده‌ها' },
  { key: 'checked_in', label: 'چک‌این‌شده‌ها' },
  { key: 'current_round', label: 'دورِ جاری' },
  { key: 'match', label: 'یک مسابقه' },
];

/** پنلِ چت و اعلانات اتاقِ کنترل: اعلانِ عمومی، مانیتورِ چتِ مسابقات، پیامِ مستقیم. */
export function ChatAnnouncementsPanel({
  cr,
  onRun,
}: {
  cr: ControlRoomState;
  onRun: (a: CRAction, p?: CRPayload) => void;
}) {
  // ── (1) اعلانِ عمومی ──
  const [annMsg, setAnnMsg] = useState('');
  const [target, setTarget] = useState<TargetKey>('all');
  const [targetMatchId, setTargetMatchId] = useState<string>('');

  // ── (3) پیامِ مستقیم ──
  const [dmId, setDmId] = useState<string>('');
  const [dmMsg, setDmMsg] = useState('');

  // یادداشت‌های محلی برای اقداماتِ مدیریتیِ چت (بی‌صداکردن/حذف)
  const [modNotes, setModNotes] = useState<string[]>([]);

  const unreadMatches = useMemo(
    () => cr.matches.filter((m) => m.chatUnread > 0).sort((a, b) => b.chatUnread - a.chatUnread),
    [cr.matches],
  );
  const totalUnread = useMemo(
    () => cr.matches.reduce((s, m) => s + m.chatUnread, 0),
    [cr.matches],
  );

  const currentRoundFa = fa(cr.currentRound);
  const targetMatch = targetMatchId ? cr.matches.find((m) => m.id === targetMatchId) : undefined;

  const annReady =
    annMsg.trim().length > 0 && (target !== 'match' || Boolean(targetMatchId));

  function sendAnnounce() {
    if (!annReady) return;
    const label =
      target === 'match'
        ? `مسابقه‌ی #${fa(targetMatch?.number ?? 0)}`
        : TARGETS.find((t) => t.key === target)?.label ?? '';
    onRun('announce', { message: annMsg.trim(), target: target === 'match' ? targetMatchId : label });
    setAnnMsg('');
  }

  const dmReady = Boolean(dmId) && dmMsg.trim().length > 0;
  const dmParticipant = participantById(cr, dmId || undefined);

  function sendDm() {
    if (!dmReady) return;
    onRun('message', { participantId: dmId, message: dmMsg.trim() });
    setDmMsg('');
  }

  function mod(kind: 'mute' | 'delete', matchNum: number, name: string) {
    const text =
      kind === 'mute'
        ? `${name} در مسابقه‌ی #${fa(matchNum)} بی‌صدا شد`
        : `پیامِ ${name} در مسابقه‌ی #${fa(matchNum)} حذف شد`;
    onRun('message', { message: text });
    setModNotes((n) => [text, ...n].slice(0, 4));
  }

  const sectionTitle = (n: number, t: string) => (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-tile2 font-display text-[11px] font-bold tnum text-accent">
        {fa(n)}
      </span>
      <h3 className="text-sm font-bold text-text">{t}</h3>
    </div>
  );

  return (
    <div className="rounded-2xl border border-line bg-tile p-5">
      {/* سرتیتر + مجموعِ پیام‌های خوانده‌نشده */}
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-accent/12 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div>
            <div className="font-display text-base font-bold text-text">چت و اعلانات</div>
            <div className="text-xs text-faint">ارتباطِ زنده با شرکت‌کننده‌ها</div>
          </div>
        </div>
        {totalUnread > 0 ? (
          <AdminBadge label={`${fa(totalUnread)} پیامِ خوانده‌نشده`} tone="gold" dot />
        ) : (
          <AdminBadge label="بدونِ پیامِ خوانده‌نشده" tone="muted" />
        )}
      </header>

      {/* ── (1) اعلانِ عمومی ── */}
      <section className="rounded-xl border border-line bg-tile2/40 p-4">
        {sectionTitle(1, 'اعلانِ عمومی')}
        <p className="mb-3 mt-1 text-xs text-muted">پیام به‌صورتِ یک‌طرفه برای گروهِ هدف ارسال می‌شود.</p>

        <textarea
          value={annMsg}
          onChange={(e) => setAnnMsg(e.target.value)}
          rows={3}
          placeholder="متنِ اعلان… مثلاً «دورِ نیمه‌نهایی تا ۵ دقیقه‌ی دیگر آغاز می‌شود»"
          className="w-full resize-none rounded-lg border border-line bg-tile px-3 py-2 text-sm text-text placeholder:text-faint focus:border-accent/50 focus:outline-none"
        />

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-faint">گروهِ هدف</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as TargetKey)}
              className="w-full rounded-lg border border-line bg-tile px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
            >
              {TARGETS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.key === 'current_round' ? `${t.label} (${cr.roundName})` : t.label}
                </option>
              ))}
            </select>
          </label>

          {target === 'match' && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-faint">انتخابِ مسابقه</span>
              <select
                value={targetMatchId}
                onChange={(e) => setTargetMatchId(e.target.value)}
                className="w-full rounded-lg border border-line bg-tile px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
              >
                <option value="">— انتخاب کنید —</option>
                {cr.matches.map((m) => {
                  const a = participantById(cr, m.aId);
                  const b = participantById(cr, m.bId);
                  return (
                    <option key={m.id} value={m.id}>
                      {`#${fa(m.number)} — ${a?.name ?? 'TBD'} / ${b?.name ?? 'TBD'}`}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-faint">
            {target === 'match' && !targetMatchId
              ? 'برای ادامه یک مسابقه انتخاب کنید.'
              : `هدف: ${
                  target === 'match'
                    ? `مسابقه‌ی #${fa(targetMatch?.number ?? 0)}`
                    : target === 'current_round'
                      ? `دورِ جاری (${cr.roundName})`
                      : TARGETS.find((t) => t.key === target)?.label
                }`}
          </span>
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!annReady} onClick={sendAnnounce}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
            ارسالِ اعلان
          </button>
        </div>
      </section>

      {/* ── (2) مانیتورِ چتِ مسابقات ── */}
      <section className="mt-4 rounded-xl border border-line bg-tile2/40 p-4">
        <div className="flex items-center justify-between gap-2">
          {sectionTitle(2, 'مانیتورِ چتِ مسابقات')}
          {totalUnread > 0 && <span className="text-[11px] font-bold tnum text-gold">{fa(totalUnread)} خوانده‌نشده</span>}
        </div>

        {unreadMatches.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line bg-tile/40 px-3 py-4 text-center text-xs leading-6 text-muted">
            پیامِ خوانده‌نشده‌ای در چتِ هیچ مسابقه‌ای نیست؛ وقتی بازیکنی در اتاقِ مسابقه پیام بفرستد، اینجا با شماره‌ی مسابقه و تعدادِ پیام نمایش داده می‌شود.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unreadMatches.map((m) => {
              const a = participantById(cr, m.aId);
              const b = participantById(cr, m.bId);
              const live = m.status === 'live';
              const disputed = m.status === 'disputed';
              return (
                <li
                  key={m.id}
                  className={`rounded-lg border bg-tile px-3 py-2.5 ${disputed ? 'border-bad/50' : 'border-line'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-display text-xs font-bold tnum text-faint">#{fa(m.number)}</span>
                      <Avatar p={a} size={22} />
                      <span className="truncate text-xs font-semibold text-text">{a?.name ?? 'TBD'}</span>
                      <span className="text-[11px] text-faint">vs</span>
                      <Avatar p={b} size={22} />
                      <span className="truncate text-xs font-semibold text-text">{b?.name ?? 'TBD'}</span>
                      {live && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bad">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />زنده
                        </span>
                      )}
                      {disputed && <AdminBadge label="اختلاف" tone="bad" />}
                    </div>
                    <span className="grid h-5 min-w-5 flex-none place-items-center rounded-full bg-gold/15 px-1.5 text-[11px] font-bold tnum text-gold">
                      {fa(m.chatUnread)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 border-t border-line/60 pt-2">
                    <button
                      className="chip border border-line bg-tile2 text-muted hover:text-text"
                      onClick={() => mod('mute', m.number, a?.name ?? 'بازیکن')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5 6 9H2v6h4l5 4z" /><path d="m23 9-6 6M17 9l6 6" />
                      </svg>
                      بی‌صداکردن
                    </button>
                    <button
                      className="chip border border-bad/30 bg-bad/10 text-[#fca5a5] hover:border-bad/50"
                      onClick={() => mod('delete', m.number, a?.name ?? 'بازیکن')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                      حذفِ پیام
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {modNotes.length > 0 && (
          <ul className="mt-2 space-y-1 text-[11px] text-faint">
            {modNotes.map((n, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="text-good">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {n}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── (3) پیامِ مستقیم ── */}
      <section className="mt-4 rounded-xl border border-line bg-tile2/40 p-4">
        {sectionTitle(3, 'پیامِ مستقیم')}
        <p className="mb-3 mt-1 text-xs text-muted">ارسالِ پیامِ خصوصی به یک شرکت‌کننده.</p>

        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-faint">گیرنده</span>
          <select
            value={dmId}
            onChange={(e) => setDmId(e.target.value)}
            className="w-full rounded-lg border border-line bg-tile px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
          >
            <option value="">— انتخابِ شرکت‌کننده —</option>
            {cr.participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {dmParticipant && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-tile px-3 py-2">
            <Avatar p={dmParticipant} size={26} />
            <span className="text-xs font-semibold text-text">{dmParticipant.name}</span>
            <span className="ms-auto text-[10px] text-faint tnum">سید {fa(dmParticipant.seed)}</span>
          </div>
        )}

        <textarea
          value={dmMsg}
          onChange={(e) => setDmMsg(e.target.value)}
          rows={2}
          placeholder="متنِ پیامِ مستقیم…"
          className="mt-2 w-full resize-none rounded-lg border border-line bg-tile px-3 py-2 text-sm text-text placeholder:text-faint focus:border-accent/50 focus:outline-none"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-faint">
            {!dmId ? 'ابتدا یک گیرنده انتخاب کنید.' : `ارسال به ${dmParticipant?.name ?? ''}`}
          </span>
          <button className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40" disabled={!dmReady} onClick={sendDm}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
            </svg>
            ارسالِ پیام
          </button>
        </div>
      </section>
    </div>
  );
}

export default ChatAnnouncementsPanel;
