# راه‌اندازیِ پروداکشنِ اتصال‌ها و APIها (SHELTER)

این سند مرجعِ عملیاتیِ صفحهٔ «System Integrations / API Settings» است. هدف: بردنِ پلتفرم از حالتِ آزمایشی (mock) به پروداکشنِ واقعی، با چک‌لیستِ سرویس‌به‌سرویس، متغیرهای محیطی، قراردادِ adapterها و قوانینِ سلامت.

> همهٔ مدل‌ها و قوانین از `apps/web/lib/integrations/{types,catalog,health}.ts` استخراج شده‌اند. کد و interfaceها انگلیسی نگه داشته شده‌اند.

---

## مرور (Overview)

- پلتفرم ۱۲ سرویسِ یکپارچه دارد (`INTEGRATIONS`). هر سرویس یک `provider` انتخابی، حالتِ `mockMode`، فیلدهای تنظیمات/سکرت و فهرستِ `requiredEnvs` دارد.
- وضعیتِ هر سرویس با `computeStatus(inst)` محاسبه می‌شود: `connected` / `mock` / `missing_config` / `error` / `disabled` (نمایش با `STATUS_FA` و `STATUS_TONE`).
- سلامتِ کلیِ محیط با `featureWarnings(state)` و خلاصه با `summarize(state)` تولید می‌شود.
- محیط‌ها: `development` / `staging` / `production` (`ENV_FA`). در پروداکشن نباید سرویسِ حیاتی در حالتِ `mock` بماند.

ترتیبِ کلیِ مهاجرت به پروداکشن:

۱. برای هر سرویس یک provider واقعی انتخاب کن. ۲. متغیرهای محیطیِ لازم را ست کن. ۳. `mockMode` را خاموش کن. ۴. «تستِ اتصال» را بزن تا `lastTest.status === 'success'` شود. ۵. feature flagِ مربوطه را روشن کن. ۶. هشدارهای health را صفر کن.

---

## سرویس‌های لازم (Required services)

دوازده سرویس از `INTEGRATIONS` به‌همراه providerهای ممکن (providerِ mock با نشانهٔ ★):

| # | شناسه (`id`) | عنوان | providerها | providerِ آزمایشی |
|---|---|---|---|---|
| ۱ | `notification` | اعلان‌ها | `internal_mock`, `custom_api`, `firebase`, `one_signal`, `pusher_beams` | `internal_mock` ★ |
| ۲ | `email` | ایمیل | `internal_mock`, `smtp`, `resend`, `sendgrid`, `mailgun`, `ses` | `internal_mock` ★ |
| ۳ | `sms` | پیامک / OTP | `internal_mock`, `kavenegar`, `ghasedak`, `twilio`, `custom` | `internal_mock` ★ |
| ۴ | `chat` | چتِ بلادرنگ | `internal_mock`, `websocket_server`, `supabase_realtime`, `pusher`, `socket_io`, `custom` | `internal_mock` ★ |
| ۵ | `storage` | آپلودِ مدارک / فضای ذخیره | `local_mock`, `s3`, `cloudflare_r2`, `supabase_storage`, `firebase_storage`, `custom_upload_api` | `local_mock` ★ |
| ۶ | `payment` | درگاهِ پرداخت | `mock_gateway`, `zarinpal`, `idpay`, `payping`, `stripe`, `custom` | `mock_gateway` ★ |
| ۷ | `wallet` | کیفِ پول / Escrow / دفترِ کل | `mock_persistent`, `database`, `external_wallet_api` | `mock_persistent` ★ |
| ۸ | `kyc` | احرازِ هویت (KYC) | `internal_manual_review`, `mock_kyc`, `custom_kyc_api`, `sumsub`, `stripe_identity` | `mock_kyc` ★ |
| ۹ | `jobs` | کارهای پس‌زمینه / زمان‌بند | `internal_mock`, `cron`, `bullmq`, `inngest`, `temporal`, `supabase_cron` | `internal_mock` ★ |
| ۱۰ | `webhooks` | Webhookها | `internal`, `custom` | `internal` ★ |
| ۱۱ | `moderation` | نظارت / ضدِتقلب | `internal_rules`, `custom_api`, `perspective_api`, `mod_ai` | `internal_rules` ★ |
| ۱۲ | `analytics` | تحلیل / مانیتورینگ | `internal_logs`, `sentry`, `posthog`, `google_analytics`, `datadog` | `internal_logs` ★ |

