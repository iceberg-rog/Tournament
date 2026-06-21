import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { InMemoryTournamentRepository, TournamentService } from '@tournament/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

/** Guard تستی: کاربر را از هدر x-test-user می‌سازد (جای JWT واقعی). */
class TestAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const uid = (req.headers['x-test-user'] as string) || 'admin';
    req.user = { id: uid, email: `${uid}@test.local` };
    return true;
  }
}

describe('Tournaments API (e2e, no DB)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // بدون اتصال به دیتابیس: PrismaService را با stub بی‌اثر جایگزین می‌کنیم
      .overrideProvider(PrismaService)
      .useValue({})
      // سرویس تورنومنت روی مخزن in-memory
      .overrideProvider(TournamentService)
      .useValue(new TournamentService(new InMemoryTournamentRepository(), () => randomUUID()))
      // guard تستی
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health check works', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('runs a full SINGLE_ELIM lifecycle over HTTP (4 users)', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/tournaments')
      .set('x-test-user', 'admin')
      .send({ title: 'E2E Cup', format: 'SINGLE_ELIM', genre: 'DUEL' })
      .expect(201);
    const id = created.body.id as string;
    expect(created.body.status).toBe('DRAFT');

    for (const u of ['u0', 'u1', 'u2', 'u3']) {
      await request(server)
        .post(`/api/tournaments/${id}/register`)
        .set('x-test-user', u)
        .send({ name: u })
        .expect(201);
    }

    await request(server).post(`/api/tournaments/${id}/start`).set('x-test-user', 'admin').expect(201);

    for (let guard = 0; guard < 100; guard++) {
      const t = await request(server).get(`/api/tournaments/${id}`).expect(200);
      if (t.body.status === 'COMPLETED') break;
      const ready = await request(server).get(`/api/tournaments/${id}/ready`).expect(200);
      expect(ready.body.length).toBeGreaterThan(0);
      for (const m of ready.body) {
        await request(server)
          .post(`/api/tournaments/${id}/matches/${m.id}/report`)
          .set('x-test-user', 'admin')
          .send({ winnerId: m.participantIds[0] })
          .expect(201);
      }
    }

    const standings = await request(server).get(`/api/tournaments/${id}/standings`).expect(200);
    expect(standings.body).toHaveLength(4);
    expect(standings.body[0].rank).toBe(1);

    const fin = await request(server).get(`/api/tournaments/${id}`).expect(200);
    expect(fin.body.status).toBe('COMPLETED');
  });

  it('runs an FFA (Battle Royale) lifecycle over HTTP (lobby reporting)', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post('/api/tournaments')
      .set('x-test-user', 'admin')
      .send({ title: 'BR Night', format: 'FFA', genre: 'FFA', ffaRounds: 3 })
      .expect(201);
    const id = created.body.id as string;

    for (const u of ['a', 'b', 'c', 'd', 'e']) {
      await request(server)
        .post(`/api/tournaments/${id}/register`)
        .set('x-test-user', u)
        .send({ name: u })
        .expect(201);
    }
    await request(server).post(`/api/tournaments/${id}/start`).set('x-test-user', 'admin').expect(201);

    for (let guard = 0; guard < 50; guard++) {
      const t = await request(server).get(`/api/tournaments/${id}`).expect(200);
      if (t.body.status === 'COMPLETED') break;
      const ready = await request(server).get(`/api/tournaments/${id}/ready`).expect(200);
      for (const m of ready.body) {
        await request(server)
          .post(`/api/tournaments/${id}/matches/${m.id}/report`)
          .set('x-test-user', 'admin')
          .send({ rankedIds: m.participantIds })
          .expect(201);
      }
    }

    const standings = await request(server).get(`/api/tournaments/${id}/standings`).expect(200);
    expect(standings.body).toHaveLength(5);

    const fin = await request(server).get(`/api/tournaments/${id}`).expect(200);
    expect(fin.body.status).toBe('COMPLETED');
  });

  it('rejects an invalid format (validation pipe)', async () => {
    await request(app.getHttpServer())
      .post('/api/tournaments')
      .set('x-test-user', 'admin')
      .send({ title: 'Bad', format: 'NOPE', genre: 'DUEL' })
      .expect(400);
  });

  it('enforces check-in and supports no-show over HTTP', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/api/tournaments')
      .set('x-test-user', 'admin')
      .send({ title: 'CheckIn Cup', format: 'SINGLE_ELIM', genre: 'DUEL', requireCheckIn: true })
      .expect(201);
    const id = created.body.id as string;

    for (const u of ['u0', 'u1', 'u2', 'u3']) {
      await request(server)
        .post(`/api/tournaments/${id}/register`)
        .set('x-test-user', u)
        .send({ name: u })
        .expect(201);
    }
    await request(server).post(`/api/tournaments/${id}/start`).set('x-test-user', 'admin').expect(201);

    const ready = (await request(server).get(`/api/tournaments/${id}/ready`).expect(200)).body;
    expect(ready.length).toBe(2);
    const m0 = ready[0];
    const m1 = ready[1];

    // گزارش پیش از check-in رد می‌شود
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m0.id}/report`)
      .set('x-test-user', 'admin')
      .send({ winnerId: m0.participantIds[0] })
      .expect((r) => {
        if (r.status < 400) throw new Error('expected rejection before check-in');
      });

    // هر دو check-in، سپس گزارش
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m0.id}/checkin`)
      .set('x-test-user', m0.participantIds[0])
      .expect(201);
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m0.id}/checkin`)
      .set('x-test-user', m0.participantIds[1])
      .expect(201);
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m0.id}/report`)
      .set('x-test-user', 'admin')
      .send({ winnerId: m0.participantIds[0] })
      .expect(201);

    // m1: یک طرف check-in → no-show
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m1.id}/checkin`)
      .set('x-test-user', m1.participantIds[0])
      .expect(201);
    await request(server)
      .post(`/api/tournaments/${id}/matches/${m1.id}/no-show`)
      .set('x-test-user', m1.participantIds[0])
      .expect(201);

    // اتمام فینال
    for (let g = 0; g < 20; g++) {
      const t = (await request(server).get(`/api/tournaments/${id}`).expect(200)).body;
      if (t.status === 'COMPLETED') break;
      const r = (await request(server).get(`/api/tournaments/${id}/ready`).expect(200)).body;
      for (const m of r) {
        for (const p of m.participantIds) {
          await request(server)
            .post(`/api/tournaments/${id}/matches/${m.id}/checkin`)
            .set('x-test-user', p)
            .expect(201);
        }
        await request(server)
          .post(`/api/tournaments/${id}/matches/${m.id}/report`)
          .set('x-test-user', 'admin')
          .send({ winnerId: m.participantIds[0] })
          .expect(201);
      }
    }
    const fin = (await request(server).get(`/api/tournaments/${id}`).expect(200)).body;
    expect(fin.status).toBe('COMPLETED');
  });
});
