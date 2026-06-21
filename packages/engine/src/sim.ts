/**
 * شبیه‌ساز موتور تورنومنت.
 * همه‌ی فرمت‌ها را با تعداد شرکت‌کننده‌های مختلف (شامل فردِ نیازمند BYE)،
 * انواع بازی (DUEL/TEAM/FFA) و کاربران مختلف اجرا می‌کند و صحت را تأیید می‌کند.
 *
 * اجرا:  npm run sim  -w @tournament/engine
 */
import { createTournament, CreateOpts } from './engine';
import { makeRng } from './rng';
import { Engine, Format, Participant } from './types';

function makeParticipants(n: number, rng: () => number): Participant[] {
  const arr: Participant[] = Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `Player${i}`,
    seed: 0,
    skill: 0.1 + rng() * 0.9,
  }));
  [...arr]
    .sort((a, b) => b.skill - a.skill)
    .forEach((p, i) => {
      p.seed = i + 1;
    });
  return arr;
}

/** موتور را با شبیه‌سازی نتایج تا پایان پیش می‌برد و تعداد مسابقات را برمی‌گرداند. */
function drive(engine: Engine, parts: Participant[], rng: () => number): number {
  const skill = new Map(parts.map((p) => [p.id, p.skill]));
  let played = 0;
  let guard = 0;
  while (!engine.isComplete()) {
    if (guard++ > 1_000_000) throw new Error('did not converge (possible infinite loop)');
    const ready = engine.ready();
    if (ready.length === 0) throw new Error('stuck: no ready matches but not complete');
    for (const rm of ready) {
      if (rm.kind === 'DUEL') {
        const [a, b] = rm.participantIds;
        const sa = skill.get(a)!;
        const sb = skill.get(b)!;
        const winner = rng() < sa / (sa + sb) ? a : b;
        engine.reportDuel(rm.id, winner);
      } else {
        const ranked = [...rm.participantIds].sort((x, y) => {
          const nx = skill.get(x)! + (rng() - 0.5) * 0.6;
          const ny = skill.get(y)! + (rng() - 0.5) * 0.6;
          return ny - nx;
        });
        engine.reportLobby(rm.id, ranked);
      }
      played++;
    }
  }
  return played;
}

function checkStandings(engine: Engine, n: number): void {
  const s = engine.standings();
  if (s.length !== n) throw new Error(`standings length ${s.length} != ${n}`);
  const ranks = s.map((x) => x.rank).sort((a, b) => a - b);
  for (let i = 0; i < n; i++) {
    if (ranks[i] !== i + 1) throw new Error(`ranks not a clean 1..${n} sequence`);
  }
  if (new Set(s.map((x) => x.participantId)).size !== n) {
    throw new Error('duplicate participant in standings');
  }
  if (engine.champion() !== s[0].participantId) {
    throw new Error('champion does not match rank-1 standing');
  }
}

interface Case {
  format: Format;
  genre: 'DUEL' | 'TEAM' | 'FFA';
  n: number;
  opts?: CreateOpts;
}

interface Outcome extends Case {
  ok: boolean;
  matches: number;
  champion: string;
  detail: string;
}

function expectedMatches(format: Format, n: number, opts?: CreateOpts): number | null {
  if (format === 'SINGLE_ELIM') return n - 1; // مسابقات واقعی (بدون BYE)
  if (format === 'ROUND_ROBIN') return (n * (n - 1)) / 2;
  if (format === 'FFA') return opts?.ffaRounds ?? 3;
  if (format === 'SWISS') {
    const R = opts?.swissRounds ?? Math.max(1, Math.ceil(Math.log2(n)));
    return R * Math.floor(n / 2);
  }
  return null; // DOUBLE_ELIM: متغیر (reset/BYE) — با چک اختصاصی تأیید می‌شود
}

function runCase(c: Case): Outcome {
  const rng = makeRng(1000 + c.n * 7 + c.format.length);
  const parts = makeParticipants(c.n, rng);
  const base: Outcome = { ...c, ok: false, matches: 0, champion: '', detail: '' };
  try {
    const engine = createTournament(c.format, parts, c.opts);
    const played = drive(engine, parts, rng);
    if (!engine.isComplete()) throw new Error('engine not complete after drive');
    const champ = engine.champion();
    if (!champ) throw new Error('no champion');
    checkStandings(engine, c.n);
    if (c.format === 'DOUBLE_ELIM') {
      const cs = engine.standings().find((s) => s.participantId === champ)!;
      if (cs.losses > 1) throw new Error(`DE champion has ${cs.losses} losses (>1)`);
    }
    const exp = expectedMatches(c.format, c.n, c.opts);
    if (exp !== null && played !== exp) {
      throw new Error(`matches ${played} != expected ${exp}`);
    }
    return { ...base, ok: true, matches: played, champion: champ, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

function main(): void {
  const cases: Case[] = [];

  // حذفی تک — DUEL (مثل FC) و TEAM، با تعداد فرد (BYE) و زوج
  for (const n of [2, 3, 5, 7, 8, 13, 16, 31, 64]) {
    cases.push({ format: 'SINGLE_ELIM', genre: 'DUEL', n });
  }
  cases.push({ format: 'SINGLE_ELIM', genre: 'TEAM', n: 12 });
  cases.push({ format: 'SINGLE_ELIM', genre: 'TEAM', n: 24 });

  // گروهی/لیگ — Round-Robin
  for (const n of [2, 3, 4, 6, 8, 10]) {
    cases.push({ format: 'ROUND_ROBIN', genre: 'DUEL', n });
  }

  // FFA / Battle Royale — placement
  for (const n of [2, 5, 16, 50, 100]) {
    cases.push({ format: 'FFA', genre: 'FFA', n, opts: { ffaRounds: 3 } });
  }
  cases.push({ format: 'FFA', genre: 'FFA', n: 64, opts: { ffaRounds: 6 } });

  // حذفی دوگانه — توان‌۲ و فردِ نیازمند BYE
  for (const n of [2, 4, 6, 8, 12, 16, 32]) {
    cases.push({ format: 'DOUBLE_ELIM', genre: 'DUEL', n });
  }

  // سوئیسی — تعداد زیاد (زوج و فرد)
  for (const n of [4, 7, 8, 15, 16, 32]) {
    cases.push({
      format: 'SWISS',
      genre: 'DUEL',
      n,
      opts: { swissRounds: Math.max(1, Math.ceil(Math.log2(n))) },
    });
  }

  const results = cases.map(runCase);

  // جدول نتایج
  const pad = (s: string | number, w: number) => String(s).padEnd(w);
  console.log('');
  console.log('🏆 شبیه‌ساز موتور تورنومنت — تست همه فرمت‌ها / بازی‌ها / کاربران');
  console.log('─'.repeat(78));
  console.log(
    pad('FORMAT', 14) + pad('GENRE', 7) + pad('N', 6) + pad('MATCHES', 9) + pad('CHAMP', 9) + 'RESULT',
  );
  console.log('─'.repeat(78));
  for (const r of results) {
    const status = r.ok ? '✅ PASS' : `❌ FAIL: ${r.detail}`;
    console.log(
      pad(r.format, 14) +
        pad(r.genre, 7) +
        pad(r.n, 6) +
        pad(r.matches, 9) +
        pad(r.champion || '-', 9) +
        status,
    );
  }
  console.log('─'.repeat(78));

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\nنتیجه: ${passed}/${total} تست پاس شد.`);
  if (passed !== total) {
    console.log('❌ بعضی تست‌ها رد شدند.');
    process.exit(1);
  }
  console.log('✅ همه‌ی تست‌ها پاس شدند.');
}

main();
