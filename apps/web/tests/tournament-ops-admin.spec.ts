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
    // ریست control-board تا غیبت‌های FC26 تازه seed شوند (جلوگیری از آلودگیِ state بینِ تست‌ها)
    const tok = await page.evaluate(() => localStorage.getItem('accessToken'));
    await page.request.delete(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${tok}` } });

    await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2800); // seed از control-board

    // کارتِ «X غایب است» (no-showِ بازیکن) — دکمه را داخلِ همان کارت می‌زنیم تا با
    // آیتمِ no-showِ مسابقه اشتباه نشود.
    const card = page.locator('li').filter({ hasText: 'غایب است' }).first();
    await expect(card).toBeVisible();
    const target = (await card.locator('h4').first().innerText()).trim();
    expect(target).toContain('غایب');

    // کلیک روی دکمه‌ی همان کارت → باید مودالِ تأیید باز شود (نه اجرای بی‌صدا)
    await card.getByRole('button', { name: 'ثبتِ عدمِ حضور' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('با تأیید');

    // تأیید و اجرا
    await page.getByRole('button', { name: 'تأیید و اجرا' }).click();
    await page.waitForTimeout(1200);

    // آیتم باید از صف خارج شده باشد
    const titlesAfter = await page.locator('h4').allInnerTexts();
    expect(titlesAfter).not.toContain(target);

    // رویدادِ فعالیت ثبت شده (force: کلیک ممکن است با toastِ گذرا تداخل کند)
    await page.getByRole('button', { name: 'فعالیت' }).first().click({ force: true });
    await page.waitForTimeout(600);
    await expect(page.getByText(/حذف شد|حاضر نشد/).first()).toBeVisible();

    // ممیزی ثبت شده
    await page.getByRole('button', { name: 'گزارشِ ممیزی' }).first().click({ force: true });
    await page.waitForTimeout(600);
    await expect(page.getByRole('button', { name: /عدمِ حضور/ }).first()).toBeVisible();

    // persistence پس از refresh
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2800);
    const titlesReload = await page.locator('h4').allInnerTexts();
    expect(titlesReload).not.toContain(target);
  });

  test('participant search + full identity drawer + warn/mute persist', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/participants`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    expect(await page.locator('tbody tr').count()).toBe(128);

    // جست‌وجو بر اساسِ ایمیل
    await page.locator('input[placeholder*="جست"]').first().fill('phantom@example.com');
    await page.waitForTimeout(500);
    expect(await page.locator('tbody tr').count()).toBeLessThan(128);
    await page.locator('input[placeholder*="جست"]').first().fill('');
    await page.waitForTimeout(300);

    // Player Drawer با هویتِ کامل
    await page.locator('tbody tr').first().click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    for (const f of ['ایمیل', 'تلفن', 'Game ID', 'نامِ نمایشی', 'KYC', 'کیفِ پول']) {
      await expect(drawer).toContainText(f);
    }

    // اخطار → بازخوردِ مرئی + persist
    await drawer.getByRole('button', { name: /اخطار/ }).first().click();
    await expect(page.getByText(/اخطار.*ثبت شد/).first()).toBeVisible();
    await drawer.getByRole('button', { name: /^بی‌صدا/ }).first().click();
    await page.waitForTimeout(400);
    const patches = await page.evaluate(() => localStorage.getItem('shelter:ops:t7:participant-patches'));
    expect(patches && patches.length > 5).toBeTruthy();

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => localStorage.getItem('shelter:ops:t7:participant-patches'));
    expect(after && after.length > 5).toBeTruthy();
  });

  test('chat: send message persists, policy + moderation controls present', async ({ page }) => {
    await page.goto(`${BASE}/admin/tournaments/${T}/chat`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const uniq = 'qaChat-' + Date.now();
    await page.locator('input[placeholder*="پیامِ مدیر"], textarea[placeholder*="پیامِ مدیر"]').first().fill(uniq);
    await page.getByRole('button', { name: 'ارسال' }).first().click();
    await page.waitForTimeout(600);
    await expect(page.getByText(uniq).first()).toBeVisible();

    // policy + moderation controls exist
    expect(await page.locator('select option').count()).toBeGreaterThanOrEqual(4);
    expect(await page.getByRole('button', { name: /بی‌صدا/ }).count()).toBeGreaterThan(0);
    expect(await page.getByRole('button', { name: /حذف/ }).count()).toBeGreaterThan(0);

    // persistence
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1300);
    await expect(page.getByText(uniq).first()).toBeVisible();
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
