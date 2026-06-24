# راه‌اندازی روی یک سیستمِ تازه — SETUP

راهنمای کاملِ اجرای پروژه (بک‌اند + فرانت‌اند + پنلِ مدیریتِ عملیاتیِ تورنومنت) روی هر ماشین.
دیتابیسِ پیش‌فرض **SQLite** است؛ به هیچ سرورِ دیتابیس یا Docker نیازی نیست.

---

## ۱) پیش‌نیازها

- **Node.js ≥ ۲۰** و **npm ≥ ۹** (`node -v`، `npm -v`).
- Git.
- (برای تستِ کلیکیِ Playwright، اختیاری) مرورگرِ **Microsoft Edge** یا Chrome — از کانالِ نصب‌شده استفاده می‌شود (دانلودِ مرورگر لازم نیست).

> ویندوز/مک/لینوکس هر سه پشتیبانی می‌شوند. دستورها با `npm` نوشته شده‌اند.

---

## ۲) دریافت و نصب

```bash
git clone <REPO_URL>
cd Tournament
npm install            # نصبِ همه‌ی workspaceها (apps/api, apps/web, packages/*)
```

---

## ۳) پیکربندیِ محیط (env)

```bash
cp apps/api/.env.example apps/api/.env        # محیطِ API
# (اختیاری، فقط اگر API روی میزبانِ دیگری است)
cp apps/web/.env.example apps/web/.env.local  # NEXT_PUBLIC_API_URL را تنظیم کنید
```

`apps/api/.env` (پیش‌فرضِ توسعه):

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `DATABASE_URL` | `file:./dev.db` | SQLite محلی. برای Postgres ببینید بخشِ «پروداکشن». |
| `PORT` | `4000` | پورتِ API |
| `CORS_ORIGIN` | `http://localhost:3000` | مبدأِ مجازِ فرانت |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `...change-me...` | **در پروداکشن حتماً عوض کنید** |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | `15m` / `7d` | عمرِ توکن |

فرانت (`apps/web`): تنها متغیر `NEXT_PUBLIC_API_URL` است (پیش‌فرض `http://localhost:4000/api`).

---

## ۴) دیتابیس: مهاجرت + Client + Seed

> `dev.db` در گیت نیست. روی سیستمِ تازه این سه گام **الزامی** است:

```bash
npm run prisma:migrate -w @tournament/api    # اعمالِ همه‌ی مهاجرت‌ها (ساختِ جدول‌ها)
npm run prisma:generate -w @tournament/api   # تولیدِ Prisma Client
npm run seed -w @tournament/api              # ⭐ اکانتِ مدیر + بازیکنانِ دمو + کاتالوگِ بازی
```

اگر `prisma:migrate` در دسترس نبود، معادلِ مستقیم:
```bash
cd apps/api && npx prisma migrate deploy && npx prisma generate && npm run seed && cd ../..
```

### اکانت‌های ساخته‌شده توسطِ seed
| نقش | ایمیل | پسورد |
|-----|-------|-------|
| **مدیر (ADMIN)** | `admin@example.com` | `admin12345` |
| برگزارکننده | `organizer@example.com` | `organizer12345` |
| داور | `referee@example.com` | `referee12345` |
| بازیکن ۱ | `player1@example.com` | `player12345` |
| بازیکن ۲ | `player2@example.com` | `player12345` |

> این پسوردها فقط برای توسعه‌اند؛ در پروداکشن seed را تغییر دهید یا اکانت‌ها را بازنشانی کنید.

---

## ۵) اجرا

دو ترمینال:

```bash
# ترمینال ۱ — API (پورت 4000)
npm run dev:api

# ترمینال ۲ — Web (پورت 3000)
npm run dev:web
```

یا حالتِ production:
```bash
npm run build                 # بیلدِ api + web
node apps/api/dist/main.js     # اجرای API
npm run start -w @tournament/web   # اجرای Web (next start)
```

سپس:
- **کاربر:** http://localhost:3000
- **پنلِ مدیریت:** http://localhost:3000/admin → ورود با `admin@example.com` / `admin12345`

---

## ۶) پنلِ مدیریتِ عملیاتیِ تورنومنت (FC26 — ۱۲۸ نفره)

پس از ورود به‌عنوانِ مدیر:

| مسیر | چه می‌بینید |
|------|-------------|
| `/admin` | داشبوردِ عملیاتی (KPI، صفِ اقدامات، سلامتِ سیستم) |
| `/admin/queue` | صفِ اقداماتِ تصمیم‌محور |
| `/admin/tournaments/t7` | نمای کلیِ عملیاتیِ FC26 |
| `/admin/tournaments/t7/control-room` | **اتاقِ کنترل** (اقدامات، براکت، شرکت‌کننده، چت، اختلاف، فعالیت، ممیزی) |
| `/admin/tournaments/t7/bracket` | درختِ ۷ دوره + Match Drawer + مودالِ تمام‌صفحه |
| `/admin/tournaments/t7/settings` | تنظیماتِ عملیاتی (no-show/result/dispute/progression/chat/stream/payout) |
| `/tournaments/t7/live` | صفحه‌ی پخشِ عمومیِ زنده |

