# Production Backend Foundation — SHELTER

تاریخ: ۲۴ ژوئن ۲۰۲۶. هدف: تبدیلِ عملیاتِ تورنومنت از localStorage/mock-functional به **backend-ready و production-safe**، بدونِ شکستنِ UI و بدونِ از دست رفتنِ سناریوی FC26.

اصلِ معماری: **هر چیزی پشتِ یک interface است.** فرانت همیشه با `OpsRepository`/هوک‌ها کار می‌کند؛ پیش‌فرض `localStorage` (mock-functional) و با یک env به backend سوییچ می‌شود — بدونِ تغییرِ صفحه‌ها.

---

## ۱. چه چیزی در این فاز ساخته شد (implemented + tested)

### Backend (NestJS + Prisma)
- **`tournament-ops`**: persistِ سمتِ سرورِ همه‌ی sliceهای عملیات + activity + endpointهای معنایی.
- **`streaming`**: نشستِ استریم با adapter (mock/RTMP/HLS-ready)، start/stop، سلامت، صفحه‌ی پخشِ عمومی.
- **`notifications-delivery`**: تحویلِ اعلان با adapter (in-app واقعی؛ email/sms/push/chat آماده)، لاگِ تحویل، read/unread، failed/retry.
- **`ops-jobs`**: زمان‌بندِ پس‌زمینه (`@nestjs/schedule`) — چرخه‌ی تحویلِ اعلان + قلّابِ مهلت/no-show.

### Frontend (swap layer)
- **`lib/admin/opsRepository.ts`**: `OpsRepository` + `localOpsRepository` (پیش‌فرض) + `apiOpsRepository` (REST). انتخاب با `NEXT_PUBLIC_OPS_BACKEND=api`.
- **`lib/admin/opsStore.ts`**: `useOpsSlice` بازنویسی شد تا از repositoryِ فعال بخواند/بنویسد — رفتارِ پیش‌فرض دقیقاً مثلِ قبل (UI/QA دست‌نخورده).

**تست:** ۹ تستِ جدید (ops persist، dispute compose، delivery sent/failed/retry/read/processDue، stream start/stop/public) → کلِ سوییت **۳۳/۳۳ سبز**. API build + web build + tsc همه سبز.

---

## ۲. API Contract

> همه با prefixِ `/api`. مسیرهای ادمین پشتِ `JwtAuthGuard + RolesGuard` (`ADMIN|MAIN_ADMIN|GAME_ADMIN|REFEREE`). مسیرِ public بدونِ auth.

### Tournament Ops
| متد | مسیر | کار |
|-----|------|-----|
| GET | `/tournaments/:id/ops` | وضعیتِ کاملِ عملیات (همه‌ی slice + activity + audit) |
| GET | `/tournaments/:id/ops/slice/:slice` | خواندنِ یک slice |
| PUT | `/tournaments/:id/ops/slice/:slice` | نوشتنِ یک slice — **swap target فرانت** (body: `{ data }`) |
| GET | `/tournaments/:id/ops/activity` | فیدِ فعالیت |
| POST | `/tournaments/:id/ops/activity` | افزودنِ رویدادِ فعالیت |
| PATCH | `/tournaments/:id/ops/participants/:pid` | به‌روزرسانیِ شرکت‌کننده (slice + activity + audit) |
| POST | `/tournaments/:id/ops/disputes/:did/decision` | تصمیمِ اختلاف (slice + activity + audit) |
| POST | `/tournaments/:id/ops/chat/messages` | افزودنِ پیامِ چت (slice + activity) |
| POST | `/tournaments/:id/ops/schedule/:round` | تغییرِ برنامه‌ی دور (slice + activity + audit) |

`slice` ∈ `chat-messages | chat-policy | chat-flags | announcements | schedule-patches | schedule-published | dispute-status | participant-patches | stream-config | stream-sessions`.

