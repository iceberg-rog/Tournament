'use client';

import { useState } from 'react';

/** ورودیِ secret — به‌صورتِ پیش‌فرض ماسک؛ نمایش فقط برای super_admin (با ثبتِ ممیزی). */
export function SecretInput({
  value,
  onChange,
  canReveal,
  onReveal,
  onRotate,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  canReveal: boolean;
  onReveal: () => void;
  onRotate?: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const reveal = () => {
    if (!canReveal) return;
    if (!show) onReveal();
    setShow((v) => !v);
  };
  return (
    <div className="flex items-center gap-1.5">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? '••••••••'}
        className="min-w-0 flex-1 rounded-lg border border-line bg-tile2 px-3 py-2 text-sm outline-none focus:border-accent-dim disabled:opacity-60"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={reveal}
        disabled={!canReveal}
        title={canReveal ? 'نمایش/مخفی' : 'فقط مدیرِ کل می‌تواند ببیند'}
        className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line text-faint transition hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A9.6 9.6 0 0 1 12 4c5 0 9 4.5 9 8a12 12 0 0 1-2.2 3.2M6.6 6.6A12 12 0 0 0 3 12c0 3.5 4 8 9 8a9.5 9.5 0 0 0 3.4-.6" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
      {value && (
        <button type="button" onClick={() => navigator.clipboard?.writeText(value)} title="کپی" className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line text-faint transition hover:text-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        </button>
      )}
      {onRotate && !disabled && (
        <button type="button" onClick={onRotate} title="چرخشِ کلید" className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line text-faint transition hover:text-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>
        </button>
      )}
    </div>
  );
}
