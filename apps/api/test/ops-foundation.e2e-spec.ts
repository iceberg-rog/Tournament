import { PrismaOpsRepository } from '../src/tournament-ops/ops.repository';
import { ActivityService } from '../src/tournament-ops/activity.service';
import { OpsService } from '../src/tournament-ops/ops.service';
import { AuditService } from '../src/audit/audit.service';
import { DeliveryService } from '../src/notifications-delivery/delivery.service';
import { DeliveryDispatcher } from '../src/notifications-delivery/delivery.adapter';
import { StreamingService } from '../src/streaming/streaming.service';
import { MockStreamAdapter } from '../src/streaming/stream.adapter';

function fakePrisma() {
  const ops: any[] = [];
  const activity: any[] = [];
  const audit: any[] = [];
  const notif: any[] = [];
  const stream: any[] = [];
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;
  return {
    _ops: ops,
    _activity: activity,
    _audit: audit,
    _notif: notif,
    _stream: stream,
    opsState: {
      findUnique: async ({ where }: any) => ops.find((r) => r.tournamentId === where.tournamentId_slice.tournamentId && r.slice === where.tournamentId_slice.slice) ?? null,
      findMany: async ({ where }: any) => ops.filter((r) => (where?.tournamentId ? r.tournamentId === where.tournamentId : true) && (where?.slice ? r.slice === where.slice : true)),
      upsert: async ({ where, create, update }: any) => {
        const w = where.tournamentId_slice;
        const i = ops.findIndex((r) => r.tournamentId === w.tournamentId && r.slice === w.slice);
        if (i >= 0) { ops[i] = { ...ops[i], ...update, updatedAt: new Date() }; return ops[i]; }
        const row = { id: id('ops'), ...create, updatedAt: new Date() }; ops.push(row); return row;
      },
    },
    activityEvent: {
      create: async ({ data }: any) => { const r = { id: id('act'), createdAt: new Date(), ...data }; activity.push(r); return r; },
      findMany: async ({ where }: any) => activity.filter((r) => r.tournamentId === where.tournamentId),
    },
    auditLog: {
      create: async ({ data }: any) => { const r = { id: id('aud'), createdAt: new Date(), ...data }; audit.push(r); return r; },
      findMany: async ({ where }: any) => audit.filter((r) => (where?.entityType ? r.entityType === where.entityType : true) && (where?.entityId ? r.entityId === where.entityId : true)),
    },
    notificationDelivery: {
      create: async ({ data }: any) => { const r = { id: id('ntf'), createdAt: new Date(), retries: 0, sentAt: null, readAt: null, error: null, ...data }; notif.push(r); return r; },
      findUnique: async ({ where }: any) => notif.find((r) => r.id === where.id) ?? null,
      findMany: async ({ where }: any) => notif.filter((r) => {
        if (where?.status && r.status !== where.status) return false;
        if (where?.tournamentId && r.tournamentId !== where.tournamentId) return false;
        if (where?.sendAt?.lte && !(r.sendAt <= where.sendAt.lte)) return false;
        if (where?.retries?.lt !== undefined && !(r.retries < where.retries.lt)) return false;
        return true;
      }),
      update: async ({ where, data }: any) => {
        const r = notif.find((x) => x.id === where.id);
        for (const [k, v] of Object.entries<any>(data)) r[k] = v && typeof v === 'object' && 'increment' in v ? r[k] + v.increment : v;
        return r;
      },
    },
    streamSessionRow: {
      findMany: async ({ where }: any) => stream.filter((r) => r.tournamentId === where.tournamentId && (where.status ? r.status === where.status : true) && (where.visibility ? r.visibility === where.visibility : true)),
      findUnique: async ({ where }: any) => { const w = where.tournamentId_matchId; return stream.find((r) => r.tournamentId === w.tournamentId && r.matchId === w.matchId) ?? null; },
      update: async ({ where, data }: any) => { const w = where.tournamentId_matchId; const r = stream.find((x) => x.tournamentId === w.tournamentId && x.matchId === w.matchId); Object.assign(r, data); return r; },
      upsert: async ({ where, create, update }: any) => {
        const w = where.tournamentId_matchId;
        const i = stream.findIndex((r) => r.tournamentId === w.tournamentId && r.matchId === w.matchId);
        if (i >= 0) { stream[i] = { ...stream[i], ...update }; return stream[i]; }
        const row = { id: id('str'), ...create }; stream.push(row); return row;
      },
    },
  } as any;
}

const ACTOR = { id: 'admin-1', role: 'ADMIN' };

