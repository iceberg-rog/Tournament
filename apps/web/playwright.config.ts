import { defineConfig } from '@playwright/test';

// تستِ کلیکیِ واقعیِ پنلِ مدیریت. از کانالِ Edge (مرورگرِ نصب‌شده) استفاده می‌کند
// تا نیازی به دانلودِ مرورگر نباشد. web (3000) و api (4000) باید بالا باشند.
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'msedge',
    headless: true,
    locale: 'fa-IR',
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 15_000,
  },
});