> نکته: `wallet` و `moderation` فیلدِ `requiredEnvs` ندارند و عمدتاً درون‌برنامه‌ای پیکربندی می‌شوند؛ بقیه به env نیاز دارند.

---

## متغیرهای محیطی (Environment variables)

جدول از `ENV_VARS`. ستونِ «الزامی در پروداکشن» از `requiredInProduction`. سکرت‌ها با 🔒.

| متغیر | الزامی در پروداکشن | سرویسِ مرتبط (`type`) | نمونه | توضیح |
|---|---|---|---|---|
| `NOTIFICATION_PROVIDER` | بله | `notification` | `one_signal` | ارائه‌دهنده‌ی اعلان |
| `NOTIFICATION_API_KEY` 🔒 | بله | `notification` | `os_live_xxx` | کلیدِ سرویسِ اعلان |
| `EMAIL_PROVIDER` | بله | `email` | `resend` | ارائه‌دهنده‌ی ایمیل |
| `EMAIL_FROM` | بله | `email` | `no-reply@shelter.gg` | ایمیلِ فرستنده |
| `SMTP_HOST` | خیر | `email` | `smtp.resend.com` | هاستِ SMTP |
| `SMTP_PORT` | خیر | `email` | `587` | پورتِ SMTP |
| `SMTP_USER` | خیر | `email` | `apikey` | کاربرِ SMTP |
| `SMTP_PASSWORD` 🔒 | خیر | `email` | `••••` | رمزِ SMTP |
| `SMS_PROVIDER` | خیر | `sms` | `kavenegar` | ارائه‌دهنده‌ی پیامک |
| `SMS_API_KEY` 🔒 | خیر | `sms` | `kv_xxx` | کلیدِ پیامک |
| `CHAT_PROVIDER` | خیر | `chat` | `pusher` | ارائه‌دهنده‌ی چت |
| `CHAT_WS_URL` | خیر | `chat` | `wss://chat.shelter.gg` | آدرسِ WebSocket |
| `STORAGE_PROVIDER` | بله | `storage` | `cloudflare_r2` | ارائه‌دهنده‌ی ذخیره |
| `STORAGE_BUCKET` | بله | `storage` | `shelter-prod` | نامِ Bucket |
| `STORAGE_ACCESS_KEY` 🔒 | بله | `storage` | `AKIA...` | Access Key |
| `STORAGE_SECRET_KEY` 🔒 | بله | `storage` | `••••` | Secret Key |
| `PAYMENT_PROVIDER` | بله | `payment` | `zarinpal` | درگاهِ پرداخت |
| `PAYMENT_MERCHANT_ID` | بله | `payment` | `xxxxxxxx-xxxx` | شناسه‌ی پذیرنده |
| `PAYMENT_API_KEY` 🔒 | بله | `payment` | `••••` | کلیدِ درگاه |
| `PAYMENT_CALLBACK_URL` | بله | `payment` | `https://shelter.gg/pay/callback` | آدرسِ بازگشت |
| `KYC_PROVIDER` | خیر | `kyc` | `sumsub` | ارائه‌دهنده‌ی KYC |
| `KYC_API_KEY` 🔒 | خیر | `kyc` | `••••` | کلیدِ KYC |
| `JOB_PROVIDER` | بله | `jobs` | `bullmq` | زمان‌بندِ کارها |
| `JOB_SECRET` 🔒 | بله | `jobs` | `••••` | کلیدِ کارها |
| `WEBHOOK_SIGNING_SECRET` 🔒 | بله | `webhooks` | `whsec_xxx` | کلیدِ امضای webhook |
| `SENTRY_DSN` 🔒 | خیر | `analytics` | `https://...@sentry.io/..` | DSN سنتری |
| `POSTHOG_KEY` 🔒 | خیر | `analytics` | `phc_xxx` | کلیدِ PostHog |

