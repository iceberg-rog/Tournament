import { AuditService } from '../src/audit/audit.service';
import { OrganizerRequestsService } from '../src/organizer-requests/organizer-requests.service';

/** Prisma جعلیِ in-memory — بدونِ دیتابیس (هم‌سبکِ auth.e2e-spec). */
function fakePrisma() {
  const reqs: any[] = [];
  const users: any[] = [{ id: 'u1', role: 'USER' }];
  const audits: any[] = [];
  let n = 0;
  const match = (where: any, r: any) =>
    Object.entries(where ?? {}).every(([k, v]: any) => {
      if (v && typeof v === 'object' && 'in' in v) return v.in.includes(r[k]);
      return r[k] === v;
    });
  return {
    _reqs: reqs,
    _users: users,
    _audits: audits,
    organizerRequest: {
      create: async ({ data }: any) => {
        const r = { id: `or-${n++}`, createdAt: new Date(), updatedAt: new Date(), reviewerId: null, decisionReason: null, ...data };
        reqs.push(r);
        return r;
      },
      findFirst: async ({ where }: any) => {
        const f = reqs.filter((r) => match(where, r));
        return f[f.length - 1] ?? null;
      },
      findUnique: async ({ where }: any) => reqs.find((r) => r.id === where.id) ?? null,
      findMany: async ({ where }: any) => reqs.filter((r) => match(where, r)),
      update: async ({ where, data }: any) => {
        const r = reqs.find((x) => x.id === where.id);
        Object.assign(r, data);
        return r;
      },
    },
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) ?? null,
      update: async ({ where, data }: any) => {
        const u = users.find((x) => x.id === where.id);
        Object.assign(u, data);
        return u;
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        const a = { id: `a-${n++}`, createdAt: new Date(), ...data };
        audits.push(a);
        return a;
      },
      findMany: async ({ where }: any) => audits.filter((a) => match(where, a)),
    },
  };
}

const REVIEWER = { id: 'admin1', role: 'ADMIN' };

describe('OrganizerRequestsService (unit, no DB)', () => {
  it('submits a request with status submitted', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    const r = await svc.submit('u1', { org: 'Nova', contact: 'n@x.com', reason: 'لیگ' });
    expect(r.status).toBe('submitted');
    expect(r.org).toBe('Nova');
  });

  it('rejects a duplicate open request', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    await svc.submit('u1', { org: 'Nova', contact: 'n@x.com', reason: 'لیگ' });
    await expect(svc.submit('u1', { org: 'Nova2', contact: 'n@x.com', reason: 'x' })).rejects.toThrow();
  });

  it('requires org/contact/reason', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    await expect(svc.submit('u1', { org: '', contact: '', reason: '' } as any)).rejects.toThrow();
  });

  it('approve sets approved, promotes user to ORGANIZER, writes audit', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    const r = await svc.submit('u1', { org: 'Nova', contact: 'n@x.com', reason: 'لیگ' });
    const updated = await svc.approve(r.id, REVIEWER);
    expect(updated.status).toBe('approved');
    expect(prisma._users.find((u: any) => u.id === 'u1').role).toBe('ORGANIZER');
    expect(prisma._audits.length).toBe(1);
    expect(prisma._audits[0].entityType).toBe('organizer_request');
  });

  it('reject requires a reason and sets rejected + audit', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    const r = await svc.submit('u1', { org: 'Nova', contact: 'n@x.com', reason: 'لیگ' });
    await expect(svc.reject(r.id, REVIEWER, '')).rejects.toThrow();
    const updated = await svc.reject(r.id, REVIEWER, 'مدارک ناقص');
    expect(updated.status).toBe('rejected');
    expect(updated.decisionReason).toBe('مدارک ناقص');
    expect(prisma._audits.length).toBe(1);
  });

  it('list filters by status; mine returns latest', async () => {
    const prisma = fakePrisma();
    const svc = new OrganizerRequestsService(prisma as any, new AuditService(prisma as any));
    const a = await svc.submit('u1', { org: 'A', contact: 'a@x.com', reason: 'x' });
    await svc.approve(a.id, REVIEWER);
    prisma._users.push({ id: 'u2', role: 'USER' });
    await svc.submit('u2', { org: 'B', contact: 'b@x.com', reason: 'y' });
    expect((await svc.list('submitted')).length).toBe(1);
    expect((await svc.list()).length).toBe(2);
    expect((await svc.mine('u1'))!.org).toBe('A');
  });
});

describe('AuditService (unit, no DB)', () => {
  it('logs an entry and serializes before/after', async () => {
    const prisma = fakePrisma();
    const audit = new AuditService(prisma as any);
    await audit.log({ actorId: 'admin1', actorRole: 'ADMIN', action: 'تست', entityType: 'tournament', entityId: 't1', before: { s: 'a' }, after: { s: 'b' } });
    expect(prisma._audits.length).toBe(1);
    expect(typeof prisma._audits[0].before).toBe('string');
    expect(JSON.parse(prisma._audits[0].after).s).toBe('b');
  });

  it('lists with entity filter', async () => {
    const prisma = fakePrisma();
    const audit = new AuditService(prisma as any);
    await audit.log({ actorId: 'a', actorRole: 'ADMIN', action: 'x', entityType: 'tournament', entityId: 't1' });
    await audit.log({ actorId: 'a', actorRole: 'ADMIN', action: 'y', entityType: 'user', entityId: 'u9' });
    expect((await audit.list({ entityType: 'tournament' })).length).toBe(1);
    expect((await audit.list()).length).toBe(2);
  });
});