### Streaming
| متد | مسیر | کار |
|-----|------|-----|
| GET | `/tournaments/:id/stream` | وضعیت + نشست‌ها + شمارِ زنده/بیننده |
| POST | `/tournaments/:id/stream/:matchId/start` | شروعِ پخش (persist + audit + activity) — body `{ caster?, visibility? }` |
| POST | `/tournaments/:id/stream/:matchId/stop` | توقفِ پخش |
| GET | `/public/tournaments/:id/live` | **عمومی، بدونِ auth** — نشست‌های زنده‌ی public برای صفحه‌ی تماشا |

### Notifications delivery
| متد | مسیر | کار |
|-----|------|-----|
| POST | `/notifications-delivery` | ساخت + تلاشِ تحویل (in-app فوری) |
| GET | `/notifications-delivery?tournamentId=&userId=` | فهرستِ تحویل با وضعیت |
| PATCH | `/notifications-delivery/:id/read` | علامتِ خوانده‌شده |
| POST | `/notifications-delivery/:id/retry` | تلاشِ مجدد (سقفِ ۳) |

---

## ۳. Data Model / Schema

مدل‌های جدید (مهاجرت: `20260624000701_ops_foundation`):

| مدل | کلید | کاربرد |
|-----|------|--------|
| `OpsState` | `@@unique([tournamentId, slice])` | persistِ خامِ هر slice (پشتِ OpsRepository) |
| `ActivityEvent` | index `tournamentId` | فیدِ فعالیتِ عملیاتی (جدا از audit) |
| `StreamSessionRow` | `@@unique([tournamentId, matchId])` | وضعیت/سلامتِ نشستِ استریم |
| `NotificationDelivery` | index `tournamentId/userId/status` | لاگِ تحویل + retry + read |

مدل‌های موجودِ دست‌نخورده: `AuditLog` (بازاستفاده)، `Notification` (ساده)، `ChatMessage`، `ControlBoard`.

> پروداکشن: provider را در `schema.prisma` از `sqlite` به `postgresql` و `DATABASE_URL` را تغییر دهید؛ مدل‌ها سازگارند.

---

## ۴. Repository / Service Interfaces

```ts
// backend — قراردادِ persist (src/tournament-ops/ops.repository.ts)
interface OpsRepository {
  getSlice(tournamentId, slice): Promise<OpsSliceRecord | null>;
  putSlice(tournamentId, slice, data): Promise<OpsSliceRecord>;
  getAll(tournamentId): Promise<OpsSliceRecord[]>;
}
// پیاده‌سازی: PrismaOpsRepository

// streaming — قراردادِ provider (src/streaming/stream.adapter.ts)
interface StreamAdapter { provision; start; stop; health }  // MockStreamAdapter | (RTMP/HLS later)

// notifications — قراردادِ کانال (src/notifications-delivery/delivery.adapter.ts)
interface DeliveryAdapter { channel; send(payload): Promise<DeliveryResult> }
// InAppAdapter (real) | EmailAdapter/SmsAdapter/PushAdapter/ChatAdapter (mock) | DeliveryDispatcher

// frontend — همان قرارداد، روی هر دو backend (lib/admin/opsRepository.ts)
interface OpsRepository { loadSlice; saveSlice }  // localOpsRepository | apiOpsRepository
```

**نحوه‌ی swap:** `NEXT_PUBLIC_OPS_BACKEND=api` در فرانت → همه‌ی تب‌ها از همان لحظه روی DB persist می‌کنند. هیچ صفحه‌ای تغییر نمی‌کند.

---

## ۵. Background Dependency Map

