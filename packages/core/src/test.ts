/**
 * تست یکپارچگیِ چرخه‌ی کاملِ تورنومنت از طریق سرویس دامنه (با مخزن in-memory).
 * شبیه‌سازی واقعی: ساخت تورنومنت → ثبت‌نام کاربرها → شروع → گزارش نتایج → رده‌بندی/قهرمان.
 * بدون نیاز به دیتابیس. اجرا:  npm run test -w @tournament/core
 */
import { Format, Genre, makeRng } from '@tournament/engine';
import { InMemoryTournamentRepository } from './memoryRepository';
import { TournamentService } from './tournamentService';

interface Case {
  format: Format;
  genre: Genre;
  n: number;
  ffaRounds?: number;
  swissRounds?: number;
}

interface Outcome extends Case {
  ok: boolean;
  champion: string;
  detail: string;
}

async function runCase(c: Case, seed: number): Promise<Outcome> {
  const base: Outcome = { ...c, ok: false, champion: '', detail: '' };
  try {
    const repo = new InMemoryTournamentRepository();
    let counter = 0;
    const svc = new TournamentService(repo, () => `t${++counter}`, () => '2026-01-01T00:00:00Z');
    const rng = makeRng(seed);

    const t = await svc.create({
      title: `${c.format} / ${c.n}`,
      format: c.format,
      genre: c.genre,
      ffaRounds: c.ffaRounds,
      swissRounds: c.swissRounds,
    });

    // ثبت‌نام کاربران
    const skill = new Map<string, number>();
    for (let i = 0; i < c.n; i++) {
      const id = `u${i}`;
      const sk = 0.1 + rng() * 0.9;
      skill.set(id, sk);
      await svc.register(t.id, { id, name: `Player${i}`, seed: 0, skill: sk });
    }

    // اعتبارسنجی ثبت‌نام: تکراری و بعد از شروع باید رد شود
    let dupBlocked = false;
    try {
      await svc.register(t.id, { id: 'u0', name: 'dup', seed: 0, skill: 0.5 });
    } catch {
      dupBlocked = true;
    }
    if (!dupBlocked) throw new Error('duplicate registration was not blocked');

    await svc.start(t.id);

    let afterStartBlocked = false;
    try {
      await svc.register(t.id, { id: 'late', name: 'late', seed: 0, skill: 0.5 });
    } catch {
      afterStartBlocked = true;
    }
    if (!afterStartBlocked) throw new Error('registration after start was not blocked');

    // اجرای مسابقات تا پایان
    let guard = 0;
    while (true) {
      const cur = await svc.get(t.id);
      if (cur.status === 'COMPLETED') break;
      if (guard++ > 1_000_000) throw new Error('did not converge');
      const ready = await svc.ready(t.id);
      if (ready.length === 0) throw new Error('stuck: no ready matches but not complete');
      for (const rm of ready) {
        if (rm.kind === 'DUEL') {
          const [a, b] = rm.participantIds;
          const w = rng() < skill.get(a)! / (skill.get(a)! + skill.get(b)!) ? a : b;
          await svc.reportDuel(t.id, rm.id, w);
        } else {
          const ranked = [...rm.participantIds].sort(
            (x, y) =>
              skill.get(y)! + (rng() - 0.5) * 0.6 - (skill.get(x)! + (rng() - 0.5) * 0.6),
          );
          await svc.reportLobby(t.id, rm.id, ranked);
        }
      }
    }

    // صحت‌سنجی نتیجه
    const champ = await svc.champion(t.id);
    if (!champ) throw new Error('no champion');
    const st = await svc.standings(t.id);
    if (st.length !== c.n) throw new Error(`standings length ${st.length} != ${c.n}`);
    const ranks = st.map((s) => s.rank).sort((a, b) => a - b);
    for (let i = 0; i < c.n; i++) if (ranks[i] !== i + 1) throw new Error('ranks not 1..n');
    if (new Set(st.map((s) => s.participantId)).size !== c.n) throw new Error('duplicate in standings');
    if (st[0].participantId !== champ) throw new Error('champion != rank 1');
    const final = await svc.get(t.id);
    if (final.status !== 'COMPLETED') throw new Error('status not COMPLETED');

    return { ...base, ok: true, champion: champ, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function main(): Promise<void> {
  const cases: Case[] = [];
  for (const n of [2, 3, 5, 8, 16, 31]) cases.push({ format: 'SINGLE_ELIM', genre: 'DUEL', n });
  for (const n of [2, 4, 6, 8, 16]) cases.push({ format: 'DOUBLE_ELIM', genre: 'DUEL', n });
  for (const n of [3, 4, 6, 8]) cases.push({ format: 'ROUND_ROBIN', genre: 'DUEL', n });
  for (const n of [4, 7, 8, 16])
    cases.push({ format: 'SWISS', genre: 'DUEL', n, swissRounds: Math.max(1, Math.ceil(Math.log2(n))) });
  for (const n of [2, 8, 32, 64]) cases.push({ format: 'FFA', genre: 'FFA', n, ffaRounds: 3 });

  const results: Outcome[] = [];
  for (let i = 0; i < cases.length; i++) {
    results.push(await runCase(cases[i], 5000 + i * 13));
  }

  const pad = (s: string | number, w: number) => String(s).padEnd(w);
  console.log('\n🏆 تست چرخه‌ی کامل تورنومنت (سرویس + مخزن in-memory)');
  console.log('─'.repeat(70));
  console.log(pad('FORMAT', 14) + pad('GENRE', 7) + pad('N', 6) + pad('CHAMP', 9) + 'RESULT');
  console.log('─'.repeat(70));
  for (const r of results) {
    console.log(
      pad(r.format, 14) +
        pad(r.genre, 7) +
        pad(r.n, 6) +
        pad(r.champion || '-', 9) +
        (r.ok ? '✅ PASS' : `❌ FAIL: ${r.detail}`),
    );
  }
  console.log('─'.repeat(70));
  const passed = results.filter((r) => r.ok).length;
  console.log(`\nنتیجه: ${passed}/${results.length} تست پاس شد.`);
  if (passed !== results.length) {
    console.log('❌ بعضی تست‌ها رد شدند.');
    process.exit(1);
  }
  console.log('✅ همه‌ی تست‌ها پاس شدند.');
}

main();
