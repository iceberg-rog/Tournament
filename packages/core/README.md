# @tournament/core — دامنه‌ی تورنومنت

لایه‌ی دامنه که موتور (`@tournament/engine`) را به یک سرویسِ قابل‌پایداری وصل می‌کند: ساخت تورنومنت، ثبت‌نام، شروع، گزارش نتیجه، رده‌بندی.

## مدل Replay
وضعیت هر تورنومنت = **شرکت‌کننده‌ها + لاگِ رویدادها** (`events`). هر عملیات، موتور را از صفر بازسازی (replay) می‌کند. مزایا:
- **قطعی و قابل‌بازسازی** (مستقل از حافظه‌ی فرایند) → سازگار با persistence و restart.
- ذخیره‌سازی ساده: فقط لیست رویدادها پایدار می‌شود، نه کل گراف براکت.

## اجزا
- `TournamentRepository` — انتزاع پایداری (`create/get/update/list`).
- `InMemoryTournamentRepository` — برای تست و توسعه‌ی محلی (بدون دیتابیس). نسخه‌ی Prisma بعداً افزوده می‌شود.
- `TournamentService` — `create / register / start / ready / reportDuel / reportLobby / checkIn / declareNoShow / standings / champion`.
- **check-in / no-show** (اختیاری per-tournament با `requireCheckIn`): پیش از ثبت نتیجه‌ی یک DUEL هر دو طرف باید check-in کنند؛ اگر یک طرف نیامد، طرفِ حاضر می‌تواند no-show اعلام کند و خودکار برنده شود (`source: 'NO_SHOW'`).
- **استخر جایزه + کیف پول**: با تعریف `prizePool` (per-rank)، هنگام پایان تورنومنت جوایز یک‌بار به کیف پول برنده‌ها واریز می‌شود (`WalletRepository` + `InMemoryWalletRepository`؛ نسخه‌ی Prisma/escrow/KYC از قدم‌های بعدی).

## تست
```bash
npm run test -w @tournament/core
```
چرخه‌ی کامل را برای هر ۵ فرمت (۲۳ سناریو) اجرا می‌کند: ساخت → ثبت‌نام چند کاربر → اعتبارسنجی (تکراری/بعد از شروع رد می‌شود) → شروع → گزارش همه‌ی مسابقات → تأیید قهرمان و رده‌بندی ۱..N. همه پاس.

## قدم بعد
- `PrismaTournamentRepository` (پایداری روی PostgreSQL).
- ماژول HTTP در `apps/api` (endpointهای REST روی همین سرویس).