| قابلیت | پیاده‌سازیِ فعلی | برای پروداکشن نیاز |
|--------|------------------|---------------------|
| persistِ عملیات | ✅ `OpsState` (DB) + localStorage adapter | فقط سوییچِ env |
| activity/audit | ✅ DB (`ActivityEvent`/`AuditLog`) | — |
| اعلانِ in-app | ✅ DB + delivery log | — |
| email/sms/push | 🟡 adapter mock (وضعیتِ تحویل واقعی) | سرویسِ SMTP/SMS/FCM پشتِ همان `DeliveryAdapter` |
| زمان‌بندیِ یادآوری/no-show | 🟡 `ops-jobs` (چرخه‌ی اعلان واقعی؛ قلّابِ مهلت روی slice) | persistِ کاملِ matchها در DB + کرونِ پایدار (در حالِ حاضر in-process `@nestjs/schedule`) |
| واجد شرایط بودنِ پرداخت | 🟡 قلّاب آماده | اتصال به escrow/ledger واقعی |
| استریم | 🟡 `MockStreamAdapter` + persistِ نشست | سرورِ RTMP/HLS، ضبط/VOD، CDN |
| پخشِ عمومی | ✅ route + قراردادِ playback | playerِ HLS واقعی |

✅ implemented · 🟡 adapter-ready (mock، آماده‌ی جایگزینی) · 🔴 نیازمندِ سرویسِ خارجی.

### نیازمندِ سرویسِ خارجی (🔴)
- SMTP/Email provider، SMS gateway، Push (FCM/APNs).
- سرورِ استریم (RTMP ingest + HLS packaging + CDN + recording/VOD).
- صفِ کارِ پایدار (BullMQ/Redis) برای جایگزینیِ زمان‌بندِ in-process در مقیاس.
- Postgres برای پروداکشن (به‌جای SQLite).

---

## ۶. QA Checklist — Backend Foundation

- [x] مدل‌ها مهاجرت شدند (`ops_foundation`) و client تولید شد
- [x] `OpsState` persist/read تست شد (unit)
- [x] تصمیمِ اختلاف به‌صورتِ اتمیک slice+activity+audit می‌نویسد (unit + smoke)
- [x] `getState` همه‌ی slice + activity را سرهم می‌کند
- [x] اعلانِ in-app فوری sent می‌شود؛ email بدونِ گیرنده failed + retry تا سقف
- [x] `processDue` اعلان‌های زمان‌رسیده را تحویل می‌دهد
- [x] استریم start نشستِ live + audit/activity می‌سازد؛ stop پایان می‌دهد
- [x] پخشِ عمومی فقط نشست‌های public live را برمی‌گرداند (بدونِ auth)
- [x] کلِ سوییتِ تست ۳۳/۳۳ سبز
- [x] API build + web build + web tsc سبز
- [x] **UI نشکست**: با adapterِ local (پیش‌فرض)، چت/اسکجول/اختلاف همچنان persist می‌شوند (re-probe تأیید کرد)
- [x] smoke واقعی: PUT/GET slice، dispute decision، stream start، public live، notification — همه پاسخ‌ِ درست

---

## ۷. جمع‌بندیِ صادقانه

- **implemented (واقعی، tested):** persistِ سرورِ همه‌ی sliceها، activity/audit، اعلانِ in-app با لاگِ تحویل/read/retry، استریمِ نشست‌محور با adapter، پخشِ عمومی، زمان‌بندِ تحویلِ اعلان، و **لایه‌ی swapِ فرانت** که UI را دست‌نخورده نگه می‌دارد.
- **adapter-ready (mock، آماده‌ی جایگزینی بدونِ تغییرِ مصرف‌کننده):** email/sms/push، استریمِ RTMP/HLS، قلّاب‌های مهلت/no-show/payout.
- **نیازمندِ سرویسِ خارجی:** SMTP/SMS/Push، سرورِ استریم+CDN، صفِ پایدار، Postgres.
- **پیش‌فرض هنوز localStorage است** تا سناریوی FC26 و تجربه‌ی فعلی دست‌نخورده بماند؛ سوییچ به backend فقط یک env (`NEXT_PUBLIC_OPS_BACKEND=api`) فاصله دارد.
