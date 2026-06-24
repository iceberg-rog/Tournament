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

### راه‌اندازی (روی هر سیستمِ تازه)
> راهنمای کاملِ گام‌به‌گام: **[SETUP.md](SETUP.md)**.
```bash
git clone <repo-url> && cd Tournament
npm install                              # نصب وابستگی‌ها (npm workspaces)
cp apps/api/.env.example apps/api/.env   # محیطِ API (DATABASE_URL=file:./dev.db)
npm run prisma:migrate                   # ساخت/مهاجرتِ دیتابیس SQLite + جدول‌ها
npm run prisma:generate                  # تولیدِ Prisma Client
npm run seed -w @tournament/api          # ⭐ ساختِ اکانتِ مدیر + بازیکنانِ دمو + کاتالوگِ بازی
npm run dev:api                          # اجرای API روی پورت 4000
npm run dev:web                          # (ترمینالِ دیگر) اجرای Web روی پورت 3000
```
- **کاربر:** http://localhost:3000 → ثبت‌نام → تورنومنت‌ها.
- **پنلِ مدیریت (اتاقِ کنترلِ عملیاتیِ FC26):** http://localhost:3000/admin → ورود با
  **`admin@example.com` / `admin12345`**. سپس `/admin/tournaments/t7/control-room`.
  اکانت‌های دمو در [SETUP.md](SETUP.md) فهرست شده‌اند.

> دیتابیس (`dev.db`) در گیت نیست؛ روی سیستمِ تازه حتماً `prisma:migrate` و سپس `seed` را اجرا کنید
> تا اکانتِ مدیر ساخته شود.

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
npm run test -w @tournament/core     # ۴۱ سناریوی دامنه
npm run test:e2e -w @tournament/api  # ۱۲ تست e2e
```

---

## ✅ پوشش یوزکیس‌ها (۳۱ یوزکیس)

تقریباً همه‌ی یوزکیس‌های سند طراحی پیاده و **زنده** تست شده‌اند:

| دسته | یوزکیس‌ها |
|------|-----------|
| هویت | UC01 ورود/ثبت‌نام · UC02 OAuth · UC03 احراز دومرحله‌ای (TOTP) |
| مدیریت | UC04 مدیریت کاربران · UC05 نقش‌ها · UC06 بازی‌ها · UC07 تنظیمات · UC31 داشبورد تحلیلی |
| تورنومنت | UC08 ساخت · UC09 ویرایش/کپی/لغو · UC10 ثبت نتایج · UC11/24 داوری · UC12 رده‌بندی · UC14 ماژول |
| مالی | UC13 جوایز · UC20 ثبت‌نام · UC21 هزینه‌ی ورودی+escrow · UC28 کیف پول · UC29 برداشت · UC30 KYC |
| تعامل | UC15 اعلان‌ها · UC16 استریم · UC17 چت · UC19 مشاهده · UC22 نتایج · UC25 امتیازدهی |
| ایمنی | UC18/27 تعدیل/گزارش · UC23 اعتراض · UC26 پشتیبانی |

موارد باقی‌مانده در حدِّ **صیقل UI**: UC08 به‌صورت فرمِ تک‌مرحله‌ای (نه wizard ۹‌گامی)، UC11 از مسیر بازبینیِ داور (نه گیتِ تأییدِ جداگانه)، UC14 با فرمت/راند (نه قالب‌های امتیازدهیِ سفارشی).

---

## 📌 وضعیت

- ✅ **موتور تورنومنت**: ۵ فرمت + شبیه‌ساز **۳۶/۳۶ پاس**
- ✅ **دامنه** (`@tournament/core`): تورنومنت، کیف‌پول+escrow، KYC/برداشت، تعدیل، پشتیبانی، امتیاز، اعلان، فصل، کامیونیتی، ladder، تنظیمات، پرداخت — **۴۱/۴۱ پاس**
- ✅ **API** (NestJS + Prisma): هویت(+2FA/OAuth)، تورنومنت(+چت/استریم/امتیاز)، کیف‌پول، KYC/برداشت، تعدیل/گزارش، پشتیبانی، اعلان، کنسول مدیریت، بازی‌ها، تنظیمات، پرداخت، فصل/کامیونیتی/ladder — **e2e ۱۲/۱۲**، روی SQLite **زنده end-to-end**
- ✅ **فرانت‌اند** (Next.js، RTL): همه‌ی بخش‌ها + کنسول مدیریت + کیف پول + امنیت(2FA) + پشتیبانی/گزارش + اعلان‌ها — **build سالم**
- ✅ **امنیت**: JWT + Argon2 + **RBAC** + **2FA TOTP**
- ✅ **پرداخت**: لایه‌ی انتزاعی + **زرین‌پالِ واقعی** (v4) با انتخابِ پویا از تنظیمات
- ⬜ نیازمندِ منابعِ دنیای واقعی: merchant واقعی + KYC، کلید واقعی پیامک/OAuth، دیپلوی Postgres + هاست (همه از تنظیمات قابلِ plug)
