import { test, expect, type Page } from '@playwright/test';

/**
 * Bracket Progression / Double No-show QA — منطقِ state machine.
 * عدمِ حضورِ دوطرفه → هر دو حذف → مسابقه void → حریفِ دورِ بعد BYE می‌گیرد و صعود می‌کند.
 * assert از روی stateِ persisted (localStorage core) — دقیق و refresh-safe.
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

async function core(page: Page) {
  return await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('shelter:cr:t7:v1') || 'null'); } catch { return null; } });
}

test('double no-show → both eliminated → opponent BYE advance → persists; blockers recalc', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);
  await page.request.delete(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);

  // ۱) مسابقه‌ی no-showِ یک‌طرفه را حل کن (تا یک feeder از byeِ دورِ بعد ست شود)
  const nsCard = page.locator('li').filter({ hasText: 'حاضر نشده' }).first();
  await expect(nsCard).toBeVisible();
  await nsCard.getByRole('button', { name: 'ثبتِ عدمِ حضور' }).click();
  await page.getByRole('button', { name: 'تأیید و اجرا' }).click();
  await page.waitForTimeout(900);

  // ۲) مسابقه‌ی عدمِ حضورِ دوطرفه را باز کن و ثبت کن
  const dnsCard = page.locator('li').filter({ hasText: 'عدمِ حضورِ دوطرفه' }).first();
  await expect(dnsCard).toBeVisible();
  await dnsCard.getByRole('button', { name: /بازکردنِ مسابقه|بازکردن/ }).first().click();
  await page.waitForTimeout(700);
  // دکمه → مودالِ شیشه‌ایِ تأیید (نه window.confirm)
  await page.getByRole('button', { name: 'ثبتِ عدمِ حضورِ دوطرفه' }).click();
  await expect(page.getByText('هر دو بازیکن حذف می‌شوند.')).toBeVisible();
  await page.getByRole('button', { name: 'تأیید و اعمالِ عدمِ حضورِ دوطرفه' }).click();
  await page.waitForTimeout(1200);

  // ۳) assert از stateِ persisted
  const c1 = await core(page);
  expect(c1).toBeTruthy();
  const dns = c1.matches.find((m: any) => m.id === 'fc-r3m3');
  expect(dns.status).toBe('completed');
  expect(dns.voided).toBe(true);
  // هر دو بازیکنِ مسابقه حذف شده‌اند
  const both = [dns.aId, dns.bId].map((id: string) => c1.participants.find((p: any) => p.id === id));
  expect(both.every((p: any) => p && (p.status === 'eliminated' || p.status === 'disqualified'))).toBe(true);
  // propagation: یک مسابقه‌ی دورِ ۴ به‌صورتِ BYE حل شده (یک برنده، slot مقابل خالی)
  const byeMatch = c1.matches.find((m: any) => m.round === 4 && m.bye === true && m.winnerId);
  expect(byeMatch, 'باید یک مسابقه‌ی BYE در دورِ ۴ ساخته شده باشد').toBeTruthy();

  // ۴) action queue: آیتمِ double-no-show دیگر نیست
  await expect(page.locator('li').filter({ hasText: 'عدمِ حضورِ دوطرفه' })).toHaveCount(0);
  // فعالیتِ BYE ثبت شده
  await page.getByRole('button', { name: 'فعالیت' }).first().click({ force: true });
  await page.waitForTimeout(500);
  await expect(page.getByText(/BYE|استراحت|بدونِ برنده/).first()).toBeVisible();

  // ۵) REFRESH → برنگشتن
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  const c2 = await core(page);
  const dns2 = c2.matches.find((m: any) => m.id === 'fc-r3m3');
  expect(dns2.status).toBe('completed');
  expect(dns2.voided).toBe(true);
  expect(c2.matches.find((m: any) => m.round === 4 && m.bye === true)).toBeTruthy();
  // مسابقه‌ی double-no-show دیگر به‌عنوانِ blocker در صف نیست
  await expect(page.locator('li').filter({ hasText: 'عدمِ حضورِ دوطرفه' })).toHaveCount(0);
});
