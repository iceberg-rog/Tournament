'use client';

import { useParams } from 'next/navigation';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { useTournament } from '@/lib/admin/store';

export default function AuditLogPage() {
  const id = String(useParams().id);
  const t = useTournament(id);
  if (!t) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight">گزارشِ عملیاتِ این تورنومنت</h2>
          <p className="mt-0.5 text-xs text-faint">
            تاریخچه‌ی کاملِ رویدادها و تصمیم‌های مدیریتی برای «{t.title}» — به‌ترتیبِ زمانی، از تازه‌ترین.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-tile p-5">
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-tile2 px-3 py-2 text-xs text-muted">
          <svg className="mt-0.5 flex-none text-accent" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            همه‌ی اکشن‌های حساس (تأیید/رد، توقف/ازسرگیری، آزادسازیِ جوایز، بازپرداخت، حذفِ صلاحیت و رفعِ اختلاف) به‌صورتِ خودکار همین‌جا ثبت می‌شوند و قابلِ ویرایش یا حذف نیستند.
          </span>
        </div>

        <AuditLogList entityId={id} />
      </div>
    </div>
  );
}