**الزامی در پروداکشن (۱۵):** `NOTIFICATION_PROVIDER`, `NOTIFICATION_API_KEY`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `STORAGE_PROVIDER`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `PAYMENT_PROVIDER`, `PAYMENT_MERCHANT_ID`, `PAYMENT_API_KEY`, `PAYMENT_CALLBACK_URL`, `JOB_PROVIDER`, `JOB_SECRET`, `WEBHOOK_SIGNING_SECRET`.

---

## قراردادِ Adapterها (Adapter interfaces)

قراردادِ پایه که از `@/lib/integrations/types` می‌آید و همهٔ adapterها آن را پیاده می‌کنند:

```ts
// @/lib/integrations/types
export interface IntegrationTestResult {
  integrationId: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  checkedAt: string;       // ISO timestamp
  latencyMs?: number;
}

// قراردادِ عمومی — backendِ واقعی این را برای «تستِ اتصال» پیاده می‌کند.
export interface IntegrationAdapter {
  test(instance: IntegrationInstance): Promise<IntegrationTestResult>;
}
```

adapterهای اختصاصیِ هر دامنه از `IntegrationAdapter` ارث‌بری می‌کنند و علاوه بر `test()` متدهای عملیاتیِ خود را دارند:

```ts
// آداپتورِ اعلان — متصل به سرویسِ notification
export interface NotificationAdapter extends IntegrationAdapter {
  send(input: {
    event: string;                 // مثلِ 'checkin_reminder'
    userId: string;
    channel?: 'in_app' | 'email' | 'sms' | 'push';
    payload: Record<string, unknown>;
  }): Promise<{ deliveryId: string; status: 'queued' | 'sent' | 'failed' }>;
}

// آداپتورِ پرداخت — متصل به سرویسِ payment (واحد: تومان)
export interface PaymentAdapter extends IntegrationAdapter {
  createPayment(input: {
    amountToman: number;
    userId: string;
    description: string;
    callbackUrl: string;
  }): Promise<{ authority: string; redirectUrl: string }>;
  verifyPayment(input: {
    authority: string;
    amountToman: number;
  }): Promise<{ verified: boolean; refId?: string }>;
}

// آداپتورِ ذخیره‌سازی — متصل به سرویسِ storage
export interface StorageAdapter extends IntegrationAdapter {
  upload(input: {
    key: string;
    body: Uint8Array | Blob;
    contentType: string;
    private?: boolean;
  }): Promise<{ key: string; url: string }>;
  getSignedUrl(key: string, expiresInMinutes?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

> نکته: `test()` تنها قراردادِ موجود در سورس است؛ متدهای دامنه‌ای بالا الگوی پیشنهادی برای اتصالِ backendِ واقعی‌اند و باید با providerِ انتخابی هم‌خوان شوند.

---

## چک‌لیستِ راه‌اندازی (Setup checklist)

برای هر سرویس، چرخهٔ یکسان است: **انتخابِ provider → ستِ envها → خاموش‌کردنِ mock → تستِ اتصال → روشن‌کردنِ feature flag**.

### ۱. `notification` — اعلان‌ها
- [ ] provider واقعی (مثلِ `one_signal`) به‌جای `internal_mock`.
- [ ] env: `NOTIFICATION_PROVIDER`, `NOTIFICATION_API_KEY`. فیلدهای الزامی: `baseUrl`, `apiKey`.
- [ ] `mockMode = false`.
- [ ] تستِ اتصال → `success`.
- [ ] flag: `enable_push_notifications`. رویدادهای فعال در `toggleList` («رویدادهای فعال»).

### ۲. `email` — ایمیل
- [ ] provider (مثلِ `resend` یا `smtp`).
- [ ] env: `EMAIL_PROVIDER`, `EMAIL_FROM` (+ در صورتِ SMTP: `SMTP_*`). فیلدهای الزامی: `fromName`, `fromEmail`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.

### ۳. `sms` — پیامک / OTP
- [ ] provider (مثلِ `kavenegar`).
- [ ] env: `SMS_PROVIDER`, `SMS_API_KEY`. فیلدِ الزامی: `apiKey`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.
- [ ] flag: `enable_sms_otp`.

### ۴. `chat` — چتِ بلادرنگ
- [ ] provider (مثلِ `pusher`).
- [ ] env: `CHAT_PROVIDER`, `CHAT_WS_URL`. فیلدهای الزامی: `wsUrl`, `apiKey`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.
- [ ] flag: `enable_realtime_chat`.

### ۵. `storage` — فضای ذخیره
- [ ] provider (مثلِ `cloudflare_r2`).
- [ ] env: `STORAGE_PROVIDER`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`. فیلدهای الزامی: `bucket`, `accessKey`, `secretKey`, `maxFileSizeMb`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.
- [ ] flag: `enable_evidence_upload`.

