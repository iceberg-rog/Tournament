'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';

const CATEGORIES = [
  { v: 'CHEAT', fa: 'تقلب (aimbot/hack)' },
  { v: 'ABUSE', fa: 'رفتار توهین‌آمیز' },
  { v: 'SMURF', fa: 'اسمرف / مولتی‌اکانت' },
  { v: 'NO_SHOW', fa: 'عدم حضور' },
  { v: 'OTHER', fa: 'سایر' },
];

export default function ReportPage() {
  const [category, setCategory] = useState('CHEAT');
  const [targetUserId, setTargetUserId] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn())
    return (
      <main className="p-8">
        برای گزارش تخلف{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  async function submit() {
    setError('');
    try {
      await authedPost('/reports', {
        category,
        reason,
        targetUserId: targetUserId || undefined,
        tournamentId: tournamentId || undefined,
      });
      setDone(true);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">گزارش تخلف</h1>
      {done && <p className="mb-3 text-emerald-400">گزارش شما ثبت شد و توسط تیم بررسی می‌شود. ✅</p>}
      {error && <p className="mb-3 text-red-400">{error}</p>}

      <div className="space-y-3 rounded-lg bg-slate-900 p-5">
        <label className="block text-sm">
          <span className="text-slate-400">دسته</span>
          <select className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>
                {c.fa}
              </option>
            ))}
          </select>
        </label>
        <input className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="شناسه‌ی کاربر متخلف (اختیاری)" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} />
        <input className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="شناسه‌ی تورنومنت (اختیاری)" value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} />
        <textarea className="w-full rounded-lg bg-slate-800 px-3 py-2" rows={4} placeholder="شرح تخلف..." value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={submit} className="rounded-lg bg-indigo-600 px-6 py-2 hover:bg-indigo-500">
          ثبت گزارش
        </button>
      </div>
    </main>
  );
}
