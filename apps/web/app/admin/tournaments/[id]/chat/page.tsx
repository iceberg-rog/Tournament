'use client'

// چت و اعلان‌ها — چتِ گروهی + نظارت، چتِ مسابقات و آهنگرِ اعلان.
// همه‌چیز refresh-safe با useOpsSlice؛ هر دکمه state را تغییر می‌دهد، toast و audit می‌نویسد.

import { useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useTournament, useAdminRole, pushToast, appendAudit } from '@/lib/admin/store'
import {
  buildTournamentOps,
  CHAT_POLICY_FA,
  type ChatPolicy,
  type ChatMessage,
  type Announcement,
  type MatchChatThread,
  type NotificationChannel,
  type NotificationDeliveryStatus,
} from '@/lib/admin/tournamentOps'
import { useOpsSlice } from '@/lib/admin/opsStore'
import { Drawer } from '@/components/admin/cr/Drawer'
import { AdminBadge } from '@/components/admin/AdminBadge'
import { fmt } from '@/lib/admin'
import type { Tone } from '@/lib/admin'

// ───────── tiny time helpers ─────────
const clock = (iso: string) => new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
const day = (iso: string) => new Date(iso).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })

// ───────── static maps ─────────
const CHANNEL_FA: Record<NotificationChannel, string> = {
  in_app: 'درون‌برنامه‌ای',
  email: 'ایمیل',
  sms: 'پیامک',
  push: 'اعلانِ فوری',
  chat: 'چت',
}
const DELIVERY_FA: Record<NotificationDeliveryStatus, string> = {
  scheduled: 'زمان‌بندی‌شده',
  sent: 'ارسال‌شده',
  failed: 'ناموفق',
  read: 'خوانده‌شده',
  unanswered: 'بی‌پاسخ',
}
const DELIVERY_TONE: Record<NotificationDeliveryStatus, Tone> = {
  scheduled: 'gold',
  sent: 'accent',
  failed: 'bad',
  read: 'good',
  unanswered: 'muted',
}
const TARGETS: { key: string; label: string }[] = [
  { key: 'همه‌ی شرکت‌کننده‌ها', label: 'همه‌ی شرکت‌کننده‌ها' },
  { key: 'چک‌این‌شده‌ها', label: 'چک‌این‌شده‌ها' },
  { key: 'بازیکنانِ دورِ جاری', label: 'بازیکنانِ دورِ جاری' },
  { key: 'یک مسابقه‌ی خاص', label: 'یک مسابقه‌ی خاص' },
  { key: 'منتخب‌ها', label: 'منتخب‌ها' },
]
const SCHEDULE_OPTS: { key: Announcement['schedule']; label: string }[] = [
  { key: 'now', label: 'همین حالا' },
  { key: 'before_match', label: 'پیش از مسابقه' },
  { key: 'later', label: 'بعداً' },
]
const COMPOSE_CHANNELS: { key: NotificationChannel; label: string; note?: string }[] = [
  { key: 'in_app', label: CHANNEL_FA.in_app },
  { key: 'email', label: CHANNEL_FA.email },
  { key: 'chat', label: CHANNEL_FA.chat },
  { key: 'sms', label: CHANNEL_FA.sms, note: 'در صورتِ فعال بودن' },
  { key: 'push', label: CHANNEL_FA.push, note: 'در صورتِ فعال بودن' },
]

