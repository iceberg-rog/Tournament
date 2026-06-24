import { test, expect, type Page } from '@playwright/test';

/**
 * Real Operator QA — Persistent State Verification.
 * هر تست با login واقعی کلیک می‌کند، state را تغییر می‌دهد، صفحه را REFRESH می‌کند
 * و assert می‌کند تغییر برنگشته است. control-board قبل از هر تست reset می‌شود تا
 * سناریوی تازه‌ی FC26 موجود باشد.
 * اجرا: npx playwright test tests/tournament-ops-real-click.spec.ts (web 3000 + api 4000).
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

async function loginResetOpen(page: Page, path: string) {
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  expect(accessToken).toBeTruthy();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);
  // ریست control-board تا سناریوی تازه seed شود
  await page.request.delete(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
}

test.describe('Real operator QA — persistence', () => {
  test('resolve dispute in control room → blocker/queue change → survives refresh + activity + audit', async ({ page }) => {
    await loginResetOpen(page, `/admin/tournaments/${T}/control-room`);

    const disputeBtns = page.getByRole('button', { name: 'حلِ اختلاف' });
    const disputesBefore = await disputeBtns.count();
    expect(disputesBefore).toBeGreaterThan(0);

    // باز کردنِ drawerِ اختلاف از صفِ اقدامات
    await disputeBtns.first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    // تصمیم: به‌نفعِ یکی از طرفین
    await drawer.getByRole('button', { name: /به‌نفعِ/ }).first().click();
    await page.waitForTimeout(900);

    // روی همان صفحه: اختلاف از صف رفته
    expect(await disputeBtns.count()).toBeLessThan(disputesBefore);

    // فعالیت ثبت شد
    await page.getByRole('button', { name: 'فعالیت' }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText(/اختلاف.*حل/).first()).toBeVisible();
    // ممیزی ثبت شد
    await page.getByRole('button', { name: 'گزارشِ ممیزی' }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /حلِ اختلاف/ }).first()).toBeVisible();

    // REFRESH (سریع) → اختلاف نباید برگردد
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    expect(await page.getByRole('button', { name: 'حلِ اختلاف' }).count()).toBeLessThan(disputesBefore);
  });

  test('no-show in control room → player resolved → queue count drops → survives refresh', async ({ page }) => {
    await loginResetOpen(page, `/admin/tournaments/${T}/control-room`);

    const card = page.locator('li').filter({ hasText: 'غایب است' }).first();
    await expect(card).toBeVisible();
    const target = (await card.locator('h4').first().innerText()).trim();
    const queueBefore = await page.locator('h4').count();

    await card.getByRole('button', { name: 'ثبتِ عدمِ حضور' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'تأیید و اجرا' }).click();
    await page.waitForTimeout(900);

    // آیتم از صف رفت + شمارش کم شد
    expect(await page.locator('h4').allInnerTexts()).not.toContain(target);
    expect(await page.locator('h4').count()).toBeLessThan(queueBefore);

    // REFRESH → برنگشت
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    expect(await page.locator('h4').allInnerTexts()).not.toContain(target);
  });

  test('overview is operational (state, health, blocker action, non-empty recent ops)', async ({ page }) => {
    await loginResetOpen(page, `/admin/tournaments/${T}`);
    const body = page.locator('body');
    await expect(body).toContainText('نمای کلیِ عملیات');
    await expect(body).toContainText('مرحله‌ی فعلی');
    await expect(body).toContainText('بعد چه می‌شود');
    // مانعِ بحرانی با اقدامِ مستقیم
    await expect(page.getByRole('link', { name: 'حلِ اختلاف' }).first()).toBeVisible();
    // عملیاتِ اخیر خالیِ تزئینی نیست
    await expect(body).not.toContainText('رویدادی ثبت نشده است');
    await expect(body).toContainText('عملیاتِ اخیر');
  });

  test('approve a pending result in control room → survives refresh', async ({ page }) => {
    await loginResetOpen(page, `/admin/tournaments/${T}/control-room`);
    const approveBtns = page.getByRole('button', { name: 'تأییدِ نتیجه' });
    const before = await approveBtns.count();
    if (before === 0) test.skip(true, 'no pending result in this seed');
    await approveBtns.first().click();
    await page.waitForTimeout(900);
    expect(await approveBtns.count()).toBeLessThan(before);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    expect(await page.getByRole('button', { name: 'تأییدِ نتیجه' }).count()).toBeLessThan(before);
  });
});
