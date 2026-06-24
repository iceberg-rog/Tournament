import { test, expect, type Page } from '@playwright/test';

/**
 * Problem 8 — Operational Settings.
 * تنظیمات persist می‌شوند و no-show روی رفتارِ صفِ اقدامات اثرِ واقعی دارد:
 * خاموش‌کردنِ «نیازِ تأییدِ مدیر» → آیتم‌های «X غایب است» از صف خارج می‌شوند.
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

async function login(page: Page) {
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);
  await page.request.delete(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  await page.evaluate(() => localStorage.removeItem('shelter:ops:t7:operational-settings'));
}

test('settings page persists; no-show requireAdminApproval toggle changes control-room queue', async ({ page }) => {
  await login(page);

  // صفِ اقدامات: غیبت‌ها هستند (پیش‌فرض requireAdminApproval=true)
  await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  const ghostBefore = await page.locator('li').filter({ hasText: 'غایب است' }).count();
  expect(ghostBefore).toBeGreaterThan(0);

  // برو به تنظیمات و «نیازِ تأییدِ مدیر برای عدمِ حضور» را خاموش کن
  await page.goto(`${BASE}/admin/tournaments/${T}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await expect(page.getByText('تنظیماتِ عملیاتی')).toBeVisible();
  // همه‌ی دسته‌ها حاضرند
  for (const sec of ['چک‌این', 'عدمِ حضور', 'نتیجه', 'اختلاف', 'پیشروی', 'اعلان‌ها', 'چت', 'استریم', 'پرداخت']) {
    await expect(page.getByRole('heading', { name: sec }).first()).toBeVisible();
  }
  await page.getByRole('button', { name: /نیازِ تأییدِ مدیر برای عدمِ حضور/ }).click();
  await page.waitForTimeout(400);
  // persist در localStorage
  const stored = await page.evaluate(() => localStorage.getItem('shelter:ops:t7:operational-settings'));
  expect(stored && stored.includes('"requireAdminApprovalForNoShow":false')).toBeTruthy();

  // بازگشت به اتاقِ کنترل → آیتم‌های «غایب است» باید رفته باشند (خودکار اعمال)
  await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  const ghostAfter = await page.locator('li').filter({ hasText: 'غایب است' }).count();
  expect(ghostAfter).toBe(0);

  // refresh → تنظیم باقی می‌ماند و رفتار همان است
  await page.goto(`${BASE}/admin/tournaments/${T}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const stored2 = await page.evaluate(() => localStorage.getItem('shelter:ops:t7:operational-settings'));
  expect(stored2 && stored2.includes('"requireAdminApprovalForNoShow":false')).toBeTruthy();
});
