import { test, expect } from '@playwright/test';

/**
 * Auto-start دورِ بعد: وقتی دورِ جاری کامل شود، دورِ بعدی خودکار فعال می‌شود
 * (طبقِ تنظیماتِ progression). با seed کردنِ control-board با دورِ ۳ کاملاً
 * حل‌شده، انتظار داریم پس از load، دور به ۴ پیش برود.
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000/api';
const T = 't7';

test('round fully resolved → next round auto-starts (no manual button, no stale blockers)', async ({ page }) => {
  const res = await page.request.post(`${API}/auth/login`, { data: { email: 'admin@example.com', password: 'admin12345' } });
  const { accessToken, refreshToken } = await res.json();
  await page.goto(`${BASE}/`);
  await page.evaluate(([a, r]) => { localStorage.setItem('accessToken', a as string); localStorage.setItem('refreshToken', r as string); }, [accessToken, refreshToken]);

  // یک core بساز که دورِ ۳ کاملاً حل‌شده است (۴ مسابقه‌ی ساده برای کوچک‌سازی)
  const seed = {
    tournamentId: T, title: 'FC26', game: 'EA Sports FC 26', format: 'single_elimination', prize: 8000000,
    phase: 'round_active', currentRound: 3, totalRounds: 4, roundName: 'مرحله‌ی ۸تایی',
    progressionSettings: { autoGenerateNextRound: true, autoStartNextRoundWhenReady: true, applyByeAutomatically: true, requireAdminApprovalForNextRound: false },
    participants: [0,1,2,3].map((i) => ({ id: `p${i}`, name: `Player${i}`, initials: `P${i}`, color: '#22c55e', status: 'playing', seed: i + 1, paid: true, reports: 0 })),
    matches: [
      { id: 'fc-r3m0', number: 1, round: 3, roundName: 'مرحله‌ی ۸تایی', aId: 'p0', bId: 'p1', scoreA: 3, scoreB: 1, status: 'completed', winnerId: 'p0', evidenceCount: 1, chatUnread: 0 },
      { id: 'fc-r3m1', number: 2, round: 3, roundName: 'مرحله‌ی ۸تایی', aId: 'p2', bId: 'p3', scoreA: 2, scoreB: 0, status: 'completed', winnerId: 'p2', evidenceCount: 1, chatUnread: 0 },
    ],
    disputes: [], activity: [],
  };
  await page.request.put(`${API}/control-board/${T}`, { headers: { Authorization: `Bearer ${accessToken}` }, data: seed });

  await page.goto(`${BASE}/admin/tournaments/${T}/control-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // load + auto-advance effect

  const core = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('shelter:cr:t7:v1') || 'null'); } catch { return null; } });
  expect(core).toBeTruthy();
  // دور خودکار به ۴ (فینال) پیش رفت
  expect(core.currentRound).toBe(4);
  // فینال (دورِ ۴) از برندگانِ دورِ ۳ ساخته شده — دو بازیکن
  const finalMatch = core.matches.find((m: any) => m.round === 4);
  expect(finalMatch).toBeTruthy();
  expect([finalMatch.aId, finalMatch.bId].sort()).toEqual(['p0', 'p2']);
  // فعالیتِ auto-start ثبت شده
  expect((core.activity as any[]).some((a) => /خودکار شروع شد/.test(a.text))).toBe(true);

  // refresh → دور همچنان ۴
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const core2 = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('shelter:cr:t7:v1') || 'null'); } catch { return null; } });
  expect(core2.currentRound).toBe(4);
});
