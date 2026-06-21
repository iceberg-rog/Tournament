# 🏆 Tournament — پلتفرم برگزاری مسابقات آنلاین

پلتفرم جامع و **config-driven** برای برگزاری مسابقات آنلاین بازی‌های ویدیویی روی **همه‌ی پلتفرم‌ها و کنسول‌ها** (PC، PS5/PS4، Xbox Series/One، Switch، موبایل) — با تمرکز بر **بازار ایران** (پرداخت ریالی، فارسی/RTL، کامیونیتی محلی).

> این مخزن فعلاً شامل **اسناد طراحی کامل** سیستم است. فاز بعدی: پیاده‌سازی MVP.

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
apps/api          — بک‌اند NestJS + Prisma (هویت، کیف پول، API تورنومنت)
apps/web          — فرانت‌اند Next.js (صفحه‌ی اصلی، ثبت‌نام، ورود، داشبورد)
packages/engine   — موتور تورنومنت (همه‌ی فرمت‌ها) + شبیه‌ساز
packages/core     — دامنه‌ی تورنومنت (سرویس + مخزن، مدل replay)
docs/             — اسناد طراحی کامل
```

### endpointهای API تورنومنت
```
POST /api/tournaments                          ساخت (محافظت‌شده)
GET  /api/tournaments                           لیست
GET  /api/tournaments/:id                       جزئیات
POST /api/tournaments/:id/register              ثبت‌نام (محافظت‌شده)
POST /api/tournaments/:id/start                 شروع (محافظت‌شده)
GET  /api/tournaments/:id/ready                 مسابقات آماده
POST /api/tournaments/:id/matches/:mid/report   گزارش نتیجه (محافظت‌شده)
GET  /api/tournaments/:id/standings             رده‌بندی
```

### اجرای شبیه‌ساز موتور
```bash
npm run sim -w @tournament/engine   # ۳۶ سناریو، همه‌ی فرمت‌ها/بازی‌ها/کاربران
```

---

## 📌 وضعیت

- ✅ طراحی کامل سیستم (با ممیزی فنیِ خصمانه و رفع ۱۸ یافته)
- ✅ **اسکلت MVP**: monorepo + ماژول هویت (register/login، JWT، Argon2، کیف پول) + داشبورد — **build سالم**
- ✅ **موتور تورنومنت**: ۵ فرمت (single/double elim، round-robin، Swiss، FFA/Battle Royale) + شبیه‌ساز **۳۶/۳۶ پاس**
- ✅ **دامنه‌ی تورنومنت** (`@tournament/core`): چرخه‌ی کامل ساخت→ثبت‌نام→شروع→گزارش→رده‌بندی — تست **۲۳/۲۳ پاس**
- ✅ **API تورنومنت** (NestJS + Prisma): endpointها وصل و کامپایل‌شده (تستِ زنده نیازمند PostgreSQL)
- ⬜ ماژول‌های بعدی: wizard ساخت، پرداخت/escrow، کامیونیتی، صفحات عمومی، …
