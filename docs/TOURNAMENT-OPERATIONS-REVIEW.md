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
