'use client';

import { useEffect, useState } from 'react';
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
      <main className="p-8">
        برای کیف پول{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">کیف پول</h1>

      {bal && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-900 p-5">
            <p className="text-sm text-slate-400">موجودی در دسترس</p>
            <p className="text-2xl font-bold text-emerald-400">{fmt(bal.available)} ﷼</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-5">
            <p className="text-sm text-slate-400">مسدودی (escrow)</p>
            <p className="text-2xl font-bold text-amber-400">{fmt(bal.escrow)} ﷼</p>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-red-400">{error}</p>}
      {msg && <p className="mb-3 text-emerald-400">{msg}</p>}

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">شارژ کیف پول</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2"
            value={depAmount}
            onChange={(e) => setDepAmount(e.target.value)}
            placeholder="مبلغ (ریال)"
          />
          <button onClick={() => act(deposit, 'شارژ انجام شد')} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
            شارژ از درگاه
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">احراز هویت (KYC)</h2>
        {kyc?.status === 'APPROVED' ? (
          <p className="text-emerald-400">✅ احراز هویت تأیید شده است.</p>
        ) : kyc?.status === 'PENDING' ? (
          <p className="text-amber-400">⏳ پرونده‌ی شما در حال بررسی است.</p>
        ) : (
          <div className="space-y-2">
            {kyc?.status === 'REJECTED' && <p className="text-red-400">رد شد: {kyc.reason}</p>}
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="نام و نام خانوادگی" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className="w-40 rounded-lg bg-slate-800 px-3 py-2" placeholder="کد ملی (۱۰ رقم)" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            </div>
            <button
              onClick={() => act(() => authedPost('/kyc', { fullName, nationalId }), 'ارسال شد')}
              className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500"
            >
              ارسال برای احراز هویت
            </button>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">برداشت جایزه</h2>
        {kyc?.status !== 'APPROVED' ? (
          <p className="text-slate-400">برای برداشت، ابتدا احراز هویت را تکمیل کنید.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input className="w-40 rounded-lg bg-slate-800 px-3 py-2" placeholder="مبلغ" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} />
              <input className="flex-1 rounded-lg bg-slate-800 px-3 py-2 font-mono" placeholder="شماره شبا (IRxxxxxxxxxxxxxxxxxxxxxxxx)" value={iban} onChange={(e) => setIban(e.target.value)} />
            </div>
            <button
              onClick={() => act(() => authedPost('/withdrawals', { amount: Number(wdAmount), iban }), 'درخواست ثبت شد')}
              className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500"
            >
              درخواست برداشت
            </button>
          </div>
        )}
        {wds.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {wds.map((w) => (
              <li key={w.id} className="flex justify-between border-t border-slate-800 py-1">
                <span>{fmt(w.amount)} ﷼ → {w.iban.slice(0, 8)}…</span>
                <span className={w.status === 'PAID' ? 'text-emerald-400' : w.status === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}>
                  {w.status === 'PAID' ? 'پرداخت‌شده' : w.status === 'REJECTED' ? 'ردشده' : 'در انتظار'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg bg-slate-900 p-5">
        <h2 className="mb-3 font-bold">تاریخچه‌ی تراکنش‌ها</h2>
        <ul className="space-y-1 text-sm">
          {[...history].reverse().map((e) => {
            const delta = e.availableDelta || e.escrowDelta;
            return (
              <li key={e.id} className="flex justify-between border-t border-slate-800 py-1">
                <span className="text-slate-400">{e.type}</span>
                <span className={delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {delta >= 0 ? '+' : ''}
                  {fmt(delta)} ﷼
                </span>
              </li>
            );
          })}
          {history.length === 0 && <li className="text-slate-400">تراکنشی ثبت نشده.</li>}
        </ul>
      </section>
    </main>
  );
}