let nseed = 0
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${nseed++}`

interface ChatFlags {
  locked: boolean
  slow: boolean
}
interface ComposeState {
  title: string
  body: string
  target: string
  channels: NotificationChannel[]
  schedule: Announcement['schedule']
}

export default function Page() {
  const id = String(useParams().id)
  const t = useTournament(id)
  const role = useAdminRole()
  const ops = useMemo(() => (t ? buildTournamentOps(t) : null), [t])

  // ───────── persisted slices (derive fallbacks from ops) ─────────
  const [policy, setPolicy] = useOpsSlice<ChatPolicy>(id, 'chat-policy', ops?.chat.policy ?? 'everyone_can_chat')
  const [flags, setFlags] = useOpsSlice<ChatFlags>(id, 'chat-flags', { locked: false, slow: false })
  const [messages, setMessages] = useOpsSlice<ChatMessage[]>(id, 'chat-messages', ops?.chat.messages ?? [])
  const [announcements, setAnnouncements] = useOpsSlice<Announcement[]>(id, 'announcements', ops?.announcements ?? [])

  // ───────── transient UI hooks ─────────
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [openThread, setOpenThread] = useState<MatchChatThread | null>(null)
  const [compose, setCompose] = useState<ComposeState>({
    title: '',
    body: '',
    target: TARGETS[0].key,
    channels: ['in_app', 'chat'],
    schedule: 'now',
  })

  const pinned = useMemo(() => messages.filter((m) => m.pinned), [messages])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = messages.filter((m) => !m.pinned)
    if (!q) return base
    return base.filter((m) => `${m.author} ${m.text}`.toLowerCase().includes(q))
  }, [messages, search])

  if (!t || !ops) return null

  // ───────── helpers ─────────
  function audit(action: string, reason?: string, entityType: 'tournament' | 'match' | 'participant' = 'tournament', entityId = id) {
    appendAudit({ actor: 'مدیر سیستم', actorRole: role, action, entityType, entityId, reason })
  }

  function changePolicy(next: ChatPolicy) {
    setPolicy(next)
    pushToast({ kind: 'info', msg: `سیاستِ چت: ${CHAT_POLICY_FA[next]}` })
    audit('سیاستِ چت تغییر کرد', CHAT_POLICY_FA[next])
  }

  function toggleFlag(key: keyof ChatFlags, label: string) {
    setFlags((prev) => {
      const value = !prev[key]
      pushToast({ kind: value ? 'info' : 'success', msg: `${label} ${value ? 'فعال شد' : 'غیرفعال شد'}` })
      audit(`${label} ${value ? 'فعال' : 'غیرفعال'} شد`, undefined)
      return { ...prev, [key]: value }
    })
  }

  function send() {
    const text = draft.trim()
    if (!text || flags.locked) return
    const msg: ChatMessage = {
      id: newId('c'),
      author: 'مدیر سیستم',
      role: 'admin',
      text,
      at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    setDraft('')
    pushToast({ kind: 'success', msg: 'پیام در چتِ گروهی ارسال شد' })
    audit('پیامِ مدیر در چتِ گروهی', text.slice(0, 60))
  }

  function muteAuthor(m: ChatMessage) {
    setMessages((prev) => prev.map((x) => (x.author === m.author && x.role === 'player' ? { ...x, muted: true } : x)))
    pushToast({ kind: 'info', msg: `«${m.author}» بی‌صدا شد` })
    audit('بی‌صداکردنِ بازیکن در چت', m.author, 'participant', m.author)
  }
  function removeMsg(m: ChatMessage) {
    setMessages((prev) => prev.filter((x) => x.id !== m.id))
    pushToast({ kind: 'success', msg: 'پیام حذف شد' })
    audit('حذفِ پیام از چتِ گروهی', m.text.slice(0, 60))
  }
  function reportMsg(m: ChatMessage) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, flagged: true } : x)))
    pushToast({ kind: 'info', msg: 'گزارش از پیام ساخته شد' })
    audit('گزارش از پیامِ چت', m.text.slice(0, 60), 'participant', m.author)
  }
  function togglePin(m: ChatMessage) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, pinned: !x.pinned } : x)))
    pushToast({ kind: 'info', msg: m.pinned ? 'سنجاق برداشته شد' : 'پیام سنجاق شد' })
    audit(m.pinned ? 'برداشتنِ سنجاقِ پیام' : 'سنجاقِ پیام', m.text.slice(0, 60))
  }

  // ───────── match thread actions ─────────
  function threadNote(th: MatchChatThread) {
    pushToast({ kind: 'success', msg: `پیامِ مدیر به طرفینِ مسابقه #${fmt(th.number)} ارسال شد` })
    audit('پیامِ مدیر به طرفینِ مسابقه', `مسابقه #${th.number} — ${th.a} / ${th.b}`, 'match', th.matchId)
  }
  function threadMute(th: MatchChatThread) {
    pushToast({ kind: 'info', msg: `چتِ مسابقه #${fmt(th.number)} بی‌صدا شد` })
    audit('بی‌صداکردنِ چتِ مسابقه', `مسابقه #${th.number}`, 'match', th.matchId)
  }
  function threadReport(th: MatchChatThread) {
    pushToast({ kind: 'info', msg: `گزارش از چتِ مسابقه #${fmt(th.number)} ساخته شد` })
    audit('گزارش از چتِ مسابقه', `مسابقه #${th.number} — ${th.a} / ${th.b}`, 'match', th.matchId)
  }

  // ───────── announcement compose ─────────
  function toggleChannel(ch: NotificationChannel) {
    setCompose((c) => ({
      ...c,
      channels: c.channels.includes(ch) ? c.channels.filter((x) => x !== ch) : [...c.channels, ch],
    }))
  }
  const canSendAnn = compose.title.trim() && compose.body.trim() && compose.channels.length > 0
  function sendAnnouncement() {
    if (!canSendAnn) return
    const status: NotificationDeliveryStatus = compose.schedule === 'now' ? 'sent' : 'scheduled'
    const ann: Announcement = {
      id: newId('an'),
      title: compose.title.trim(),
      body: compose.body.trim(),
      target: compose.target,
      channels: [...compose.channels],
      schedule: compose.schedule,
      status,
      at: new Date().toISOString(),
    }
    setAnnouncements((prev) => [ann, ...prev])
    pushToast({ kind: 'success', msg: status === 'sent' ? 'اعلان ارسال شد' : 'اعلان زمان‌بندی شد' })
    audit(status === 'sent' ? 'ارسالِ اعلان' : 'زمان‌بندیِ اعلان', `${ann.title} → ${ann.target}`)
    setCompose({ title: '', body: '', target: TARGETS[0].key, channels: ['in_app', 'chat'], schedule: 'now' })
  }

  const flagged = messages.filter((m) => m.flagged).length

  return (
    <div className="space-y-4">
      {/* heading */}
      <div>
        <h2 className="font-display text-lg font-bold">چت و اعلان‌ها</h2>
        <p className="mt-0.5 text-xs text-faint">چتِ عمومی، چتِ مسابقات، اعلان‌ها و نظارت</p>
      </div>

      {/* summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="پیام‌های چت" value={fmt(messages.length)} tone="accent" />
        <Stat label="پیام‌های گزارش‌شده" value={fmt(flagged)} tone={flagged ? 'bad' : 'muted'} />
        <Stat label="چتِ مسابقات" value={fmt(ops.chat.matchThreads.length)} tone="gold" />
        <Stat label="اعلان‌ها" value={fmt(announcements.length)} tone="good" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* ───────── LEFT: group chat ───────── */}
        <section className="flex flex-col rounded-2xl border border-line bg-tile">
          {/* top bar */}
          <div className="space-y-3 border-b border-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">چتِ گروهی</span>
              {flags.locked && <AdminBadge label="قفل" tone="bad" dot />}
              {flags.slow && <AdminBadge label="حالتِ آهسته" tone="gold" />}
              <select
                value={policy}
                onChange={(e) => changePolicy(e.target.value as ChatPolicy)}
                className="ms-auto rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
              >
                {(Object.keys(CHAT_POLICY_FA) as ChatPolicy[]).map((p) => (
                  <option key={p} value={p}>
                    {CHAT_POLICY_FA[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip active={flags.locked} tone="bad" onClick={() => toggleFlag('locked', 'قفلِ چت')}>
                قفلِ چت
              </Chip>
              <Chip active={flags.slow} tone="gold" onClick={() => toggleFlag('slow', 'حالتِ آهسته')}>
                حالتِ آهسته
              </Chip>
              <div className="relative ms-auto min-w-[160px] flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-faint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3-3" />
                  </svg>
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جست‌وجوی پیام…"
                  className="w-full rounded-lg border border-line bg-tile2 ps-9 pe-3 py-2 text-sm outline-none focus:border-accent-dim"
                />
              </div>
            </div>
          </div>

          {/* pinned strip */}
          {pinned.length > 0 && (
            <div className="space-y-2 border-b border-line bg-accent/5 p-3">
              {pinned.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 flex-none text-[#5eead4]">
                    <path d="m12 17 .01 4M9 4h6l-1 7 3 2H7l3-2-1-7Z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <span className="font-bold text-[#5eead4]">{m.author}</span>
                      <span className="tnum">{clock(m.at)}</span>
                    </div>
                    <p className="text-xs text-slate-200">{m.text}</p>
                  </div>
                  <button onClick={() => togglePin(m)} className="flex-none text-[11px] text-faint hover:text-text">
                    برداشتنِ سنجاق
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* messages list */}
          <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
            {visible.length === 0 ? (
              <div className="grid h-full place-items-center py-10 text-center">
                <div>
                  <p className="text-sm text-muted">{search ? 'پیامی با این جست‌وجو پیدا نشد' : 'هنوز پیامی در چت نیست'}</p>
                  {search && (
                    <button onClick={() => setSearch('')} className="btn-ghost mt-3 px-4 py-2 text-xs">
                      پاک‌کردنِ جست‌وجو
                    </button>
                  )}
                </div>
              </div>
            ) : (
              visible.map((m) => <Bubble key={m.id} m={m} onMute={muteAuthor} onRemove={removeMsg} onReport={reportMsg} onPin={togglePin} />)
            )}
          </div>

          {/* composer */}
          <div className="border-t border-line p-3">
            {flags.locked ? (
              <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2.5 text-xs text-[#fca5a5]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                چت قفل است — برای ارسالِ پیام ابتدا قفل را بردارید.
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  rows={1}
                  placeholder="پیامِ مدیر را بنویسید…"
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-lg border border-line bg-tile2 px-3 py-2.5 text-sm outline-none focus:border-accent-dim"
                />
                <button onClick={send} disabled={!draft.trim()} className="btn-primary flex-none px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                  ارسال
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ───────── RIGHT: match chats + composer ───────── */}
        <div className="space-y-4">
          {/* match chats */}
          <section className="rounded-2xl border border-line bg-tile p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">چتِ مسابقات</h3>
              <span className="text-[11px] text-faint tnum">{fmt(ops.chat.matchThreads.length)} گفت‌وگو</span>
            </div>
            {ops.chat.matchThreads.length === 0 ? (
              <div className="rounded-xl border border-line bg-tile2 px-4 py-8 text-center">
                <p className="text-sm text-muted">چتِ مسابقه‌ی فعالی نیست</p>
                <p className="mt-1 text-xs text-faint">با شروعِ مسابقات، گفت‌وگوی طرفین اینجا برای نظارت ظاهر می‌شود.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {ops.chat.matchThreads.map((th) => (
                  <li key={th.matchId} className="flex items-center gap-3 rounded-xl border border-line bg-tile2 px-3 py-2.5">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line bg-tile text-[11px] font-bold text-muted tnum">
                      #{fmt(th.number)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-200">
                        {th.a} <span className="text-faint">در برابر</span> {th.b}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                        {th.unread > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-bold text-[#5eead4] tnum">
                            {fmt(th.unread)} نخوانده
                          </span>
                        )}
                        {th.flagged && (
                          <span className="inline-flex items-center gap-1 text-[#fca5a5]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                            گزارش‌شده
                          </span>
                        )}
                        {th.unread === 0 && !th.flagged && <span className="text-faint">بدونِ پیامِ تازه</span>}
                      </div>
                    </div>
                    <button onClick={() => setOpenThread(th)} className="btn-ghost flex-none px-3 py-1.5 text-xs">
                      بازکردن
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* announcement composer */}
          <section className="rounded-2xl border border-line bg-tile p-4">
            <h3 className="mb-3 text-sm font-bold">آهنگرِ اعلان</h3>
            <div className="space-y-3">
              <Field label="عنوان">
                <input
                  value={compose.title}
                  onChange={(e) => setCompose((c) => ({ ...c, title: e.target.value }))}
                  placeholder="مثلاً: شروعِ مرحله‌ی ۱۶تایی"
                  className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
                />
              </Field>
              <Field label="متن">
                <textarea
                  value={compose.body}
                  onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                  rows={3}
                  placeholder="متنِ اعلان را بنویسید…"
                  className="w-full resize-none rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
                />
              </Field>
              <Field label="هدف">
                <select
                  value={compose.target}
                  onChange={(e) => setCompose((c) => ({ ...c, target: e.target.value }))}
                  className="w-full rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim"
                >
                  {TARGETS.map((tg) => (
                    <option key={tg.key} value={tg.key}>
                      {tg.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="کانال‌ها">
                <div className="flex flex-wrap gap-2">
                  {COMPOSE_CHANNELS.map((ch) => {
                    const on = compose.channels.includes(ch.key)
                    return (
                      <button
                        key={ch.key}
                        onClick={() => toggleChannel(ch.key)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                          on ? 'border-accent-dim bg-accent/10 text-white' : 'border-line text-muted hover:text-white'
                        }`}
                      >
                        {ch.label}
                        {ch.note && <span className="ms-1 text-[10px] text-faint">({ch.note})</span>}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field label="زمان‌بندی">
                <div className="flex flex-wrap gap-2">
                  {SCHEDULE_OPTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCompose((c) => ({ ...c, schedule: s.key }))}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        compose.schedule === s.key ? 'border-accent-dim bg-accent/10 text-white' : 'border-line text-muted hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* preview */}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-faint">پیش‌نمایش</p>
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/20 text-[#5eead4]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M3 11 21 3l-8 18-2-7-8-3Z" />
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-slate-100">{compose.title.trim() || 'عنوانِ اعلان'}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{compose.body.trim() || 'متنِ اعلان اینجا نمایش داده می‌شود.'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-faint">
                    <span className="rounded-md border border-line bg-tile px-1.5 py-0.5">{compose.target}</span>
                    {compose.channels.map((ch) => (
                      <span key={ch} className="rounded-md border border-line bg-tile px-1.5 py-0.5">
                        {CHANNEL_FA[ch]}
                      </span>
                    ))}
                    <span className="rounded-md border border-line bg-tile px-1.5 py-0.5">
                      {SCHEDULE_OPTS.find((s) => s.key === compose.schedule)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={sendAnnouncement} disabled={!canSendAnn} className="btn-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                {compose.schedule === 'now' ? 'ارسالِ اعلان' : 'زمان‌بندیِ اعلان'}
              </button>
            </div>

            {/* past / scheduled announcements */}
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[11px] font-semibold text-faint">اعلان‌های پیشین و زمان‌بندی‌شده</p>
              {announcements.length === 0 ? (
                <p className="rounded-lg border border-line bg-tile2 px-3 py-4 text-center text-xs text-faint">هنوز اعلانی ثبت نشده است.</p>
              ) : (
                <ul className="space-y-2">
                  {announcements.map((a) => (
                    <li key={a.id} className="rounded-xl border border-line bg-tile2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-200">{a.title}</p>
                        <AdminBadge label={DELIVERY_FA[a.status]} tone={DELIVERY_TONE[a.status]} dot={a.status === 'scheduled'} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{a.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                        <span className="rounded-md border border-line bg-tile px-1.5 py-0.5">{a.target}</span>
                        {a.channels.map((ch) => (
                          <span key={ch} className="rounded-md border border-line bg-tile px-1.5 py-0.5">
                            {CHANNEL_FA[ch]}
                          </span>
                        ))}
                        <span className="ms-auto tnum">
                          {day(a.at)} • {clock(a.at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* match thread drawer */}
      <Drawer
        open={!!openThread}
        onClose={() => setOpenThread(null)}
        title={
          openThread ? (
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold">چتِ مسابقه #{fmt(openThread.number)}</span>
              {openThread.flagged && <AdminBadge label="گزارش‌شده" tone="bad" dot />}
            </div>
          ) : (
            ''
          )
        }
        subtitle={openThread ? `${openThread.a} در برابر ${openThread.b}` : undefined}
        width={460}
      >
        {openThread && (
          <div className="space-y-4">
            {/* read-only mock thread */}
            <div className="space-y-2">
              <ThreadLine who={openThread.a} text="سلام، آماده‌ای شروع کنیم؟" align="start" />
              <ThreadLine who={openThread.b} text="آره، لطفاً اسکرین‌شاتِ نتیجه رو نگه دار." align="end" />
              <ThreadLine who={openThread.a} text="باشه. کدِ لابی رو فرستادم." align="start" />
              <div className="text-center text-[11px] text-faint">— پایانِ پیش‌نمایش (فقط‌خواندنی) —</div>
            </div>

            <div className="rounded-xl border border-line bg-tile2 p-3">
              <p className="mb-2 text-xs font-semibold text-faint">اقدامِ مدیر</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => threadNote(openThread)} className="btn-primary px-3 py-2 text-sm">
                  پیام به طرفین
                </button>
                <div className="flex gap-2">
                  <button onClick={() => threadMute(openThread)} className="btn-ghost flex-1 px-3 py-2 text-sm">
                    بی‌صدا
                  </button>
                  <button onClick={() => threadReport(openThread)} className="btn-danger flex-1 px-3 py-2 text-sm">
                    گزارش
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

// ───────── small presentational helpers ─────────
function Stat({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const color = tone === 'accent' ? 'text-accent' : tone === 'bad' ? 'text-bad' : tone === 'gold' ? 'text-gold' : tone === 'good' ? 'text-good' : 'text-muted'
  return (
    <div className="rounded-2xl border border-line bg-tile p-4">
      <p className="text-xs text-faint">{label}</p>
      <p className={`mt-1 text-xl font-bold tnum ${color}`}>{value}</p>
    </div>
  )
}

function Chip({ active, tone, onClick, children }: { active: boolean; tone: 'bad' | 'gold'; onClick: () => void; children: ReactNode }) {
  const on = tone === 'bad' ? 'border-bad/30 bg-bad/10 text-[#fca5a5]' : 'border-gold/30 bg-gold/10 text-gold'
  return (
    <button onClick={onClick} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${active ? on : 'border-line text-muted hover:text-white'}`}>
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-faint">{label}</span>
      {children}
    </label>
  )
}

function Bubble({ m, onMute, onRemove, onReport, onPin }: { m: ChatMessage; onMute: (m: ChatMessage) => void; onRemove: (m: ChatMessage) => void; onReport: (m: ChatMessage) => void; onPin: (m: ChatMessage) => void }) {
  if (m.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] rounded-lg border border-line bg-tile2/60 px-3 py-1.5 text-center text-[11px] text-faint">
          {m.text}
          <span className="ms-2 tnum">{clock(m.at)}</span>
        </div>
      </div>
    )
  }
  const admin = m.role === 'admin'
  return (
    <div className={`group flex ${admin ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-3 py-2 ${
          admin ? 'border-accent/30 bg-accent/10' : 'border-line bg-tile2'
        }`}
      >
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`font-bold ${admin ? 'text-[#5eead4]' : 'text-slate-200'}`}>{m.author}</span>
          {m.muted && <span className="rounded-md bg-tile px-1 py-0.5 text-[10px] text-faint">بی‌صدا</span>}
          {m.flagged && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />}
          <span className="text-faint tnum">{clock(m.at)}</span>
        </div>
        <p className="mt-1 text-sm text-slate-100">{m.text}</p>

        {/* moderation actions */}
        <div className={`mt-1.5 flex flex-wrap gap-1.5 ${admin ? 'opacity-100' : 'opacity-0 transition group-hover:opacity-100'}`}>
          {!admin && (
            <>
              <ModBtn onClick={() => onMute(m)}>بی‌صدا</ModBtn>
              <ModBtn onClick={() => onReport(m)} tone="bad">
                گزارش
              </ModBtn>
            </>
          )}
          <ModBtn onClick={() => onPin(m)}>{m.pinned ? 'برداشتنِ سنجاق' : 'سنجاق'}</ModBtn>
          <ModBtn onClick={() => onRemove(m)} tone="bad">
            حذف
          </ModBtn>
        </div>
      </div>
    </div>
  )
}

function ModBtn({ onClick, tone, children }: { onClick: () => void; tone?: 'bad'; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition ${
        tone === 'bad' ? 'border-bad/30 text-[#fca5a5] hover:bg-bad/10' : 'border-line text-faint hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

function ThreadLine({ who, text, align }: { who: string; text: string; align: 'start' | 'end' }) {
  return (
    <div className={`flex ${align === 'end' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl border px-3 py-2 ${align === 'end' ? 'border-accent/30 bg-accent/10' : 'border-line bg-tile2'}`}>
        <p className="text-[11px] font-bold text-faint">{who}</p>
        <p className="mt-0.5 text-sm text-slate-100">{text}</p>
      </div>
    </div>
  )
}
