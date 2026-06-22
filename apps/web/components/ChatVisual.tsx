/** ویژوالِ چت: سه حبابِ گفتگو با تایپِ زنده‌ی نقطه‌چین. */
export function ChatVisual() {
  return (
    <div className="relative flex h-full w-full flex-col justify-center gap-1.5 px-4 py-3">
      {/* حبابِ طرفِ مقابل */}
      <div className="me-auto max-w-[62%] rounded-xl rounded-tr-sm border border-line2 bg-tile2 px-2.5 py-1.5">
        <span className="block h-1.5 w-16 rounded-full bg-muted/40" />
      </div>

      {/* حبابِ خودی (teal) */}
      <div className="ms-auto max-w-[58%] rounded-xl rounded-tl-sm border border-accent/30 bg-accent/10 px-2.5 py-1.5">
        <span className="mb-1 block h-1.5 w-20 rounded-full bg-accent/50" />
        <span className="block h-1.5 w-12 rounded-full bg-accent/40" />
      </div>

      {/* تایپِ زنده */}
      <div className="me-auto inline-flex items-center gap-1 rounded-xl rounded-tr-sm border border-line2 bg-tile2 px-2.5 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-faint anim-float-sm" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-faint anim-float-sm" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-faint anim-float-sm" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
