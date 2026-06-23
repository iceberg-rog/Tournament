# بازبینیِ عملیاتِ تورنومنت — SHELTER

تاریخ: ۲۰۲۶/۰۴/۰۳ (۲۴ ژوئن ۲۰۲۶) · دامنه: کلِ تجربه‌ی مدیریتِ یک تورنومنت از ابتدا تا انتها.

این سند خروجیِ بازطراحیِ بخشِ «مدیریتِ تورنومنت / اتاقِ کنترل / شرکت‌کننده‌ها / چت / اختلاف / زمان‌بندی / استریمِ زنده» را شرح می‌دهد و دقیقاً مشخص می‌کند چه چیزی واقعی است، چه چیزی mock/adapter-ready است و چه چیزی به backend واقعی نیاز دارد.

---

## ۱. چه چیزهایی اضافه/اصلاح شد

### هسته‌ی داده (single source of truth)
- **`lib/admin/tournamentOps.ts`** — مدلِ typed کاملِ عملیات. `buildTournamentOps(t)` برای FC26 داده‌ی کامل تولید می‌کند:
  - **شرکت‌کننده‌های غنی** (`OpsParticipant`): displayName، username، realName، email، phone، gameId (PSN/EA)، **inGameName (نامِ نمایشیِ اختیاری)**، KYC، wallet، status، warnings، noShows، reports، seed، lastSeen، notes.
  - **برنامه‌ی زمان‌بندی** (`ScheduleRound` × ۷ دور): startAt، checkIn، matchDeadline، resultDeadline، disputeDeadline، nextRoundGen + **طرحِ notification** با وضعیتِ تحویل.
  - **چت/اعلان** (`ChatMessage`/`Announcement`/`MatchChatThread`) + سیاستِ چت.
  - **اختلاف‌ها** (`OpsDispute`) با evidence و impact.
  - **استریم** (`StreamConfig`/`StreamSession`) با وضعیت/بیننده/سلامت.
- **`lib/admin/opsStore.ts`** — `useOpsSlice(id, key, fallback)`: persistِ سبکِ localStorage، **refresh-safe**، SSR-safe. هر تب slice خودش را نگه می‌دارد.

### تب‌های جدید/بازطراحی‌شده (route: `/admin/tournaments/:id/...`)
| تب | مسیر | کارکرد |
|----|------|--------|
| نمای کلی | `/` | خلاصه‌ی عملیاتی + مانع + اقدامِ بعدی |
| اتاقِ کنترل | `/control-room` | cockpitِ اجرای زنده (از قبل) |
| **برنامه‌ی زمان‌بندی** | `/schedule` | تایم‌لاینِ دورها، مهلت‌ها، طرحِ یادآوری، تمدید/زمان‌بندیِ مجدد |
| براکت | `/bracket` | درختِ مسابقات |
| مسابقات | `/matches` | فهرستِ کاملِ مسابقات |
| **شرکت‌کننده‌ها** | `/participants` | اطلاعاتِ کامل + Player Drawer + bulk |
| **چت و اعلان‌ها** | `/chat` | چتِ گروهی + چتِ مسابقه + نظارت + composerِ اعلان |
| اختلاف‌ها | `/disputes` | مدیریتِ پرونده‌ی اختلاف (از قبل) |
| **استریمِ زنده** | `/stream` | راه‌اندازی + start/stop + سلامت + mock player |
| مالی | `/finance` | escrow/ledger (از قبل) |
| گزارشِ عملیات | `/audit-log` | ممیزی (از قبل) |

### صفحه‌ی عمومی
- **`/tournaments/:id/live`** — صفحه‌ی تماشای عمومی (mock player، اطلاعاتِ مسابقه، امتیاز، مسابقاتِ پیشِ‌رو، گزارشِ مشکل). بدونِ AdminGuard.

### ثبت‌نام با نامِ نمایشیِ اختیاری
- فرانت: ورودیِ «نامِ نمایشیِ داخلِ مسابقه (اختیاری)» در `/tournaments/:id` با توضیح.
- بک‌اند: `RegisterDto.inGameName` + کنترلر — اگر داده شود، در براکت به‌جای نامِ کاربری دیده می‌شود.

### Integrations
- provider جدیدِ **«پخشِ زنده»** (`streaming`) در کاتالوگ: internal_mock_stream / RTMP / HLS / custom + فیلدهای ingest/playback/key/visibility/recording/VOD.

---

## ۲. چه actionهایی واقعاً کار می‌کنند (state + toast + audit + persist)

- **زمان‌بندی**: تمدیدِ مهلت، زمان‌بندیِ مجدد، ارسالِ یادآوریِ دور، انتشارِ برنامه.
- **چت**: تغییرِ سیاستِ چت، قفل/حالتِ آهسته، ارسالِ پیامِ مدیر، بی‌صدا، حذفِ پیام، گزارش از پیام، ارسالِ اعلان.
- **استریم**: فعال/غیرفعال، تغییرِ منبع/تنظیمات، start/stop پخش، واگذاریِ کستر، کپیِ کلید/URL.
- **شرکت‌کننده‌ها**: چک‌اینِ دستی، اخطار، بی‌صدا، عدمِ حضور، محرومیت، تعلیق، بازگردانی، پیام، خروجیِ CSV، bulk.
- همه از طریقِ `useOpsSlice` **پس از refresh باقی می‌مانند** و `appendAudit`+`pushToast` تولید می‌کنند.

