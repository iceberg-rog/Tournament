import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'شلتر تورنومنت — پلتفرم مسابقات آنلاین',
  description: 'پلتفرم برگزاری مسابقات آنلاین بازی‌های ویدیویی',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen text-slate-100">{children}</body>
    </html>
  );
}
