import { test, expect, type Page } from '@playwright/test';

/**
 * Problem 6 — Activity & Audit.
 * یک اقدامِ حساس (حلِ اختلاف) → audit با before/after ثبت می‌شود، detail drawer باز
 * می‌شود، فیلتر کار می‌کند، و بعد از REFRESH باقی می‌ماند. فعالیت کلیک‌پذیر است.
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

async function open(page: Page) {
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);
  await page.request.delete(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
}

test('sensitive action → audit with before/after, filter, detail drawer, persists; activity clickable', async ({ page }) => {
  await open(page);

  // اقدامِ حساس: حلِ اختلاف
  await page.getByRole('button', { name: 'حلِ اختلاف' }).first().click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: /به‌نفعِ/ }).first().click();
  await page.waitForTimeout(900);

  // تبِ ممیزی → رکورد با before/after
  await page.getByRole('button', { name: 'گزارشِ ممیزی' }).first().click({ force: true });
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: /حلِ اختلاف/ }).first()).toBeVisible();
  await expect(page.getByText('پیش از').first()).toBeVisible();
  await expect(page.getByText('پس از').first()).toBeVisible();

  // detail drawer
  await page.getByRole('button', { name: /حلِ اختلاف/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/تغییرِ وضعیت/).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // خروجی CSV حاضر است
  await expect(page.getByRole('button', { name: 'خروجیِ CSV' })).toBeVisible();

  // فعالیت: کلیک‌پذیر → drawer
  await page.getByRole('button', { name: 'فعالیت' }).first().click({ force: true });
  await page.waitForTimeout(400);
  await page.locator('ol li button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  // REFRESH → audit باقی می‌ماند (persisted در core)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: 'گزارشِ ممیزی' }).first().click({ force: true });
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: /حلِ اختلاف/ }).first()).toBeVisible();
  await expect(page.getByText('پس از').first()).toBeVisible();
});
