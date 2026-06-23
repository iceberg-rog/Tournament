import type { CRParticipant } from '@/lib/admin/controlRoom';

/** آواتارِ رنگیِ هر بازیکن/تیم — رنگ و حرفِ اختصاصی. */
export function Avatar({ p, size = 32 }: { p?: Pick<CRParticipant, 'initials' | 'color' | 'name'> | null; size?: number }) {
  if (!p)
    return (
      <span className="grid flex-none place-items-center rounded-lg border border-dashed border-line text-faint" style={{ width: size, height: size, fontSize: size * 0.36 }}>
        ؟
      </span>
    );
  return (
    <span
      className="grid flex-none place-items-center rounded-lg font-display font-bold text-[#0b0c10]"
      style={{ width: size, height: size, fontSize: size * 0.36, background: p.color }}
      title={p.name}
    >
      {p.initials}
    </span>
  );
}