describe('Tournament Ops persistence', () => {
  it('persists a slice and reads it back', async () => {
    const p = fakePrisma();
    const svc = new OpsService(new PrismaOpsRepository(p), new ActivityService(p), new AuditService(p));
    await svc.putSlice('t7', 'chat-messages', [{ id: 'm1', text: 'hi' }]);
    const rec = await svc.getSlice('t7', 'chat-messages');
    expect((rec!.data as any[])[0].text).toBe('hi');
  });

  it('dispute decision writes slice + activity + audit together', async () => {
    const p = fakePrisma();
    const svc = new OpsService(new PrismaOpsRepository(p), new ActivityService(p), new AuditService(p));
    await svc.disputeDecision('t7', 'd1', { status: 'resolved', resolution: 'به‌نفعِ Messi' }, ACTOR);
    const rec = await svc.getSlice('t7', 'dispute-status');
    expect((rec!.data as any).d1.status).toBe('resolved');
    expect(p._activity.length).toBe(1);
    expect(p._audit.length).toBe(1);
    expect(p._audit[0].action).toContain('اختلاف');
  });

  it('getState assembles slices + activity', async () => {
    const p = fakePrisma();
    const svc = new OpsService(new PrismaOpsRepository(p), new ActivityService(p), new AuditService(p));
    await svc.putSlice('t7', 'announcements', [{ id: 'a1' }]);
    await svc.appendActivity('t7', { kind: 'admin', summary: 'x' });
    const state = await svc.getState('t7');
    expect(state.slices['announcements']).toBeTruthy();
    expect(state.activity.length).toBe(1);
  });
});

describe('Notification delivery', () => {
  it('in-app delivers immediately (sent)', async () => {
    const p = fakePrisma();
    const svc = new DeliveryService(p, new DeliveryDispatcher());
    const r = await svc.create({ tournamentId: 't7', channel: 'in_app', title: 'x', userId: 'u1' });
    expect(r!.status).toBe('sent');
    expect(r!.sentAt).toBeTruthy();
  });

  it('email with no recipient fails then can be marked, retried capped', async () => {
    const p = fakePrisma();
    const svc = new DeliveryService(p, new DeliveryDispatcher());
    const r = await svc.create({ tournamentId: 't7', channel: 'email', title: 'x' }); // no userId
    expect(r!.status).toBe('failed');
    expect(r!.retries).toBe(1);
    await svc.retry(r!.id); // 2
    await svc.retry(r!.id); // 3
    const capped = await svc.retry(r!.id); // no more
    expect(capped!.retries).toBeLessThanOrEqual(3);
  });

  it('processDue delivers scheduled-in-past', async () => {
    const p = fakePrisma();
    const svc = new DeliveryService(p, new DeliveryDispatcher());
    await svc.create({ tournamentId: 't7', channel: 'in_app', userId: 'u1', sendAt: new Date(Date.now() - 1000).toISOString() });
    const past = p._notif[0];
    // create() already delivered it because sendAt<=now; force a scheduled one:
    await p.notificationDelivery.create({ data: { tournamentId: 't7', channel: 'in_app', userId: 'u2', status: 'scheduled', sendAt: new Date(Date.now() - 5000) } });
    const res = await svc.processDue();
    expect(res.delivered).toBeGreaterThanOrEqual(1);
    expect(past.status).toBe('sent');
  });

  it('markRead sets read status', async () => {
    const p = fakePrisma();
    const svc = new DeliveryService(p, new DeliveryDispatcher());
    const r = await svc.create({ tournamentId: 't7', channel: 'in_app', userId: 'u1' });
    const read = await svc.markRead(r!.id);
    expect(read!.status).toBe('read');
    expect(read!.readAt).toBeTruthy();
  });
});

describe('Streaming', () => {
  it('start persists a live session + audit + activity, stop ends it', async () => {
    const p = fakePrisma();
    const stream = new StreamingService(p, new ActivityService(p), new AuditService(p), new MockStreamAdapter());
    const started = await stream.start('t7', 'fc-r3m1', { caster: 'ArashTV' }, ACTOR);
    expect(started.status).toBe('live');
    expect(started.viewers).toBeGreaterThan(0);
    expect(started.playbackUrl).toContain('t7');
    expect(p._audit.some((a: any) => a.action === 'شروعِ استریم')).toBe(true);

    const state = await stream.state('t7');
    expect(state.liveCount).toBe(1);

    const stopped = await stream.stop('t7', 'fc-r3m1', ACTOR);
    expect(stopped!.status).toBe('ended');
    expect(stopped!.viewers).toBe(0);
    const after = await stream.state('t7');
    expect(after.liveCount).toBe(0);
  });

  it('publicLive only returns public live sessions', async () => {
    const p = fakePrisma();
    const stream = new StreamingService(p, new ActivityService(p), new AuditService(p), new MockStreamAdapter());
    await stream.start('t7', 'm1', { visibility: 'public' }, ACTOR);
    await stream.start('t7', 'm2', { visibility: 'admins' }, ACTOR);
    const pub = await stream.publicLive('t7');
    expect(pub.live.length).toBe(1);
    expect(pub.live[0].matchId).toBe('m1');
  });
});
