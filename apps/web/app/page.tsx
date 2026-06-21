import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-4xl font-bold">🏆 پلتفرم مسابقات آنلاین</h1>
      <p className="text-lg text-slate-400">
        برگزاری مسابقات بازی‌های ویدیویی روی همه‌ی پلتفرم‌ها
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="rounded-lg bg-indigo-600 px-6 py-3 font-medium transition hover:bg-indigo-500"
        >
          ثبت‌نام
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-700 px-6 py-3 font-medium transition hover:bg-slate-800"
        >
          ورود
        </Link>
      </div>
    </main>
  );
}
