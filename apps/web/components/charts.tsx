'use client';

/** نمودار حلقه‌ای (donut) با چند بخش. */
export function Donut({
  segments,
  size = 150,
  thickness = 18,
  center,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </g>
      {center && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontWeight="800"
          fontSize={size * 0.2}
        >
          {center}
        </text>
      )}
    </svg>
  );
}

/** پیشرفت دایره‌ای (مثلاً نرخ برد). */
export function RadialProgress({ value, size = 130, label }: { value: number; size?: number; label?: string }) {
  const thickness = 12;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const len = (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="radial-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#radial-grad)"
            strokeWidth={thickness}
            strokeDasharray={`${len} ${circ}`}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-extrabold">{value}%</p>
          {label && <p className="text-[10px] text-slate-400">{label}</p>}
        </div>
      </div>
    </div>
  );
}

/** نمودار میله‌ای عمودی. */
export function BarChart({
  data,
  height = 150,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-10 text-center text-sm text-slate-500">داده‌ای نیست</p>;
  return (
    <div>
      <div className="flex items-end gap-3 px-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
            <span className="absolute inset-x-0 -top-5 text-center text-xs font-semibold text-slate-200">{d.value}</span>
            <div
              className="rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-500 transition-all"
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 truncate text-center text-[10px] text-slate-400" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** نمودار سطحی (area) برای روند. */
export function AreaChart({ values, height = 120, max }: { values: number[]; height?: number; max?: number }) {
  if (values.length === 0) return <p className="py-10 text-center text-sm text-slate-500">داده‌ای نیست</p>;
  const m = max ?? Math.max(1, ...values);
  const n = values.length;
  const w = 100;
  const pts = values.map((v, i) => [(i / Math.max(1, n - 1)) * w, height - (v / m) * height] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(217,70,239,0.45)" />
          <stop offset="100%" stopColor="rgba(217,70,239,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-grad)" />
      <path d={line} fill="none" stroke="#d946ef" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill="#f0abfc" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