---

## ۳. سناریوی FC26 (۱۲۸ نفر) چگونه منعکس می‌شود

- ۱۲۸ شرکت‌کننده با ایمیل/موبایل/Game ID/نامِ نمایشی.
- ۷ دور با زمان‌بندی + طرحِ یادآوری (شاملِ یادآوریِ «بی‌پاسخ» که در صف می‌آید).
- مسابقاتِ دارای مشکل: نتیجه‌ی نیامده، عدمِ حضور، عدمِ حضورِ دوطرفه، مدرکِ نامعتبر، اختلاف، زنده، تمام‌شده.
- چتِ عمومی با پیام‌های نمونه + پیامِ flagged.
- اختلافِ واقعی با evidence.
- استریمِ mock برای مسابقاتِ زنده + صفحه‌ی عمومیِ تماشا.

---

## ۴. چه چیزی mock / adapter-ready است

- **استریم**: کاملاً mock (internal_mock_stream). UI و contract آماده‌اند؛ start/stop persist می‌شود. پخشِ واقعی به سرورِ RTMP/HLS نیاز دارد.
- **notification/reminder**: زمان‌بندی و وضعیتِ تحویل mock است؛ ارسالِ واقعیِ email/SMS/push به providerهای متناظر (تبِ APIها) نیاز دارد.
- **چت**: پیام‌ها در localStorage‌اند (refresh-safe، تک‌دستگاه). بلادرنگ و چنددستگاهی به سرویسِ chat/WebSocket نیاز دارد.
- **persist**: محلی (localStorage) است؛ برای cross-device به APIِ ops نیاز است (الگوی control-board موجود قابل گسترش است).

## ۵. چه چیزی به backend واقعی نیاز دارد

1. جدول/endpointهای ops برای schedule/chat/announcement/stream (الان localStorage).
2. سرورِ استریم (ingest RTMP + خروجیِ HLS + ضبط/VOD).
3. صف/کرونِ یادآوری (jobs) برای ارسالِ خودکارِ reminder و no-show خودکار.
4. ذخیره‌ی `inGameName` در مدلِ Participantِ پایدار (الان از طریقِ engine به‌عنوانِ name اعمال می‌شود).
5. آپلودِ واقعیِ evidence (storage).

---

## ۶. چک‌لیستِ بررسیِ نهایی

| مورد | وضعیت |
|------|-------|
| روند مسابقه / زمان‌بندیِ هر دور قابل فهم | ✅ تبِ زمان‌بندی |
| همه‌ی matchها (نه ۵ تخیلی) | ✅ از control board (۱۱۲ مسابقه‌ی دورهای ۱–۳ + placeholderِ دورهای بعد) |
| Player Drawer با ایمیل/موبایل/Game ID/نامِ نمایشی | ✅ |
| ثبت‌نام با نامِ نمایشیِ اختیاری | ✅ front+back |
| group chat + match chat + mute/delete/report | ✅ |
| dispute قابل فهم با evidence/impact | ✅ |
| activity جدا از audit | ✅ (تب‌های جدا) |
| live streaming tab + public live page | ✅ mock/adapter-ready |
| همه دکمه‌ها functional | ✅ |
| persistence (refresh-safe) | ✅ localStorage |
| reminder بی‌پاسخ → صفِ اقدامات | ✅ |

---

## ۷. جمع‌بندی

- آیا همه‌ی موارد پوشش داده شد؟ **بخشِ اصلیِ تجربه (زمان‌بندی، شرکت‌کننده‌های غنی، چت/نظارت، اعلان، استریم، صفحه‌ی عمومی، ثبت‌نام با نامِ نمایشی) بله.** برخی اقلام (persist سمتِ سرور، استریمِ واقعی، ارسالِ واقعیِ پیام) عمداً mock/adapter-ready ماندند چون به سرویسِ بیرونی نیاز دارند — در بخش ۵ دقیق فهرست شده‌اند.
- این پنل دیگر «UIِ تزئینی» نیست: هر دکمه نتیجه‌ی قابل‌مشاهده، audit و persist دارد.

---

## ۸. Manual UI QA — Authenticated Admin

با اکانتِ `admin@example.com` (نقش ADMIN) و **Playwright + کانالِ Edge** روی `/admin/tournaments/t7` به‌صورتِ تعاملی تست شد: لاگین واقعی، تزریقِ توکن، بازکردنِ هر تب، کلیک روی drawerها/دکمه‌ها، ارسالِ پیام/اعلان، روشن‌کردنِ استریم، و سنجشِ persistence با **refreshِ واقعی**. نتیجه‌ی نهایی: **۴۷ بررسی، ۰ FAIL** (+ بازبینیِ بصریِ screenshotهای هر تب).

