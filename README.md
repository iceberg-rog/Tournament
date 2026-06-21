# 🏆 Tournament — پلتفرم برگزاری مسابقات آنلاین

پلتفرم جامع و **config-driven** برای برگزاری مسابقات آنلاین بازی‌های ویدیویی روی **همه‌ی پلتفرم‌ها و کنسول‌ها** (PC، PS5/PS4، Xbox Series/One، Switch، موبایل) — با تمرکز بر **بازار ایران** (پرداخت ریالی، فارسی/RTL، کامیونیتی محلی).

> این مخزن شامل **اسناد طراحی کامل** و یک **پیاده‌سازیِ عملیاتیِ end-to-end** است:
> بک‌اند (NestJS + Prisma)، فرانت‌اند (Next.js)، و موتور تورنومنت — همه روی SQLite اجرا می‌شوند و زنده تست شده‌اند.

---

## 📚 اسناد طراحی

| سند | توضیح |
|------|-------|
| [۰۱ — طراحی کامل سیستم](docs/01-System-Design.md) | سند اصلی (~۸۴هزار کلمه، ~۹۸ دیاگرام Mermaid): مدل پایه، پلتفرم/cross-play، ثبت‌نام، ماشین حالت مسابقه، نتیجه/داوری، موتور براکت، مالی/payout، تعدیل، کامیونیتی، matchmaking/ladder، پروفایل/گیمیفیکیشن، صفحات عمومی، RBAC ریزدانه، و ممیزی فنی نهایی |
| [۰۲ — پروپوزال v2](docs/02-Proposal-v2.md) | پروپوزال اجرایی بازنویسی‌شده |
| [۰۳ — تحلیل رقابتی](docs/03-Competitive-Analysis.md) | تحلیل Toornament و درس‌های صنعت |
| [نمودار Use-Case](docs/use-case/UseCase.puml) | نمودار UML (PlantUML) |
| [مدل Use-Case](docs/use-case/model.json) | مدل ساخت‌یافته (۸ نقش، ۳۱ یوزکیس) |

> 💡 دیاگرام‌های Mermaid داخل سند طراحی، روی GitHub به‌صورت خودکار رندر می‌شوند.

---

## 🛠️ پشته‌ی فنی پیشنهادی

| لایه | فناوری |
|------|--------|
| زبان | TypeScript (سراسری) |
| فرانت‌اند | Next.js (React) + Tailwind CSS |
| بک‌اند | NestJS (Node.js) |
| دیتابیس | PostgreSQL + Prisma (ACID + ledger/escrow) |
| Real-time | Socket.IO + Redis |
| صف کار | BullMQ (زمان‌بندی خودکار مسابقات) |
| پرداخت | زرین‌پال (لایه‌ی انتزاعی) |
| امنیت | JWT + Argon2 + RBAC |
| DevOps | Docker + GitHub Actions + VPS |

---

## ✨ قابلیت‌های کلیدی

- فرمت‌های متنوع: single/double elimination، round-robin، Swiss، گروهی→پلی‌آف، **Battle Royale/FFA** (placement-محور)
- پشتیبانی همه‌ی پلتفرم‌ها با **cross-play config-driven** per-game
- ثبت‌نام با اعتبارسنجی گیمرتگ، check-in، مدیریت no-show و داوری انسان‌در‌حلقه
- کیف پول، escrow، KYC، پرداخت خودکار جایزه
- **کامیونیتی/Spaces** (اختیاری per تورنومنت)، matchmaking، ELO ladder، leagues
- صفحات عمومی (کاتالوگ بازی، ۳ حالت مسابقه، جزئیات عمومی)
- RBAC ریزدانه (اختصاص ادمین به یک مسابقه‌ی خاص)

---

## 🚀 شروع توسعه (Getting Started)

### پیش‌نیازها
- Node.js ≥ ۲۰ — دیتابیسِ پیش‌فرض **SQLite** است؛ به سرور دیتابیس یا Docker نیازی نیست.

### راه‌اندازی
```bash
npm install                              # نصب وابستگی‌ها (npm workspaces)
cp apps/api/.env.example apps/api/.env   # فایل محیط (DATABASE_URL=file:./dev.db)
npm run prisma:migrate                   # ساخت دیتابیس SQLite + جدول‌ها
npm run dev:api                          # اجرای API روی پورت 4000
npm run dev:web                          # (ترمینال دیگر) اجرای Web روی پورت 3000
```
سپس http://localhost:3000 → ثبت‌نام → تورنومنت‌ها.

### دموی زنده‌ی end-to-end
با سرورِ در حال اجرا:
```bash
node apps/api/scripts/live-demo.mjs
```
ثبت‌نام ۴ کاربر → ساخت تورنومنت → بازی کامل → رده‌بندی — همه علیه دیتابیس واقعی.

