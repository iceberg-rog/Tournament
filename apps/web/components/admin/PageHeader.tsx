import type { ReactNode } from 'react';

/** سرصفحه‌ی استانداردِ هر صفحه‌ی مدیریت: عنوان + زیرعنوان + اکشن‌ها. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(20px,2.4vw,26px)] font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm leading-6 text-faint">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
