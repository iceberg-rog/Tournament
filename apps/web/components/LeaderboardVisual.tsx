/** ویژوالِ رتبه‌بندی: ستون‌های ELO با انیمیشنِ bar-rise و صدرنشینِ طلایی. */
export function LeaderboardVisual() {
  const bars = [
    { h: '38%', tone: 'bg-line2' },
    { h: '58%', tone: 'bg-accent/40' },
    { h: '100%', tone: 'bg-gradient-to-t from-gold-dim to-gold' },
    { h: '72%', tone: 'bg-accent/50' },
    { h: '48%', tone: 'bg-accent/30' },
    { h: '30%', tone: 'bg-line2' },
  ];
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-2 px-5 pb-3 pt-4">
      {bars.map((b, i) => (
        <div key={i} className="flex h-full flex-1 items-end">
          <span
            className={`block w-full origin-bottom rounded-t-md ${b.tone}`}
            style={{ height: b.h, animation: 'bar-rise .7s var(--ease) both', animationDelay: `${i * 80}ms` }}
          />
        </div>
      ))}
      {/* خطِ پایه */}
      <span className="pointer-events-none absolute inset-x-5 bottom-3 h-px bg-line2" />
    </div>
  );
}