> **پروداکشن:** برای مقیاس‌پذیری، `provider` را در `apps/api/prisma/schema.prisma` به `postgresql` و `DATABASE_URL` را به Postgres تغییر دهید (`docker-compose.yml` برای Postgres + Redis آماده است).

### ساختار مخزن
```
apps/api          — بک‌اند NestJS + Prisma (هویت، تورنومنت، تنظیمات، پرداخت، فصل، کامیونیتی، ladder)
apps/web          — فرانت‌اند Next.js (اصلی، ثبت‌نام/ورود، داشبورد، تورنومنت، فصل، کامیونیتی، ladder، تنظیمات)
packages/engine   — موتور تورنومنت (همه‌ی فرمت‌ها) + شبیه‌ساز
packages/core     — دامنه (تورنومنت، کیف پول، فصل، کامیونیتی، ladder، تنظیمات، پرداخت)
docs/             — اسناد طراحی کامل
```

### endpointهای API
```
# هویت
POST /api/auth/register · /login · /refresh
# تورنومنت
POST /api/tournaments · GET (لیست) · GET /:id · POST /:id/register · /start
GET  /api/tournaments/:id/ready · POST /:id/matches/:mid/report · GET /:id/standings
# تنظیمات پایه‌ی مدیریت (فقط ADMIN — درگاه پرداخت و کلیدهای API)
GET  /api/settings · PUT /api/settings
# پرداخت (درگاه از تنظیمات: Sandbox یا زرین‌پالِ واقعی)
POST /api/payments · POST /api/payments/:id/verify · GET /api/payments/:id
# فصل‌ها (رده‌بندی placement-محور روی چند تورنومنت)
POST /api/seasons · GET (لیست) · GET /:id · POST /:id/tournaments · GET /:id/standings
# کامیونیتی / Spaces
POST /api/spaces · GET (لیست) · GET /:id · POST /:id/join · /:id/post
# نردبان ELO / matchmaking
POST /api/ladders · GET /:id · POST /:id/join · /:id/matchmake · /:id/report · GET /:id/standings
```

### راه‌اندازی مدیر و درگاه پرداخت (رفتن به حالت واقعی)
```bash
node apps/api/scripts/make-admin.mjs you@example.com   # ارتقای کاربر به ADMIN
```
سپس در صفحه‌ی `/settings` (فقط مدیر) **Merchant ID** واقعی زرین‌پال و `Callback URL` را وارد و
گزینه‌ی **sandbox** را خاموش کنید. از این پس درخواست‌های پرداخت به درگاه واقعی زرین‌پال می‌روند؛
تا وقتی sandbox روشن است، پرداختِ آزمایشی بدون merchant واقعی کار می‌کند.

### اجرای شبیه‌ساز و تست‌ها
```bash
npm run sim  -w @tournament/engine   # ۳۶ سناریوی موتور: همه‌ی فرمت‌ها × تعداد کاربر
npm run test -w @tournament/core     # ۳۶ سناریوی دامنه
npm run test:e2e -w @tournament/api  # ۱۲ تست e2e
```

---

## 📌 وضعیت

- ✅ طراحی کامل سیستم (با ممیزی فنیِ خصمانه و رفع ۱۸ یافته)
- ✅ **موتور تورنومنت**: ۵ فرمت (single/double elim، round-robin، Swiss، FFA/Battle Royale) + شبیه‌ساز **۳۶/۳۶ پاس**
- ✅ **دامنه** (`@tournament/core`): تورنومنت، کیف پول، فصل، کامیونیتی، ladder، تنظیمات، پرداخت — تست **۳۶/۳۶ پاس**
- ✅ **API** (NestJS + Prisma): هویت، تورنومنت، تنظیمات، پرداخت، فصل، کامیونیتی، ladder — **e2e ۱۲/۱۲**، روی SQLite **زنده تست‌شده** end-to-end
- ✅ **فرانت‌اند** (Next.js، RTL/فارسی): تورنومنت، فصل، کامیونیتی، ladder، تنظیمات مدیریت، داشبورد — **build سالم**
- ✅ **امنیت**: JWT + Argon2 + **RBAC** (تنظیماتِ حاوی اسرار فقط ADMIN)
- ✅ **پرداخت**: لایه‌ی انتزاعی درگاه + **زرین‌پالِ واقعی** (Payment API v4) با انتخابِ پویا از تنظیمات
- ⬜ نیازمندِ منابعِ دنیای واقعی: اکانت merchant واقعی + KYC، کلید واقعی پیامک/OAuth، و دیپلوی روی Postgres + هاست (همه از تنظیمات قابلِ plug)