### ۶. `payment` — درگاهِ پرداخت
- [ ] provider (مثلِ `zarinpal`).
- [ ] env: `PAYMENT_PROVIDER`, `PAYMENT_MERCHANT_ID`, `PAYMENT_API_KEY`, `PAYMENT_CALLBACK_URL`. فیلدهای الزامی: `merchantId`, `apiKey`, `callbackUrl`.
- [ ] `sandbox = false` و `mockMode = false` → تستِ اتصال → `success`.
- [ ] flag: `enable_payment_gateway`. **پیش‌نیاز:** `webhooks` آماده باشد.

### ۷. `wallet` — کیفِ پول / Escrow
- [ ] provider (مثلِ `database`). بدونِ env.
- [ ] تنظیماتِ کلیدی: `escrowEnabled`, `requireEscrowPaid`, `financeApproval`, `disputePayoutLock`, `doubleEntry`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.

### ۸. `kyc` — احرازِ هویت
- [ ] provider (مثلِ `sumsub` یا `internal_manual_review`).
- [ ] env: `KYC_PROVIDER`, `KYC_API_KEY`.
- [ ] `autoApproveDev = false` در پروداکشن → تستِ اتصال → `success`.
- [ ] flag: `enable_kyc`.

### ۹. `jobs` — کارهای پس‌زمینه
- [ ] provider (مثلِ `bullmq`).
- [ ] env: `JOB_PROVIDER`, `JOB_SECRET`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.
- [ ] flag: `enable_background_jobs`. کارهای فعال در `toggleList` («کارهای فعال»).

### ۱۰. `webhooks` — Webhookها
- [ ] provider: `internal` یا `custom`.
- [ ] env: `WEBHOOK_SIGNING_SECRET`. فیلدهای الزامی: `baseUrl`, `signingSecret`. `verifySignature = true`.
- [ ] تستِ اتصال → `success`.

### ۱۱. `moderation` — نظارت / ضدِتقلب
- [ ] provider (مثلِ `perspective_api` یا `internal_rules`). بدونِ env الزامی.
- [ ] آستانه‌ها: `toxicThreshold`, `noShowThreshold`, `autoMuteThreshold`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.

### ۱۲. `analytics` — تحلیل / مانیتورینگ
- [ ] provider (مثلِ `sentry` + `posthog`).
- [ ] env: `SENTRY_DSN`, `POSTHOG_KEY`.
- [ ] `mockMode = false` → تستِ اتصال → `success`.

---

## نقشهٔ وابستگیِ سناریوی FC26 (FC26 scenario dependency map)

از `FC26_DEPENDENCIES` (سناریوی ۱۲۸-نفره). هر ویژگی تا زمانی که همهٔ سرویس‌های وابسته‌اش `connected` نشوند production-ready نیست.

