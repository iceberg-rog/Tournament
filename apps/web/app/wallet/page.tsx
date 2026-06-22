'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { authedGet, authedPost, isLoggedIn } from '@/lib/api';

interface Balance {
  available: number;
  escrow: number;
}
interface Ledger {
  id: string;
  type: string;
  availableDelta: number;
  escrowDelta: number;
  ref: string;
  createdAt: string;
}
interface Kyc {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  fullName?: string;
  reason?: string;
}
interface Withdrawal {
  id: string;
  amount: number;
  iban: string;
  status: string;
  reason?: string;
}

const fmt = (n: number) => n.toLocaleString('fa-IR');

const I = {
  wallet: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></svg>,
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>,
  list: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
};

const SectionHead = ({ icon, title, amber }: { icon: ReactNode; title: string; amber?: boolean }) => (
  <div className="tile-head">
    <span className={`tile-ic ${amber ? 'amber' : ''}`}>{icon}</span>
    <span className="tile-title">{title}</span>
  </div>
);

export default function WalletPage() {
  const [bal, setBal] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Ledger[]>([]);
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [wds, setWds] = useState<Withdrawal[]>([]);
  const [depAmount, setDepAmount] = useState('100000');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [iban, setIban] = useState('IR');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const loggedIn = isLoggedIn();

  async function load() {
    setBal(await authedGet<Balance>('/wallet'));
    setHistory(await authedGet<Ledger[]>('/wallet/history'));
    setKyc(await authedGet<Kyc | null>('/kyc').catch(() => ({ status: 'NONE' as const })));
    setWds(await authedGet<Withdrawal[]>('/withdrawals').catch(() => []));
  }
  useEffect(() => {
    if (loggedIn) load().catch((e) => setError(e.message));
  }, [loggedIn]);

  async function act(fn: () => Promise<unknown>, ok = '') {
    setError('');
    setMsg('');
    try {
      await fn();
      await load();
      if (ok) setMsg(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  async function deposit() {
    const amount = Number(depAmount);
    const dep = await authedPost<{ payment: { id: string } }>('/wallet/deposit', { amount });
    // در حالت sandbox، تأیید بلافاصله انجام می‌شود؛ در درگاه واقعی این مرحله از طریق callback است.
    await authedPost(`/wallet/deposit/${dep.payment.id}/verify`, {});
  }

  if (!loggedIn)
    return (
      <div className="card grid place-items-center p-10 text-center text-muted">
        <p>
          برای کیف پول{' '}
          <Link href="/login" className="text-accent">
            وارد شوید
          </Link>
          .
        </p>
      </div>
    );

  const inputCls = 'rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm text-text placeholder:text-faint outline-none transition focus:border-accent-dim';

  return (
    <div className="space-y-4">
      {/* ===== موجودی (feature tile · amber) ===== */}
      <article className="tile feature">
        <SectionHead amber icon={I.wallet} title="موجودی کیف پول" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[12px] text-faint">موجودی در دسترس</p>
            <p className="mt-1 font-display text-[clamp(26px,4vw,38px)] font-bold leading-none tnum text-gold">
              {bal ? fmt(bal.available) : '—'}
              <span className="ms-1 align-middle text-sm font-semibold text-muted">﷼</span>
            </p>
          </div>
          <div className="border-s border-line ps-4">
            <p className="flex items-center gap-1.5 text-[12px] text-faint"><span className="text-faint">{I.lock}</span> مسدودی (escrow)</p>
            <p className="mt-1 font-display text-[clamp(22px,3.4vw,30px)] font-bold leading-none tnum text-accent">
              {bal ? fmt(bal.escrow) : '—'}
              <span className="ms-1 align-middle text-sm font-semibold text-muted">﷼</span>
            </p>
          </div>
        </div>
      </article>

      {error && <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-center text-sm text-bad">{error}</p>}
      {msg && <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-center text-sm text-accent">{msg}</p>}

      {/* ===== شارژ کیف پول ===== */}
      <section className="card p-5">
        <SectionHead icon={I.plus} title="شارژ کیف پول" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={`flex-1 ${inputCls}`}
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
            placeholder="مبلغ (ریال)"
          />
          <button onClick={() => act(deposit, 'شارژ انجام شد')} className="btn-primary flex-none">
            شارژ از درگاه
          </button>
        </div>
      </section>

      {/* ===== احراز هویت (KYC) ===== */}
      <section className="card p-5">
        <SectionHead icon={I.shield} title="احراز هویت (KYC)" />
        {kyc?.status === 'APPROVED' ? (
          <p className="text-good">احراز هویت تأیید شده است.</p>
        ) : kyc?.status === 'PENDING' ? (
          <p className="text-gold">پرونده‌ی شما در حال بررسی است.</p>
        ) : (
          <div className="space-y-3">
            {kyc?.status === 'REJECTED' && <p className="text-bad">رد شد: {kyc.reason}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className={`flex-1 ${inputCls}`} placeholder="نام و نام خانوادگی" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className={`w-full sm:w-44 ${inputCls}`} placeholder="کد ملی (۱۰ رقم)" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            </div>
            <button
              onClick={() => act(() => authedPost('/kyc', { fullName, nationalId }), 'ارسال شد')}
              className="btn-primary"
            >
              ارسال برای احراز هویت
            </button>
          </div>
        )}
      </section>

      {/* ===== برداشت جایزه ===== */}
      <section className="card p-5">
        <SectionHead icon={I.download} title="برداشت جایزه" />
        {kyc?.status !== 'APPROVED' ? (
          <p className="text-muted">برای برداشت، ابتدا احراز هویت را تکمیل کنید.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className={`w-full sm:w-44 ${inputCls}`} placeholder="مبلغ" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} />
              <input className={`flex-1 font-mono ${inputCls}`} placeholder="شماره شبا (IRxxxxxxxxxxxxxxxxxxxxxxxx)" value={iban} onChange={(e) => setIban(e.target.value)} />
            </div>
            <button
              onClick={() => act(() => authedPost('/withdrawals', { amount: Number(wdAmount), iban }), 'درخواست ثبت شد')}
              className="btn-primary"
            >
              درخواست برداشت
            </button>
          </div>
        )}
        {wds.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {wds.map((w) => (
              <li key={w.id} className="row-soft flex items-center justify-between px-3 py-2">
                <span className="tnum">{fmt(w.amount)} ﷼ → {w.iban.slice(0, 8)}…</span>
                <span className={`chip ${w.status === 'PAID' ? 'bg-good/15 text-good' : w.status === 'REJECTED' ? 'bg-bad/15 text-bad' : 'bg-gold/15 text-gold'}`}>
                  {w.status === 'PAID' ? 'پرداخت‌شده' : w.status === 'REJECTED' ? 'ردشده' : 'در انتظار'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== تاریخچه‌ی تراکنش‌ها ===== */}
      <section className="card p-5">
        <SectionHead icon={I.list} title="تاریخچه‌ی تراکنش‌ها" />
        <ul className="space-y-1.5 text-sm">
          {[...history].reverse().map((e) => {
            const delta = e.availableDelta || e.escrowDelta;
            return (
              <li key={e.id} className="row-soft flex items-center justify-between px-3 py-2">
                <span className="text-muted">{e.type}</span>
                <span className={`num font-semibold ${delta >= 0 ? 'text-good' : 'text-bad'}`}>
                  {delta >= 0 ? '+' : ''}
                  {fmt(delta)} ﷼
                </span>
              </li>
            );
          })}
          {history.length === 0 && <li className="px-3 py-2 text-faint">تراکنشی ثبت نشده.</li>}
        </ul>
      </section>
    </div>
  );
}
