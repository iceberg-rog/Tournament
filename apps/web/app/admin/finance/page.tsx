'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminBadge } from '@/components/admin/AdminBadge';
import {
  LEDGER,
  PAYOUTS,
  LEDGER_FA,
  PAYMENT_STATUS_META,
  fmt,
  money,
  type LedgerType,
  type Tone,
} from '@/lib/admin';

const PATHS: Record<string, ReactNode> = {
  wallet: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  shield: <><path d="M12 3 4 6v6c0 4 3.5 7 8 9 4.5-2 8-5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  hourglass: <><path d="M6 3h12M6 21h12M8 3c0 4 8 5 8 9s-8 5-8 9M16 3c0 4-8 5-8 9s8 5 8 9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  release: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
};
const Ico = ({ name, size = 16 }: { name: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
);

const PAYOUT_META: Record<'pending' | 'released' | 'held', { label: string; tone: Tone }> = {
  pending: { label: 'در انتظار', tone: 'gold' },
  released: { label: 'آزادشده', tone: 'good' },
  held: { label: 'نگه‌داشته', tone: 'bad' },
};

const dateFa = (iso: string) => new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export default function FinancePage() {
  const [tab, setTab] = useState<'ledger' | 'payouts'>('ledger');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LedgerType>('all');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'released' | 'held'>('all');
  const [note, setNote] = useState('');
  const [released, setReleased] = useState<Record<string, true>>({});

  // ── اعدادِ خلاصه از LEDGER/PAYOUTS ──
  const tiles = useMemo(() => {
    const escrow = sum(LEDGER.filter((l) => l.type === 'escrow_lock').map((l) => Math.abs(l.amount)));
    const pendingWithdrawCount = LEDGER.filter((l) => l.type === 'withdrawal' && l.status === 'pending_gateway').length;
    const pendingWithdrawAmount = sum(
      LEDGER.filter((l) => l.type === 'withdrawal' && l.status === 'pending_gateway').map((l) => Math.abs(l.amount)),
    );
    // قابلِ‌برداشت = واریز/آزادسازی/بازپرداختِ موفق منهای برداشت‌های نهایی‌شده
    const credits = sum(
      LEDGER.filter((l) => l.amount > 0 && (l.status === 'paid' || l.status === 'manually_verified' || l.status === 'refunded')).map((l) => l.amount),
    );
    const settledDebits = sum(
      LEDGER.filter((l) => l.amount < 0 && l.type !== 'escrow_lock' && (l.status === 'paid' || l.status === 'manually_verified')).map((l) => Math.abs(l.amount)),
    );
    const withdrawable = Math.max(credits - settledDebits, 0);
    return { withdrawable, escrow, pendingWithdrawCount, pendingWithdrawAmount };
  }, []);

  const TILES = [
    { key: 'withdrawable', label: 'موجودیِ قابلِ‌برداشت', value: tiles.withdrawable, icon: 'wallet', tone: 'good' as Tone, hint: 'تسویه‌شده و آماده' },
    { key: 'locked', label: 'قفل‌شده', value: tiles.escrow, icon: 'lock', tone: 'gold' as Tone, hint: 'تا پایانِ تورنومنت' },
    { key: 'escrow', label: 'موجودیِ escrow', value: tiles.escrow, icon: 'shield', tone: 'accent' as Tone, hint: 'مجموعِ قفل‌ها' },
    { key: 'pending', label: 'برداشتِ معلق', value: tiles.pendingWithdrawAmount, icon: 'hourglass', tone: 'gold' as Tone, hint: `${fmt(tiles.pendingWithdrawCount)} درخواست` },
  ];

  const filteredLedger = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LEDGER.filter((l) => {
      const okType = typeFilter === 'all' || l.type === typeFilter;
      const okSearch = !q || l.user.toLowerCase().includes(q) || l.ref.toLowerCase().includes(q);
      return okType && okSearch;
    });
  }, [search, typeFilter]);

  const filteredPayouts = useMemo(() => {
    const q = payoutSearch.trim().toLowerCase();
    return PAYOUTS.filter((p) => {
      const status = released[p.id] ? 'released' : p.status;
      const okStatus = payoutFilter === 'all' || status === payoutFilter;
      const okSearch = !q || p.tournament.toLowerCase().includes(q) || p.recipient.toLowerCase().includes(q);
      return okStatus && okSearch;
    });
  }, [payoutSearch, payoutFilter, released]);

  const releasePayout = (id: string, tournament: string, amount: number) => {
    if (!window.confirm(`آزادسازیِ جایزه‌ی «${tournament}» به مبلغِ ${money(amount)}؟\n\nآزادسازی مستلزمِ پایان‌یافتنِ تورنومنت و بسته‌شدنِ همه‌ی اختلاف‌هاست.`)) return;
    setReleased((r) => ({ ...r, [id]: true }));
    setNote(`جایزه‌ی «${tournament}» به مبلغِ ${money(amount)} آزاد شد.`);
  };

  return (
    <AdminGuard>
      <div className="space-y-5">
        <PageHeader
          title="مالی و escrow"
          subtitle="مدیریتِ دفترِ تراکنش‌ها، موجودیِ قفل‌شده در escrow و آزادسازیِ جوایز."
          actions={note ? <AdminBadge label={note} tone="good" dot /> : undefined}
        />

        {/* خلاصه‌ی مالی */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILES.map((t) => (
            <div key={t.key} className="rounded-2xl border border-line bg-tile p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-faint">{t.label}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${t.tone === 'good' ? 'bg-good/12 text-good' : t.tone === 'gold' ? 'bg-gold/15 text-gold' : 'bg-accent/12 text-accent'}`}>
                  <Ico name={t.icon} />
                </span>
              </div>
              <p className={`mt-2 font-display text-xl font-bold tnum ${t.tone === 'good' ? 'text-good' : t.tone === 'gold' ? 'text-gold' : 'text-accent'}`}>
                {money(t.value)}
              </p>
              <p className="mt-1 text-[11px] text-faint">{t.hint}</p>
            </div>
          ))}
        </section>

        {/* سوییچِ دو-تب */}
        <div className="inline-flex rounded-xl border border-line bg-tile p-1">
          {([
            { k: 'ledger', label: 'دفترِ تراکنش‌ها' },
            { k: 'payouts', label: 'پرداختِ جوایز' },
          ] as const).map((s) => (
            <button
              key={s.k}
              onClick={() => setTab(s.k)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === s.k ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ───── تبِ دفترِ تراکنش‌ها ───── */}
        {tab === 'ledger' && (
          <section className="rounded-2xl border border-line bg-tile p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint"><Ico name="search" /></span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جست‌وجوی کاربر یا کدِ ارجاع…"
                  className="w-full rounded-xl border border-line bg-tile2 py-2 pr-10 pl-3 text-sm outline-none transition focus:border-accent/50"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | LedgerType)}
                className="rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent/50"
              >
                <option value="all">همه‌ی انواع</option>
                {(Object.keys(LEDGER_FA) as LedgerType[]).map((t) => (
                  <option key={t} value={t}>{LEDGER_FA[t]}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-[11px] text-faint">
                    <th className="px-3 py-2 font-medium">کاربر</th>
                    <th className="px-3 py-2 font-medium">نوع</th>
                    <th className="px-3 py-2 font-medium">مبلغ</th>
                    <th className="px-3 py-2 font-medium">وضعیت</th>
                    <th className="px-3 py-2 font-medium">کدِ ارجاع</th>
                    <th className="px-3 py-2 font-medium">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((l) => {
                    const sm = PAYMENT_STATUS_META[l.status];
                    return (
                      <tr key={l.id} className="border-b border-line/60 last:border-0 transition hover:bg-white/[.02]">
                        <td className="px-3 py-3 font-semibold">{l.user}</td>
                        <td className="px-3 py-3 text-muted">{LEDGER_FA[l.type]}</td>
                        <td className={`px-3 py-3 font-display tnum font-bold ${l.amount > 0 ? 'text-good' : 'text-bad'}`}>
                          {l.amount > 0 ? '+' : '−'}{money(Math.abs(l.amount))}
                        </td>
                        <td className="px-3 py-3"><AdminBadge label={sm.label} tone={sm.tone} /></td>
                        <td className="px-3 py-3 font-display tnum text-faint">{l.ref}</td>
                        <td className="px-3 py-3 text-faint">{dateFa(l.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLedger.length === 0 && (
              <p className="py-10 text-center text-sm text-faint">موردی با این فیلتر نیست</p>
            )}
          </section>
        )}

        {/* ───── تبِ پرداختِ جوایز ───── */}
        {tab === 'payouts' && (
          <section className="rounded-2xl border border-line bg-tile p-5 space-y-4">
            <p className="rounded-xl border border-line bg-tile2 px-3 py-2 text-[11px] leading-5 text-faint">
              آزادسازیِ جایزه فقط پس از پایان‌یافتنِ تورنومنت و بسته‌شدنِ همه‌ی اختلاف‌ها مجاز است.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint"><Ico name="search" /></span>
                <input
                  value={payoutSearch}
                  onChange={(e) => setPayoutSearch(e.target.value)}
                  placeholder="جست‌وجوی تورنومنت یا دریافت‌کننده…"
                  className="w-full rounded-xl border border-line bg-tile2 py-2 pr-10 pl-3 text-sm outline-none transition focus:border-accent/50"
                />
              </div>
              <select
                value={payoutFilter}
                onChange={(e) => setPayoutFilter(e.target.value as 'all' | 'pending' | 'released' | 'held')}
                className="rounded-xl border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent/50"
              >
                <option value="all">همه‌ی وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="released">آزادشده</option>
                <option value="held">نگه‌داشته</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-right text-[11px] text-faint">
                    <th className="px-3 py-2 font-medium">تورنومنت</th>
                    <th className="px-3 py-2 font-medium">دریافت‌کننده</th>
                    <th className="px-3 py-2 font-medium">مبلغ</th>
                    <th className="px-3 py-2 font-medium">وضعیت</th>
                    <th className="px-3 py-2 font-medium text-left">اقدام</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => {
                    const status = released[p.id] ? 'released' : p.status;
                    const pm = PAYOUT_META[status];
                    return (
                      <tr key={p.id} className="border-b border-line/60 last:border-0 transition hover:bg-white/[.02]">
                        <td className="px-3 py-3 font-semibold">{p.tournament}</td>
                        <td className="px-3 py-3 text-muted">{p.recipient}</td>
                        <td className="px-3 py-3 font-display tnum font-bold text-gold">{money(p.amount)}</td>
                        <td className="px-3 py-3"><AdminBadge label={pm.label} tone={pm.tone} /></td>
                        <td className="px-3 py-3 text-left">
                          {status === 'pending' ? (
                            <button onClick={() => releasePayout(p.id, p.tournament, p.amount)} className="btn-primary px-3 py-1.5 text-xs">
                              <Ico name="release" size={14} /> آزادسازیِ جایزه
                            </button>
                          ) : (
                            <span className="text-xs text-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredPayouts.length === 0 && (
              <p className="py-10 text-center text-sm text-faint">موردی با این فیلتر نیست</p>
            )}
          </section>
        )}
      </div>
    </AdminGuard>
  );
}