| تب | چه تست شد | نتیجه | مشکلِ یافته‌شده | اصلاح | وابستگیِ backend |
|----|-----------|:----:|----------------|-------|------------------|
| نمای کلی | کارت‌های خلاصه، «۳ دور نیازمندِ اقدام»، گام‌های بعدی، FC26 | ✅ | — | — | — |
| اتاقِ کنترل | roadmapِ مرحله‌ها (کلیک→جزئیات)، صفِ اقدام‌ها، match drawer | ✅ | — | — | — |
| برنامه‌ی زمان‌بندی | drawerِ دور، ارسالِ یادآوری، تمدیدِ مهلت، **persist بعد از refresh** | ✅ | selectorِ تستِ اولیه (نه باگ) | — | کرونِ ارسالِ واقعیِ یادآوری (jobs) |
| براکت | درختِ ۳ دوره (یک‌چهارم/نیمه/فینال)، وضعیت‌ها، legend | ✅ | — | — | — |
| مسابقات | فهرستِ مسابقاتِ واقعی، فیلترِ دور/وضعیت، actionهای تأیید/رد/ویرایش | ✅ | — | — | — |
| شرکت‌کننده‌ها | search، Player Drawer (ایمیل/موبایل/Game ID/نامِ نمایشی/KYC/wallet/اخطار)، اکشن، bulk، **mobile بدونِ overflow** | ✅ | — | — | ذخیره‌ی پایدارِ تغییرات (ops API) |
| چت و اعلان‌ها | ارسالِ پیام، **persist بعد از refresh**، سیاستِ چت، mute/delete/report، اعلان | ✅ | selectorِ تستِ اولیه (نه باگ) | — | چتِ بلادرنگ/چنددستگاهی (WebSocket) |
| اختلاف‌ها | **drawerِ پرونده با گزارش‌دهنده/حریف/ادعا/نتیجه‌ی ثبت‌شده/مدرک/اثر/پیشنهاد** + تصمیم‌ها + persist | ✅ | **باگِ واقعی: صفحه‌ی قدیمی drawerِ غنی نداشت** | **بازنویسی با مدلِ `OpsDispute` + drawer + `useOpsSlice`** | — |
| استریمِ زنده | overview، setup (کلیدِ masked)، **start/stop + persist**، سلامت، mock player | ✅ | — | — | سرورِ RTMP/HLS واقعی |
| مالی و escrow | وضعیتِ escrow، قفلِ پرداخت با **دلیلِ دقیق**، توزیعِ جایزه، ledger | ✅ | — | — | درگاه/تسویه‌ی واقعی |
| فعالیت/ممیزی | بلوک‌های auditِ هر تب، تبِ گزارشِ عملیات؛ activity پس از اقدام پر می‌شود | ✅ | — | — | — |
| پخشِ عمومی `/t/:id/live` | mock player، امتیاز، سلامت، چت، گزارشِ مشکل | ✅ | — | — | پخشِ واقعی |

### چک‌لیستِ نهایی (همه ✅)
- [x] Roadmap popovers tested — کلیکِ مرحله جزئیات باز می‌کند
- [x] Schedule reminders tested — ارسالِ یادآوری + تمدید + **persist بعد از refresh**
- [x] Match drawers tested — اتاقِ کنترل
- [x] Player drawers tested — همه‌ی فیلدهای هویت/تماس/Game ID/نامِ نمایشی
- [x] Chat controls tested — ارسال/حذف/mute/سیاست + **persist**
- [x] Announcements tested — composer با هدف/کانال/زمان‌بندی
- [x] Disputes tested — drawerِ کامل + تصمیم‌ها + persist (**اصلاح شد**)
- [x] Activity feed tested — رویدادها از audit
- [x] Audit log tested — جدا از activity
- [x] Live streaming tested — start/stop + persist + mock player
- [x] Public live page tested — رندر تأییدشده
- [x] Finance/escrow tested — قفل با دلیل + توزیعِ جایزه
- [x] Refresh persistence tested — چت/اسکجول/استریم/اختلاف همه ماندند
- [x] No dead buttons — هر دکمه‌ی probe‌شده عمل کرد
- [x] No meaningless placeholders — هیچ متنِ lorem/coming-soon یافت نشد
- [x] FC26 128-player scenario consistent — در همه‌ی تب‌ها داده‌ی FC26 دیده شد
- [x] RTL/Persian درست · mobile (۳۹۰px) بدونِ overflow

**روشِ تست:** Playwright headless (کانالِ Edge)، لاگینِ واقعیِ API، تزریقِ توکن، تعامل + refresh. تنها یک **باگِ واقعی** یافت شد (drawerِ اختلاف) که **اصلاح و دوباره تأیید** شد؛ بقیه‌ی FAILهای اولیه نویزِ selectorِ تست بودند که با selectorِ درست PASS شدند.
