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
- Node.js ≥ ۲۰
- PostgreSQL (یا `docker compose up -d` برای راه‌اندازی Postgres + Redis)

### راه‌اندازی
```bash
# ۱. نصب وابستگی‌ها (npm workspaces)
npm install

# ۲. کپی فایل محیط
cp .env.example apps/api/.env

# ۳. ساخت Prisma client + اعمال migration روی دیتابیس
npm run prisma:generate
npm run prisma:migrate

# ۴. اجرای API (پورت 4000)
npm run dev:api

# ۵. در ترمینال دیگر، اجرای Web (پورت 3000)
npm run dev:web
```
سپس http://localhost:3000 را باز کنید: ثبت‌نام → داشبورد.

### ساختار مخزن
```
apps/api   — بک‌اند NestJS + Prisma (هویت، کیف پول)
apps/web   — فرانت‌اند Next.js (صفحه‌ی اصلی، ثبت‌نام، ورود، داشبورد)
docs/      — اسناد طراحی کامل
```

---

## 📌 وضعیت

- ✅ طراحی کامل سیستم (با ممیزی فنیِ خصمانه و رفع ۱۸ یافته)
- ✅ **اسکلت MVP**: monorepo + ماژول هویت (register/login، JWT، Argon2، کیف پول) + داشبورد — **build سالم**
- ⬜ ماژول‌های بعدی: ساخت تورنومنت (wizard)، موتور براکت، ثبت‌نام در مسابقه، پرداخت/escrow، …