| ویژگی | سرویس‌های وابسته |
|---|---|
| هشدارِ نتیجه‌ی ثبت‌نشده | `notification`, `jobs` |
| عدمِ حضورِ خودکار | `jobs`, `notification` |
| چتِ مسابقه | `chat` |
| آپلودِ مدرک | `storage` |
| مدرکِ اختلاف | `storage`, `moderation` |
| پرداختِ جایزه | `wallet`, `payment`, `kyc` |
| ردیابیِ اقدامِ مدیر | `analytics` |

**سرویس‌های بحرانیِ این سناریو:** `jobs` و `notification` (در دو ویژگی)، `storage` (در دو ویژگی). بدونِ `jobs` هیچ‌یک از خودکارها کار نمی‌کند.

---

## هشدارهای پروداکشن (Production warnings)

قوانینِ `featureWarnings(state)` از `health.ts`. سطح‌ها: `production` / `critical` / `warning`. تعریفِ «ناقص» (`bad`) یعنی وضعیتِ سرویس یکی از `missing_config` / `error` / `disabled` باشد.

| سطح | شرطِ راه‌انداز | پیام |
|---|---|---|
| `production` | محیط = `production` و حداقل یک سرویس در حالتِ `mock` | «در محیطِ پروداکشن N سرویس در حالتِ آزمایشی است.» |
| `critical` | `enable_payment_gateway` روشن **و** `webhooks` ناقص | «درگاهِ پرداخت فعال است ولی Webhook (کلیدِ امضا) آماده نیست.» |
| `warning` | `enable_payouts` روشن **و** (`kyc` ناقص **یا** `enable_kyc` خاموش) | «پرداختِ جوایز فعال است ولی KYC غیرفعال/ناقص است.» |
| `critical` | `enable_evidence_upload` روشن **و** `storage` ناقص | «آپلودِ مدرک فعال است ولی فضای ذخیره آماده نیست.» |
| `critical` | `enable_auto_no_show` روشن **و** (`jobs` ناقص **یا** `enable_background_jobs` خاموش) | «عدمِ حضورِ خودکار فعال است ولی کارهای پس‌زمینه آماده نیست.» |

قوانینِ مکمل (از `computeStatus` و وابستگیِ flagها):
- اگر `mockMode` روشن باشد یا provider برابرِ `mockProvider` باشد → وضعیت `mock` است (حتی اگر envها ست باشند).
- هر فیلدِ `required` که خالی باشد → `missing_config`.
- `lastTest.status === 'failed'` → `error`؛ پیکربندی‌شده ولی تست‌نشده → همچنان `mock`.
- وابستگیِ flagها (`FEATURE_FLAGS.dependsOn`): `enable_payouts` به `wallet`+`payment`+`kyc`، `enable_auto_no_show` به `jobs`+`notification` وابسته است.

---

## گام‌های بعدی (Next steps)

۱. **پیاده‌سازیِ adapterهای واقعی:** متدِ `test()` برای هر providerِ غیرِmock تا «تستِ اتصال» نتیجه‌ی واقعی برگرداند.
۲. **مدیریتِ سکرت‌ها:** سکرت‌ها (🔒) را در secret managerِ محیط نگه‌دار، نه در دیتابیسِ تنظیمات.
۳. **صفرکردنِ هشدارها:** قبل از سوییچِ محیط به `production`، خروجیِ `featureWarnings` باید خالی باشد و `summarize().mock === 0` برای سرویس‌های حیاتی.
۴. **اعتبارسنجیِ envها:** در bootstrap بررسی کن که همهٔ ۱۵ متغیرِ `requiredInProduction` ست باشند.
۵. **webhook قبل از payment:** ابتدا `webhooks` (+ امضا) را آماده کن، سپس `enable_payment_gateway`.
۶. **زنجیرهٔ payout:** `wallet` → `payment` → `kyc` → `enable_payouts`.
۷. **تستِ سناریوی FC26:** نقشهٔ وابستگیِ بالا را end-to-end روی استیجینگ اجرا کن.
