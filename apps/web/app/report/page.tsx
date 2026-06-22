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

const I = {
  flag: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></svg>,
};

export default function ReportPage() {
  const [category, setCategory] = useState('CHEAT');
  const [targetUserId, setTargetUserId] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn())
    return (
      <div className="card mx-auto max-w-xl p-6 text-sm text-muted">
        برای گزارش تخلف{' '}
        <Link href="/login" className="font-semibold text-accent">
          وارد شوید
        </Link>
        .
      </div>
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
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-accent/10 text-accent">{I.flag}</span>
        <div>
          <h1 className="text-[clamp(18px,2.4vw,24px)] font-semibold">گزارش تخلف</h1>
          <p className="mt-0.5 text-[12.5px] text-faint">تخلف را گزارش کنید تا توسط تیم بررسی شود</p>
        </div>
      </div>

      {done && (
        <p className="rounded-xl border border-good/30 bg-good/10 px-4 py-2 text-sm text-good">
          گزارش شما ثبت شد و توسط تیم بررسی می‌شود.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad">{error}</p>
      )}

      <div className="card space-y-3 p-5">
        <label className="block text-sm">
          <span className="text-muted">دسته</span>
          <select
            className="mt-1.5 w-full rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition focus:border-accent-dim"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.v} value={c.v}>
                {c.fa}
              </option>
            ))}
          </select>
        </label>
        <input
          className="w-full rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
          placeholder="شناسه‌ی کاربر متخلف (اختیاری)"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
          placeholder="شناسه‌ی تورنومنت (اختیاری)"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        />
        <textarea
          className="w-full rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm outline-none transition placeholder:text-faint focus:border-accent-dim"
          rows={4}
          placeholder="شرح تخلف..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button onClick={submit} className="btn-primary px-6">
          ثبت گزارش
        </button>
      </div>
    </div>
  );
}
