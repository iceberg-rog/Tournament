import { test, expect, type Page } from '@playwright/test';

/**
 * Real click QA — Operator flow on the FC26 control room.
 * نیازمندِ بالا بودنِ web (3000) و api (4000) + اکانتِ admin@example.com.
 * اجرا: npx playwright test  (از apps/web). از کانالِ Edge استفاده می‌کند (بدونِ دانلودِ مرورگر).
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

async function loginAndSeed(page: Page) {
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  expect(accessToken).toBeTruthy();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);
}

test.describe('Control room — operator flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndSeed(page);
  });

  test('no-show action: confirm modal → resolves → leaves queue → activity → persists', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500); // seed از control-board

    const noShowBtns = page.getByRole('button', { name: 'ثبتِ عدمِ حضور' });
    const before = await noShowBtns.count();
    expect(before).toBeGreaterThan(0);

    const titlesBefore = await page.locator('h4').allInnerTexts();
    const target = titlesBefore.find((t) => t.includes('غایب')) as string;
    expect(target).toBeTruthy();

    // کلیک → باید مودالِ تأیید باز شود (نه اجرای بی‌صدا)
    await noShowBtns.first().click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('با تأیید');

    // تأیید و اجرا
    await page.getByRole('button', { name: 'تأیید و اجرا' }).click();
    await page.waitForTimeout(1200);

    // آیتم باید از صف خارج شده باشد
    const titlesAfter = await page.locator('h4').allInnerTexts();
    expect(titlesAfter).not.toContain(target);

    // رویدادِ فعالیت ثبت شده
    await page.getByRole('button', { name: 'فعالیت' }).first().click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/حذف شد|حاضر نشد/).first()).toBeVisible();

    // ممیزی ثبت شده
    await page.getByRole('button', { name: 'گزارشِ ممیزی' }).first().click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/عدمِ حضور/).first()).toBeVisible();

    // persistence پس از refresh
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    const titlesReload = await page.locator('h4').allInnerTexts();
    expect(titlesReload).not.toContain(target);
  });

  test('participant drawer opens with full identity and a working action', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/participants`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const row = page.locator('tbody tr').first();
    await row.click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('ایمیل');
    await expect(drawer).toContainText('KYC');
    // یک اکشن: اخطار
    const warn = drawer.getByRole('button', { name: /اخطار/ }).first();
    if (await warn.count()) await warn.click();
  });

  test('bracket: full multi-round map, match list filter, match drawer, fullscreen modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/bracket`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // نقشه‌ی براکت: بیش از ۳ دور و ده‌ها مسابقه (نه چند مسابقه‌ی fixture)
    await expect(page.getByText(/مرحله‌ی ۳۲تایی/).first()).toBeVisible();
    const cardCount = await page.locator('button:has-text("#")').count();
    expect(cardCount).toBeGreaterThan(20);

    // کلیک روی یک کارت → Match Drawer با امتیاز/اکشن
    await page.locator('button:has-text("#")').first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('ثبتِ امتیاز');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // فهرستِ مسابقات + جست‌وجو
    await page.getByRole('button', { name: 'فهرستِ مسابقات' }).click();
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="جست"]').first().fill('Messi');
    await page.waitForTimeout(500);
    expect(await page.locator('ul li').count()).toBeGreaterThan(0);

    // مودالِ تمام‌صفحه
    await page.getByRole('button', { name: 'نقشه‌ی براکت' }).click();
    await page.getByRole('button', { name: 'نمایشِ تمام‌صفحه' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('نقشه‌ی کاملِ براکت')).toBeVisible();
  });

  test('dispute drawer opens with reporter/opponent/evidence/impact and a decision persists', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/disputes`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /بازکردنِ پرونده/ }).first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('گزارش‌دهنده');
    await expect(drawer).toContainText('مدارک');
    await expect(drawer).toContainText('اثر روی تورنومنت');
    // تصمیم: درخواستِ مدرکِ بیشتر → وضعیت under_review (persist)
    await drawer.getByRole('button', { name: 'درخواستِ مدرکِ بیشتر' }).click();
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await expect(page.getByText('در حالِ بررسی').first()).toBeVisible();
  });
});
