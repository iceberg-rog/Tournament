'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authedPost, isLoggedIn } from '@/lib/api';

const I = {
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  key: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3 19 4M16 7l3 3M14 9l2 2" /></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
};

export default function SecurityPage() {
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  if (!isLoggedIn())
    return (
      <div className="card p-6 text-sm text-muted">
        برای امنیت{' '}
        <Link href="/login" className="text-accent">
          وارد شوید
        </Link>
        .
      </div>
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
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card p-5">
        <div className="tile-head !mb-0">
          <span className="tile-ic">{I.shield}</span>
          <span className="tile-title">امنیت — احراز هویت دومرحله‌ای</span>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-2.5 text-sm text-bad">{error}</p>
      )}

      {enabled ? (
        <div className="card flex items-center gap-3 p-5">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-good/15 text-good">
            {I.check}
          </span>
          <p className="text-sm font-semibold text-good">احراز هویت دومرحله‌ای فعال شد.</p>
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          {!secret ? (
            <button onClick={setup} className="btn-primary">
              <span>{I.key}</span>
              شروع راه‌اندازی 2FA
            </button>
          ) : (
            <>
              <p className="text-sm text-muted">
                این رمز را در اپلیکیشن Authenticator (Google Authenticator، …) وارد کنید:
              </p>
              <p className="break-all rounded-xl border border-line bg-tile2 p-3 font-mono text-sm text-[#5eead4]">{secret}</p>
              <p className="break-all text-xs text-faint">{uri}</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="w-40 rounded-xl border border-line bg-tile2 px-3 py-2.5 text-sm tnum text-text outline-none transition placeholder:text-faint focus:border-accent-dim"
                  inputMode="numeric"
                  placeholder="کد ۶ رقمی"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={enable} className="btn-primary">
                  <span>{I.check}</span>
                  فعال‌سازی
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
