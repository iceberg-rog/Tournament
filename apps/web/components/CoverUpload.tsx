'use client';

import { useRef, useState } from 'react';
import { CoverBanner } from './CoverBanner';

function downscale(file: File, maxW = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no ctx'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CoverUpload({
  value,
  game,
  onChange,
}: {
  value?: string;
  game?: string;
  onChange: (dataUrl: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file?: File) {
    setErr('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErr('فقط فایلِ عکس');
    if (file.size > 6 * 1024 * 1024) return setErr('حجمِ عکس زیاد است (حداکثر ۶ مگابایت)');
    try {
      onChange(await downscale(file));
    } catch {
      setErr('خطا در خواندنِ عکس');
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden rounded-[18px] border-2 border-dashed transition ${
          drag ? 'border-accent bg-accent/10' : 'border-line hover:border-accent-dim'
        }`}
      >
        {value ? (
          <CoverBanner coverImage={value} game={game} className="h-44 w-full" rounded="rounded-xl" />
        ) : (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-muted">
            <span className="grid h-12 w-12 place-items-center rounded-[11px] bg-accent/10 text-accent">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            <p className="text-sm">عکسِ کاور را اینجا بکش و رها کن، یا کلیک کن</p>
            <p className="text-xs text-faint">JPG / PNG — به‌صورت خودکار بهینه می‌شود</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="mt-2 text-xs text-bad hover:underline">
          حذفِ عکس و استفاده از کاورِ خودکار
        </button>
      )}
      {err && <p className="mt-1 text-xs text-bad">{err}</p>}
    </div>
  );
}
