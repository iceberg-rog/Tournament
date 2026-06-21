'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';

export default function SecurityPage() {
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn())
    return (
      <main className="p-8">
        برای امنیت{' '}
        <Link href="/login" className="text-indigo-400">
          وارد شوید
        </Link>
        .
      </main>
    );

  async function setup() {
    setError('');
    try {
      const r = await authedPost<{ secret: string; otpauthUri: string }>('/auth/2fa/setup', {});
      setSecret(r.secret);
      setUri(r.otpauthUri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  async function enable() {
    setError('');
    try {
      await authedPost('/auth/2fa/enable', { code });
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">امنیت — احراز هویت دومرحله‌ای</h1>
      {error && <p className="mb-3 text-red-400">{error}</p>}

      {enabled ? (
        <p className="text-emerald-400">✅ احراز هویت دومرحله‌ای فعال شد.</p>
      ) : (
        <div className="space-y-4 rounded-lg bg-slate-900 p-5">
          {!secret ? (
            <button onClick={setup} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
              شروع راه‌اندازی 2FA
            </button>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                این رمز را در اپلیکیشن Authenticator (Google Authenticator، …) وارد کنید:
              </p>
              <p className="break-all rounded-lg bg-slate-800 p-3 font-mono text-sm">{secret}</p>
              <p className="break-all text-xs text-slate-500">{uri}</p>
              <div className="flex gap-2">
                <input
                  className="w-40 rounded-lg bg-slate-800 px-3 py-2"
                  inputMode="numeric"
                  placeholder="کد ۶ رقمی"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={enable} className="rounded-lg bg-indigo-600 px-5 py-2 hover:bg-indigo-500">
                  فعال‌سازی
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
