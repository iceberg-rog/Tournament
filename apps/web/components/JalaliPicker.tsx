'use client';

import { useState } from 'react';
import {
  J_MONTHS,
  J_WEEKDAYS,
  jToday,
  jMonthLength,
  jFirstWeekday,
  jalaliToISO,
  toJalaali,
} from '@/lib/jalali';

export default function JalaliPicker({ value, onChange }: { value?: string; onChange: (iso: string) => void }) {
  const init = (() => {
    if (value) {
      const d = new Date(value);
      const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return { jy: j.jy, jm: j.jm, jd: j.jd, h: d.getHours(), min: d.getMinutes() };
    }
    const t = jToday();
    return { jy: t.jy, jm: t.jm, jd: t.jd, h: 18, min: 0 };
  })();

  const [view, setView] = useState({ jy: init.jy, jm: init.jm });
  const [sel, setSel] = useState({ jy: init.jy, jm: init.jm, jd: init.jd });
  const [h, setH] = useState(init.h);
  const [min, setMin] = useState(init.min);

  const today = jToday();

  const emit = (s: { jy: number; jm: number; jd: number }, hh: number, mm: number) =>
    onChange(jalaliToISO(s.jy, s.jm, s.jd, hh, mm));
  const pickDay = (d: number) => {
    const s = { jy: view.jy, jm: view.jm, jd: d };
    setSel(s);
    emit(s, h, min);
  };
  const setTime = (hh: number, mm: number) => {
    setH(hh);
    setMin(mm);
    emit(sel, hh, mm);
  };

  const days = jMonthLength(view.jy, view.jm);
  const offset = jFirstWeekday(view.jy, view.jm);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="rounded-[18px] border border-line bg-tile2 p-3 shadow-[var(--shadow)]">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => (v.jm === 1 ? { jy: v.jy - 1, jm: 12 } : { jy: v.jy, jm: v.jm - 1 }))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-tile text-muted transition hover:border-accent-dim hover:text-accent"
          aria-label="ماه قبل"
        >
          ‹
        </button>
        <span className="font-display font-semibold">
          {J_MONTHS[view.jm - 1]} {view.jy}
        </span>
        <button
          type="button"
          onClick={() => setView((v) => (v.jm === 12 ? { jy: v.jy + 1, jm: 1 } : { jy: v.jy, jm: v.jm + 1 }))}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-tile text-muted transition hover:border-accent-dim hover:text-accent"
          aria-label="ماه بعد"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-faint">
        {J_WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) =>
          d === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => pickDay(d)}
              className={`tnum rounded-lg py-1.5 text-sm transition ${
                sel.jy === view.jy && sel.jm === view.jm && sel.jd === d
                  ? 'bg-accent font-bold text-[#06231f]'
                  : today.jy === view.jy && today.jm === view.jm && today.jd === d
                    ? 'text-accent ring-1 ring-accent/50 hover:bg-accent/10'
                    : 'hover:bg-accent/10'
              }`}
            >
              {d}
            </button>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
        <span className="text-faint">ساعت:</span>
        <select
          value={h}
          onChange={(e) => setTime(Number(e.target.value), min)}
          className="tnum rounded-lg border border-line bg-tile px-2 py-1 [color-scheme:dark]"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {pad(i)}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={min}
          onChange={(e) => setTime(h, Number(e.target.value))}
          className="tnum rounded-lg border border-line bg-tile px-2 py-1 [color-scheme:dark]"
        >
          {[0, 15, 30, 45].map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
        <span className="tnum ms-auto text-xs text-accent">
          {J_MONTHS[sel.jm - 1]} {sel.jd}، {sel.jy} — {pad(h)}:{pad(min)}
        </span>
      </div>
    </div>
  );
}