> دادهٔ FC26 سمتِ کلاینت **mock + persisted** است: با اولین بازکردنِ اتاقِ کنترل ساخته و در DB
> (جدولِ `ControlBoard`) و localStorage ذخیره می‌شود؛ تغییرات بعد از refresh می‌مانند.
> برای **بازنشانیِ** نمونه، در اتاقِ کنترل دکمه‌ی «بازنشانی» را بزنید.

---

## ۷) تست‌ها

```bash
# واحد/دامنه/موتور
npm run sim  -w @tournament/engine     # ۳۶ سناریوی موتور
npm run test -w @tournament/core       # ۴۴ سناریوی دامنه
npm run test:e2e -w @tournament/api    # ۳۳ تستِ سرویس (Jest، fake-prisma)

# تستِ کلیکیِ واقعیِ پنلِ مدیریت (Playwright) — نیازمندِ بالا بودنِ api+web
cd apps/web && npx playwright test     # ۱۳ تستِ کلیکی (login واقعی، state، refresh)
```

> تستِ Playwright از کانالِ Edge استفاده می‌کند (دانلودِ مرورگر لازم نیست). web روی 3000 و
> api روی 4000 باید در حال اجرا باشند.

---

## ۸) ساختارِ مخزن

```
apps/api          — بک‌اند NestJS + Prisma (هویت، تورنومنت، control-board، ops، streaming، notifications، jobs)
apps/web          — فرانت‌اند Next.js (سایتِ عمومی + پنلِ مدیریتِ عملیاتی)
packages/engine   — موتورِ تورنومنت (همه‌ی فرمت‌ها) + شبیه‌ساز
packages/core     — دامنه (تورنومنت، کیف‌پول، فصل، کامیونیتی، ladder، تنظیمات، پرداخت)
docs/             — اسنادِ طراحی + گزارش‌های عملیات (پایین را ببینید)
```

اسنادِ کلیدیِ عملیات:
- [`docs/TOURNAMENT-OPERATIONS-REVIEW.md`](docs/TOURNAMENT-OPERATIONS-REVIEW.md) — کلِ مسیرِ اصلاحِ پنلِ عملیات + QAی کلیکی.
- [`docs/PRODUCTION-BACKEND-FOUNDATION.md`](docs/PRODUCTION-BACKEND-FOUNDATION.md) — لایه‌ی persist، jobs، notifications، streaming + قراردادِ API.
- [`docs/FC26-128-QA-Report.md`](docs/FC26-128-QA-Report.md) — سناریوی ۱۲۸ نفره.

---

## ۹) چه چیزی mock-functional است و چه چیزی به سرویسِ واقعی نیاز دارد

**کاملاً کار می‌کند (mock، persisted، refresh-safe):** پنلِ مدیریت، اتاقِ کنترل، state machineِ
براکت (propagation/BYE/auto-start)، اختلاف، چت، شرکت‌کننده‌ها، فعالیت/ممیزی، تنظیماتِ عملیاتی،
persistِ سمتِ سرور (`OpsState`/`ControlBoard`)، صفِ اعلانِ in-app، نشستِ استریمِ mock.

**نیازمندِ سرویسِ خارجی برای حالتِ کاملاً واقعی:**
- Postgres (به‌جای SQLite) برای مقیاس — `provider` در `schema.prisma` + `DATABASE_URL`.
- ارسالِ واقعیِ ایمیل/پیامک/Push (adapter آماده است).
- سرورِ استریمِ RTMP/HLS + CDN + VOD.
- صفِ کارِ پایدار (BullMQ/Redis) برای کرونِ مهلت/یادآوری در مقیاس.
- درگاهِ پرداختِ واقعی (زرین‌پال) — از `/settings` قابلِ فعال‌سازی.

---

## ۱۰) عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| `prisma generate` خطای EPERM/قفلِ DLL (ویندوز) | اول API را ببندید (پورت 4000)، سپس generate. |
| ورودِ مدیر کار نمی‌کند | `npm run seed -w @tournament/api` را اجرا کرده‌اید؟ پسورد را بررسی کنید. |
| فرانت به API وصل نمی‌شود | `NEXT_PUBLIC_API_URL` و `CORS_ORIGIN` را بررسی کنید؛ API روی 4000 بالا باشد. |
| پورت اشغال است | `PORT` (api) یا `-p` (web `next dev -p`) را تغییر دهید. |
| دیتابیس خراب/خالی | `dev.db` را پاک کنید، دوباره `prisma:migrate` + `seed`. |

---

## ۱۱) پروداکشن (خلاصه)

1. `provider = "postgresql"` در `apps/api/prisma/schema.prisma` و `DATABASE_URL` به Postgres.
2. `JWT_*` secretها را عوض کنید.
3. `npm run build` و اجرای `apps/api/dist/main.js` + `next start`.
4. `docker-compose.yml` برای Postgres + Redis آماده است.
5. سرویس‌های خارجی (بخشِ ۹) را وصل کنید.
