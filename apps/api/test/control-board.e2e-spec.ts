import { ControlBoardService } from '../src/control-board/control-board.service';

function fakePrisma() {
  const rows: any[] = [];
  return {
    _rows: rows,
    controlBoard: {
      findUnique: async ({ where }: any) => rows.find((r) => r.tournamentId === where.tournamentId) ?? null,
      upsert: async ({ where, create, update }: any) => {
        const i = rows.findIndex((r) => r.tournamentId === where.tournamentId);
        if (i >= 0) {
          rows[i] = { ...rows[i], ...update };
          return rows[i];
        }
        const row = { id: `cb-${rows.length}`, ...create };
        rows.push(row);
        return row;
      },
      deleteMany: async ({ where }: any) => {
        const before = rows.length;
        for (let i = rows.length - 1; i >= 0; i--) if (rows[i].tournamentId === where.tournamentId) rows.splice(i, 1);
        return { count: before - rows.length };
      },
    },
  };
}

const CORE = {
  tournamentId: 't1',
  title: 'Valorant Champions Arena',
  game: 'Valorant',
  format: 'single_elimination',
  prize: 50000000,
  phase: 'dispute_review',
  currentRound: 2,
  totalRounds: 3,
  roundName: 'نیمه‌نهایی',
  participants: [{ id: 'p-echo', name: 'Echo' }],
  matches: [{ id: 'm4', number: 4, status: 'disputed' }],
  disputes: [{ id: 'd1', matchId: 'm4', status: 'open' }],
  activity: [{ id: 'a1', kind: 'dispute', text: '...', at: '2026-06-23T00:00:00Z' }],
};

describe('ControlBoardService (unit, no DB)', () => {
  it('returns null when no board exists', async () => {
    const svc = new ControlBoardService(fakePrisma() as any);
    expect(await svc.get('t1')).toBeNull();
  });

  it('saves then reads the core back', async () => {
    const svc = new ControlBoardService(fakePrisma() as any);
    const saved = await svc.save('t1', CORE);
    expect(saved.phase).toBe('dispute_review');
    const got: any = await svc.get('t1');
    expect(got.matches[0].id).toBe('m4');
    expect(got.disputes[0].status).toBe('open');
    expect(got.currentRound).toBe(2);
  });

  it('upsert overwrites an existing board (resolve dispute persists)', async () => {
    const prisma = fakePrisma();
    const svc = new ControlBoardService(prisma as any);
    await svc.save('t1', CORE);
    await svc.save('t1', { ...CORE, phase: 'round_active', disputes: [{ id: 'd1', matchId: 'm4', status: 'resolved' }] });
    const got: any = await svc.get('t1');
    expect(prisma._rows.length).toBe(1);
    expect(got.phase).toBe('round_active');
    expect(got.disputes[0].status).toBe('resolved');
  });

  it('removes a board', async () => {
    const svc = new ControlBoardService(fakePrisma() as any);
    await svc.save('t1', CORE);
    await svc.remove('t1');
    expect(await svc.get('t1')).toBeNull();
  });
});
