/**
 * تست یکپارچگیِ چرخه‌ی کاملِ تورنومنت از طریق سرویس دامنه (با مخزن in-memory).
 * شبیه‌سازی واقعی: ساخت تورنومنت → ثبت‌نام کاربرها → شروع → گزارش نتایج → رده‌بندی/قهرمان.
 * بدون نیاز به دیتابیس. اجرا:  npm run test -w @tournament/core
 */
import { Format, Genre, makeRng } from '@tournament/engine';
import { InMemoryTournamentRepository } from './memoryRepository';
import { TournamentService } from './tournamentService';
import { InMemoryWalletRepository } from './wallet';
import { InMemoryNotificationRepository } from './notifications';
import { InMemorySeasonRepository, SeasonService } from './season';

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

async function expectThrow(fn: () => Promise<unknown>, label: string): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(`expected throw but did not: ${label}`);
}

/** سناریوی check-in و no-show روی یک حذفی ۴ نفره. */
async function runCheckInScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 4,
    ok: false,
    champion: '',
    detail: '',
  };
  try {
    const repo = new InMemoryTournamentRepository();
    let c = 0;
    const svc = new TournamentService(repo, () => `c${++c}`, () => '2026-01-01T00:00:00Z');
    const t = await svc.create({
      title: 'CheckIn Cup',
      format: 'SINGLE_ELIM',
      genre: 'DUEL',
      requireCheckIn: true,
    });
    for (let i = 0; i < 4; i++) {
      await svc.register(t.id, { id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
    }
    await svc.start(t.id);

    let ready = await svc.ready(t.id);
    if (ready.length !== 2) throw new Error(`expected 2 first-round matches, got ${ready.length}`);
    const m0 = ready[0];
    const m1 = ready[1];

    // گزارش پیش از check-in باید رد شود
    await expectThrow(() => svc.reportDuel(t.id, m0.id, m0.participantIds[0]), 'report before check-in');
    // check-in توسط غیرشرکت‌کننده رد شود
    await expectThrow(() => svc.checkIn(t.id, m0.id, 'stranger'), 'check-in by non-participant');

    // m0: هر دو check-in، سپس گزارش عادی
    await svc.checkIn(t.id, m0.id, m0.participantIds[0]);
    await svc.checkIn(t.id, m0.id, m0.participantIds[1]);
    await expectThrow(() => svc.checkIn(t.id, m0.id, m0.participantIds[0]), 'double check-in');
    await svc.reportDuel(t.id, m0.id, m0.participantIds[0]);

    // m1: فقط یک طرف check-in → no-show
    await svc.checkIn(t.id, m1.id, m1.participantIds[0]);
    await expectThrow(
      () => svc.declareNoShow(t.id, m1.id, m1.participantIds[1]),
      'no-show declared by non-checked-in side',
    );
    await svc.declareNoShow(t.id, m1.id, m1.participantIds[0]);

    // ادامه تا پایان (فینال)
    let guard = 0;
    while ((await svc.get(t.id)).status !== 'COMPLETED') {
      if (guard++ > 100) throw new Error('did not converge');
      ready = await svc.ready(t.id);
      if (ready.length === 0) throw new Error('stuck');
      for (const m of ready) {
        for (const p of m.participantIds) await svc.checkIn(t.id, m.id, p);
        await svc.reportDuel(t.id, m.id, m.participantIds[0]);
      }
    }

    const champ = await svc.champion(t.id);
    if (!champ) throw new Error('no champion');
    const st = await svc.standings(t.id);
    if (st.length !== 4) throw new Error('standings != 4');
    return { ...base, ok: true, champion: champ, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی استخر جایزه: پرداخت per-rank به کیف پول برنده‌ها هنگام پایان. */
async function runPrizeScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 4,
    ok: false,
    champion: '',
    detail: '',
  };
  try {
    const repo = new InMemoryTournamentRepository();
    const wallet = new InMemoryWalletRepository();
    let c = 0;
    const svc = new TournamentService(repo, () => `p${++c}`, () => '2026-01-01T00:00:00Z', wallet);
    const t = await svc.create({
      title: 'Prize Cup',
      format: 'SINGLE_ELIM',
      genre: 'DUEL',
      prizePool: [
        { rank: 1, amount: 1000 },
        { rank: 2, amount: 500 },
      ],
    });
    for (let i = 0; i < 4; i++) {
      await svc.register(t.id, { id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
    }
    await svc.start(t.id);

    let guard = 0;
    while ((await svc.get(t.id)).status !== 'COMPLETED') {
      if (guard++ > 100) throw new Error('did not converge');
      for (const m of await svc.ready(t.id)) {
        await svc.reportDuel(t.id, m.id, m.participantIds[0]);
      }
    }

    const st = await svc.standings(t.id);
    const champ = st[0].participantId;
    const second = st[1].participantId;
    const cb = await wallet.balanceOf(champ);
    const sb = await wallet.balanceOf(second);
    if (cb !== 1000) throw new Error(`champion balance ${cb} != 1000`);
    if (sb !== 500) throw new Error(`runner-up balance ${sb} != 500`);
    const total = (await wallet.ledger()).reduce((a, e) => a + e.amount, 0);
    if (total !== 1500) throw new Error(`total payout ${total} != 1500`);
    for (const s of st.slice(2)) {
      if ((await wallet.balanceOf(s.participantId)) !== 0) throw new Error('non-podium player was paid');
    }
    return { ...base, ok: true, champion: champ, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی ظرفیت + waitlist + انصراف. */
async function runCapacityScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 2,
    ok: false,
    champion: '',
    detail: '',
  };
  try {
    const repo = new InMemoryTournamentRepository();
    let c = 0;
    const svc = new TournamentService(repo, () => `cap${++c}`, () => '2026-01-01T00:00:00Z');
    const t = await svc.create({
      title: 'Cap Cup',
      format: 'SINGLE_ELIM',
      genre: 'DUEL',
      maxParticipants: 2,
    });
    for (let i = 0; i < 4; i++) {
      await svc.register(t.id, { id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
    }
    let rec = await svc.get(t.id);
    if (rec.participants.length !== 2) throw new Error(`confirmed ${rec.participants.length} != 2`);
    if ((rec.waitlist ?? []).length !== 2) throw new Error('waitlist != 2');

    await expectThrow(
      () => svc.register(t.id, { id: 'u1', name: 'dup', seed: 0, skill: 0.5 }),
      'duplicate registration',
    );

    // انصراف یک تأییدشده → promote اولین waitlist
    await svc.withdraw(t.id, 'u0');
    rec = await svc.get(t.id);
    if (!rec.participants.some((p) => p.id === 'u2')) throw new Error('u2 was not promoted');
    if (rec.participants.length !== 2) throw new Error('confirmed != 2 after promote');
    if ((rec.waitlist ?? []).length !== 1) throw new Error('waitlist != 1 after promote');

    // انصراف یک waitlisted
    await svc.withdraw(t.id, 'u3');
    rec = await svc.get(t.id);
    if ((rec.waitlist ?? []).length !== 0) throw new Error('waitlist != 0');

    await svc.start(t.id);
    let guard = 0;
    while ((await svc.get(t.id)).status !== 'COMPLETED') {
      if (guard++ > 100) throw new Error('did not converge');
      for (const m of await svc.ready(t.id)) await svc.reportDuel(t.id, m.id, m.participantIds[0]);
    }
    const champ = await svc.champion(t.id);
    if (!champ) throw new Error('no champion');
    return { ...base, ok: true, champion: champ, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی داوری/اعتراض: overturn ایمن در round-robin، و محافظت cascade در حذفی. */
async function runDisputeScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'ROUND_ROBIN',
    genre: 'DUEL',
    n: 3,
    ok: false,
    champion: '',
    detail: '',
  };
  const newSvc = (prefix: string): TournamentService => {
    let c = 0;
    return new TournamentService(
      new InMemoryTournamentRepository(),
      () => `${prefix}${++c}`,
      () => '2026-01-01T00:00:00Z',
    );
  };
  const mkP = (i: number) => ({ id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
  try {
    // --- round-robin: overturn حین RUNNING، قهرمان عوض می‌شود ---
    {
      const svc = newSvc('rr');
      const t = await svc.create({ title: 'RR Dispute', format: 'ROUND_ROBIN', genre: 'DUEL' });
      for (let i = 0; i < 3; i++) await svc.register(t.id, mkP(i));
      await svc.start(t.id);
      const ready = await svc.ready(t.id);
      const m01 = ready.find((m) => m.participantIds.includes('u0') && m.participantIds.includes('u1'))!;
      const m02 = ready.find((m) => m.participantIds.includes('u0') && m.participantIds.includes('u2'))!;
      await svc.reportDuel(t.id, m01.id, 'u0');
      await svc.reportDuel(t.id, m02.id, 'u0');
      await svc.resolveDispute(t.id, m01.id, 'u1'); // overturn: u1 beats u0
      const last = (await svc.ready(t.id))[0];
      await svc.reportDuel(t.id, last.id, 'u1');
      const st = await svc.standings(t.id);
      if (st[0].participantId !== 'u1') {
        throw new Error(`RR champion ${st[0].participantId} != u1 after overturn`);
      }
    }
    // --- حذفی: محافظت cascade ---
    {
      const svc = newSvc('se');
      const t = await svc.create({ title: 'SE Dispute', format: 'SINGLE_ELIM', genre: 'DUEL' });
      for (let i = 0; i < 8; i++) await svc.register(t.id, mkP(i));
      await svc.start(t.id);
      const r1 = await svc.ready(t.id);
      for (const m of r1) await svc.reportDuel(t.id, m.id, m.participantIds[0]);
      const r2 = await svc.ready(t.id);
      await svc.reportDuel(t.id, r2[0].id, r2[0].participantIds[0]);
      // overturn یک مسابقه که برنده‌اش قبلاً R2 بازی کرده → رد
      await expectThrow(
        () => svc.resolveDispute(t.id, r1[0].id, r1[0].participantIds[1]),
        'overturn after winner advanced and played',
      );
      // overturn مسابقه‌ای که برنده‌اش هنوز R2 بازی نکرده → مجاز
      await svc.resolveDispute(t.id, r1[2].id, r1[2].participantIds[1]);
      // winner نامعتبر → رد
      await expectThrow(
        () => svc.resolveDispute(t.id, r1[3].id, 'stranger'),
        'invalid dispute winner',
      );
    }
    return { ...base, ok: true, champion: 'u1', detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی اعلان‌ها: emit روی ثبت‌نام/waitlist/شروع/پایان. */
async function runNotificationScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 2,
    ok: false,
    champion: '',
    detail: '',
  };
  try {
    const repo = new InMemoryTournamentRepository();
    const notifier = new InMemoryNotificationRepository();
    let c = 0;
    const svc = new TournamentService(
      repo,
      () => `n${++c}`,
      () => '2026-01-01T00:00:00Z',
      undefined,
      notifier,
    );
    const t = await svc.create({
      title: 'Notif Cup',
      format: 'SINGLE_ELIM',
      genre: 'DUEL',
      maxParticipants: 2,
    });
    for (let i = 0; i < 3; i++) {
      await svc.register(t.id, { id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
    }
    await svc.start(t.id);
    let guard = 0;
    while ((await svc.get(t.id)).status !== 'COMPLETED') {
      if (guard++ > 100) throw new Error('did not converge');
      for (const m of await svc.ready(t.id)) await svc.reportDuel(t.id, m.id, m.participantIds[0]);
    }

    const u0 = (await notifier.forUser('u0')).map((n) => n.type);
    const u2 = (await notifier.forUser('u2')).map((n) => n.type);
    const all = await notifier.all();
    const champ = await svc.champion(t.id);
    if (!u0.includes('REGISTERED') || !u0.includes('STARTED')) {
      throw new Error('u0 missing REGISTERED/STARTED notification');
    }
    if (!u0.includes('WON') && !u0.includes('COMPLETED')) {
      throw new Error('u0 missing completion notification');
    }
    if (u2.length !== 1 || u2[0] !== 'WAITLISTED') {
      throw new Error(`u2 notifications ${JSON.stringify(u2)} != [WAITLISTED]`);
    }
    if (!(await notifier.forUser(champ ?? '')).some((n) => n.type === 'WON')) {
      throw new Error('champion did not receive WON notification');
    }
    if (all.length !== 7) throw new Error(`total notifications ${all.length} != 7`);
    return { ...base, ok: true, champion: champ ?? '', detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی لغو تورنومنت در DRAFT و RUNNING، و رد لغوِ COMPLETED. */
async function runCancelScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 2,
    ok: false,
    champion: '-',
    detail: '',
  };
  const mkP = (id: string) => ({ id, name: id, seed: 0, skill: 0.5 });
  try {
    const notifier = new InMemoryNotificationRepository();
    let c = 0;
    const svc = new TournamentService(
      new InMemoryTournamentRepository(),
      () => `x${++c}`,
      () => '2026-01-01T00:00:00Z',
      undefined,
      notifier,
    );

    // لغو در DRAFT
    const t1 = await svc.create({ title: 'Cancel Draft', format: 'SINGLE_ELIM', genre: 'DUEL' });
    await svc.register(t1.id, mkP('a'));
    await svc.register(t1.id, mkP('b'));
    await svc.cancel(t1.id);
    if ((await svc.get(t1.id)).status !== 'CANCELLED') throw new Error('draft not cancelled');
    if (!(await notifier.forUser('a')).some((n) => n.type === 'CANCELLED')) {
      throw new Error('no cancel notification');
    }
    await expectThrow(() => svc.register(t1.id, mkP('c')), 'register after cancel');
    await expectThrow(() => svc.cancel(t1.id), 'double cancel');

    // لغو در RUNNING
    const t2 = await svc.create({ title: 'Cancel Running', format: 'SINGLE_ELIM', genre: 'DUEL' });
    await svc.register(t2.id, mkP('a'));
    await svc.register(t2.id, mkP('b'));
    await svc.start(t2.id);
    await svc.cancel(t2.id);
    if ((await svc.get(t2.id)).status !== 'CANCELLED') throw new Error('running not cancelled');
    if ((await svc.ready(t2.id)).length !== 0) throw new Error('cancelled should have no ready matches');

    // لغوِ COMPLETED رد می‌شود
    const t3 = await svc.create({ title: 'Done', format: 'SINGLE_ELIM', genre: 'DUEL' });
    await svc.register(t3.id, mkP('a'));
    await svc.register(t3.id, mkP('b'));
    await svc.start(t3.id);
    for (const mm of await svc.ready(t3.id)) await svc.reportDuel(t3.id, mm.id, mm.participantIds[0]);
    await expectThrow(() => svc.cancel(t3.id), 'cancel a completed tournament');

    return { ...base, ok: true, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی تاریخچه‌ی نتایج + اسکور هر مسابقه. */
async function runResultsScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 2,
    ok: false,
    champion: '-',
    detail: '',
  };
  try {
    let c = 0;
    const svc = new TournamentService(
      new InMemoryTournamentRepository(),
      () => `res${++c}`,
      () => '2026-01-01T00:00:00Z',
    );
    const t = await svc.create({ title: 'Results', format: 'SINGLE_ELIM', genre: 'DUEL' });
    await svc.register(t.id, { id: 'a', name: 'A', seed: 0, skill: 0.5 });
    await svc.register(t.id, { id: 'b', name: 'B', seed: 0, skill: 0.5 });
    await svc.start(t.id);
    const m = (await svc.ready(t.id))[0];
    await svc.reportDuel(t.id, m.id, m.participantIds[0], '3-1');
    const res = await svc.results(t.id);
    const duel = res.find((r) => r.kind === 'DUEL');
    if (!duel || duel.kind !== 'DUEL') throw new Error('no duel result recorded');
    if (duel.score !== '3-1') throw new Error(`score ${duel.score} != 3-1`);
    if (duel.winner !== m.participantIds[0]) throw new Error('wrong winner in results');
    if (duel.source !== 'REPORT') throw new Error(`source ${duel.source} != REPORT`);
    return { ...base, ok: true, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی کاتالوگ بازی‌ها (گروه‌بندی بر اساس بازی + شمارش وضعیت). */
async function runGamesCatalogScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 0,
    ok: false,
    champion: '-',
    detail: '',
  };
  try {
    let c = 0;
    const svc = new TournamentService(
      new InMemoryTournamentRepository(),
      () => `g${++c}`,
      () => '2026-01-01T00:00:00Z',
    );
    await svc.create({ title: 'FC A', game: 'FC26', format: 'SINGLE_ELIM', genre: 'DUEL' });
    await svc.create({ title: 'FC B', game: 'FC26', format: 'ROUND_ROBIN', genre: 'DUEL' });
    await svc.create({ title: 'WZ', game: 'Warzone', format: 'FFA', genre: 'FFA' });
    await svc.create({ title: 'No game', format: 'SWISS', genre: 'DUEL' });
    const catalog = await svc.gamesCatalog();
    const fc = catalog.find((g) => g.game === 'FC26');
    if (!fc || fc.total !== 2 || fc.upcoming !== 2) throw new Error('FC26 catalog wrong');
    const wz = catalog.find((g) => g.game === 'Warzone');
    if (!wz || wz.total !== 1) throw new Error('Warzone catalog wrong');
    if (!catalog.find((g) => g.game === 'سایر')) throw new Error('uncategorized group missing');
    if (catalog[0].game !== 'FC26') throw new Error('catalog not sorted by total');
    return { ...base, ok: true, detail: 'OK' };
  } catch (e) {
    return { ...base, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** سناریوی لیگ/فصل: گروه‌بندی دو تورنومنت و رده‌بندیِ تجمعی. */
async function runSeasonScenario(): Promise<Outcome> {
  const base: Outcome = {
    format: 'SINGLE_ELIM',
    genre: 'DUEL',
    n: 4,
    ok: false,
    champion: '-',
    detail: '',
  };
  try {
    let tc = 0;
    let sc = 0;
    const tsvc = new TournamentService(
      new InMemoryTournamentRepository(),
      () => `t${++tc}`,
      () => '2026-01-01T00:00:00Z',
    );
    const ssvc = new SeasonService(new InMemorySeasonRepository(), tsvc, () => `s${++sc}`);

    const tids: string[] = [];
    for (let k = 0; k < 2; k++) {
      const t = await tsvc.create({ title: `T${k}`, format: 'SINGLE_ELIM', genre: 'DUEL' });
      for (let i = 0; i < 4; i++) {
        await tsvc.register(t.id, { id: `u${i}`, name: `P${i}`, seed: 0, skill: 0.5 });
      }
      await tsvc.start(t.id);
      let guard = 0;
      while ((await tsvc.get(t.id)).status !== 'COMPLETED') {
        if (guard++ > 100) throw new Error('did not converge');
        for (const m of await tsvc.ready(t.id)) await tsvc.reportDuel(t.id, m.id, m.participantIds[0]);
      }
      tids.push(t.id);
    }

    const season = await ssvc.create('Season 1');
    await ssvc.addTournament(season.id, tids[0]);
    await ssvc.addTournament(season.id, tids[1]);
    await ssvc.addTournament(season.id, tids[1]); // تکراری → نباید دوبار اضافه شود
    await expectThrow(() => ssvc.addTournament(season.id, 'nope'), 'add non-existent tournament');

    const st = await ssvc.standings(season.id);
    if (st.length !== 4) throw new Error(`season standings ${st.length} != 4`);
    const total = st.reduce((a, s) => a + s.points, 0);
    if (total !== 20) throw new Error(`total season points ${total} != 20 (2*(1+2+3+4))`);
    if (!st.every((s) => s.tournamentsPlayed === 2)) throw new Error('tournamentsPlayed != 2');
    if (st[0].rank !== 1 || st[0].points < st[1].points) throw new Error('season standings not ranked');
    return { ...base, ok: true, champion: st[0].participantId, detail: 'OK' };
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
  const checkIn = await runCheckInScenario();
  const prize = await runPrizeScenario();
  const capacity = await runCapacityScenario();
  const dispute = await runDisputeScenario();
  const notif = await runNotificationScenario();
  const cancel = await runCancelScenario();
  const resultsScenario = await runResultsScenario();
  const gamesCatalog = await runGamesCatalogScenario();
  const season = await runSeasonScenario();

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
  console.log(
    `\nسناریوی check-in / no-show: ${checkIn.ok ? '✅ PASS' : '❌ FAIL: ' + checkIn.detail}`,
  );
  console.log(`سناریوی پرداخت جایزه: ${prize.ok ? '✅ PASS' : '❌ FAIL: ' + prize.detail}`);
  console.log(`سناریوی ظرفیت / waitlist: ${capacity.ok ? '✅ PASS' : '❌ FAIL: ' + capacity.detail}`);
  console.log(`سناریوی اعتراض / داوری: ${dispute.ok ? '✅ PASS' : '❌ FAIL: ' + dispute.detail}`);
  console.log(`سناریوی اعلان‌ها: ${notif.ok ? '✅ PASS' : '❌ FAIL: ' + notif.detail}`);
  console.log(`سناریوی لغو: ${cancel.ok ? '✅ PASS' : '❌ FAIL: ' + cancel.detail}`);
  console.log(`سناریوی نتایج / اسکور: ${resultsScenario.ok ? '✅ PASS' : '❌ FAIL: ' + resultsScenario.detail}`);
  console.log(`سناریوی کاتالوگ بازی‌ها: ${gamesCatalog.ok ? '✅ PASS' : '❌ FAIL: ' + gamesCatalog.detail}`);
  console.log(`سناریوی لیگ / فصل: ${season.ok ? '✅ PASS' : '❌ FAIL: ' + season.detail}`);

  const passed =
    results.filter((r) => r.ok).length +
    (checkIn.ok ? 1 : 0) +
    (prize.ok ? 1 : 0) +
    (capacity.ok ? 1 : 0) +
    (dispute.ok ? 1 : 0) +
    (notif.ok ? 1 : 0) +
    (cancel.ok ? 1 : 0) +
    (resultsScenario.ok ? 1 : 0) +
    (gamesCatalog.ok ? 1 : 0) +
    (season.ok ? 1 : 0);
  const total = results.length + 9;
  console.log(`\nنتیجه: ${passed}/${total} تست پاس شد.`);
  if (passed !== total) {
    console.log('❌ بعضی تست‌ها رد شدند.');
    process.exit(1);
  }
  console.log('✅ همه‌ی تست‌ها پاس شدند.');
}

main();
