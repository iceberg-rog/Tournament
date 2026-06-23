'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  ADMIN_TOURNAMENTS,
  TOURNAMENT_STATUS_META,
  TOURNAMENT_ACTIONS,
  type TournamentStatus,
  fmt,
  money,
} from '@/lib/admin';

// اقدام‌های حساس که نیاز به تأیید دارند
const SENSITIVE = new Set(['تأیید', 'رد', 'حذف', 'آزادسازیِ جایزه', 'لغو', 'بازپرداخت']);

const Ico = ({ name, size = 14 }: { name: 'search' | 'plus'; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {name === 'search' && <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>}
    {name === 'plus' && <><path d="M12 5v14M5 12h14" /></>}
  </svg>
);

const STATUS_KEYS = Object.keys(TOURNAMENT_STATUS_META) as TournamentStatus[];

export default function AdminTournamentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TournamentStatus>('all');
  const [note, setNote] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ADMIN_TOURNAMENTS.filter((t) => {
      const okStatus = status === 'all' || t.status === status;
      const okSearch =
        !q || t.title.toLowerCase().includes(q) || t.game.toLowerCase().includes(q);
      return okStatus && okSearch;
    });
  }, [search, status]);

  const act = (action: string, t: { title: string }) => {
    if (SENSITIVE.has(action)) {
      if (!window.confirm(`«${action}» برای «${t.title}» انجام شود؟`)) return;
      setNote(`«${action}» برای «${t.title}» اعمال شد.`);
    } else {
      setNote(`«${action}» برای «${t.title}» باز شد.`);
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="مدیریتِ تورنومنت‌ها"
          subtitle="چرخه‌ی حیاتِ همه‌ی تورنومنت‌ها — تأیید، انتشار، نظارت و پرداخت."
          actions={
            <Link href="/tournaments/new" className="btn-primary px-4 py-2 text-sm">
              <Ico name="plus" />
              ساختِ تورنومنت
            </Link>
          }
        />

        {note && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-good/30 bg-good/15 px-4 py-2.5 text-sm font-semibold text-good">
            <span>{note}</span>
            <button onClick={() => setNote(null)} className="text-xs text-faint hover:text-muted">بستن</button>
          </div>
        )}

        {/* فیلترها */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
                <Ico name="search" />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جست‌وجو با عنوان یا بازی…"
                className="w-full rounded-xl border border-line bg-tile2 py-2.5 pr-9 pl-3 text-sm outline-none transition placeholder:text-faint focus:border-line-2"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | TournamentStatus)}
              className="rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-line-2"
            >
              <option value="all">همه‌ی وضعیت‌ها</option>
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>{TOURNAMENT_STATUS_META[k].label}</option>
              ))}
            </select>
            <span className="text-xs text-faint tnum">{fmt(rows.length)} مورد</span>
          </div>
        </section>

        {/* جدول */}
        <section className="rounded-2xl border border-line bg-tile p-5">
          {rows.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <p className="text-sm font-semibold text-muted">موردی با این فیلتر نیست</p>
              <p className="mt-1 text-xs text-faint">فیلترها را تغییر بده یا جست‌وجو را پاک کن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="text-right text-[11px] uppercase tracking-wider text-faint">
                    <th className="border-b border-line pb-3 pr-2 font-semibold">عنوان</th>
                    <th className="border-b border-line pb-3 px-2 font-semibold">بازی</th>
                    <th className="border-b border-line pb-3 px-2 font-semibold">وضعیت</th>
                    <th className="border-b border-line pb-3 px-2 font-semibold">شرکت‌کننده‌ها</th>
                    <th className="border-b border-line pb-3 px-2 font-semibold">جایزه</th>
                    <th className="border-b border-line pb-3 px-2 font-semibold">برگزارکننده</th>
                    <th className="border-b border-line pb-3 pl-2 font-semibold">اقدام</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const meta = TOURNAMENT_STATUS_META[t.status];
                    const pct = t.maxParticipants
                      ? Math.min(100, Math.round((t.participants / t.maxParticipants) * 100))
                      : 0;
                    const actions = TOURNAMENT_ACTIONS[t.status].slice(0, 2);
                    return (
                      <tr key={t.id} className="border-b border-line/70 transition hover:bg-white/[.02]">
                        {/* کاور/عنوان */}
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-3">
                            <span className="crest grid h-10 w-10 flex-none place-items-center rounded-lg bg-gradient-to-br from-accent to-gold text-xs">
                              {t.game.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{t.title}</p>
                              <p className="text-[11px] text-faint">{t.platform}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-muted">{t.game}</td>
                        <td className="px-2 py-3">
                          <AdminBadge label={meta.label} tone={meta.tone} />
                        </td>
                        {/* شرکت‌کننده‌ها + pbar */}
                        <td className="px-2 py-3">
                          <div className="w-32">
                            <div className="mb-1 flex items-center justify-between text-[11px] tnum">
                              <span>{fmt(t.participants)}/{fmt(t.maxParticipants)}</span>
                              <span className="text-faint">٪{fmt(pct)}</span>
                            </div>
                            <div className="pbar">
                              <span style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-semibold text-gold tnum whitespace-nowrap">{money(t.prize)}</td>
                        <td className="px-2 py-3 text-muted whitespace-nowrap">{t.organizer}</td>
                        {/* اقدام */}
                        <td className="py-3 pl-2">
                          {actions.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {actions.map((a) => (
                                <button
                                  key={a}
                                  onClick={() => act(a, t)}
                                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                    SENSITIVE.has(a)
                                      ? a === 'رد' || a === 'حذف' || a === 'لغو'
                                        ? 'border-bad/30 bg-bad/10 text-[#fca5a5] hover:bg-bad/20'
                                        : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
                                      : 'border-line bg-tile2 text-muted hover:border-line-2'
                                  }`}
                                >
                                  {a}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminGuard>
  );
}
