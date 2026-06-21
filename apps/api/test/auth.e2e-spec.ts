import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';

/** Prisma جعلی in-memory برای تست واحدِ AuthService (بدون دیتابیس). */
function fakePrisma() {
  const users: any[] = [];
  return {
    user: {
      findUnique: async ({ where }: any) =>
        users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null,
      create: async ({ data }: any) => {
        const u = { id: `id-${users.length}`, role: 'USER', ...data };
        users.push(u);
        return u;
      },
    },
  };
}

describe('AuthService (unit, no DB)', () => {
  let auth: AuthService;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    auth = new AuthService(fakePrisma() as any, new JwtService({}));
  });

  it('registers a user and returns tokens', async () => {
    const res = await auth.register({ email: 'ali@test.local', password: 'password123', displayName: 'Ali' });
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshToken).toBeTruthy();
    expect(res.user.email).toBe('ali@test.local');
    expect(res.user.displayName).toBe('Ali');
  });

  it('logs in with correct credentials', async () => {
    const res = await auth.login({ email: 'ali@test.local', password: 'password123' });
    expect(res.accessToken).toBeTruthy();
    expect(res.user.email).toBe('ali@test.local');
  });

  it('rejects a duplicate email', async () => {
    await expect(
      auth.register({ email: 'ali@test.local', password: 'password123', displayName: 'X' }),
    ).rejects.toThrow();
  });

  it('rejects a wrong password', async () => {
    await expect(auth.login({ email: 'ali@test.local', password: 'wrong-password' })).rejects.toThrow();
  });

  it('rejects login for an unknown email', async () => {
    await expect(auth.login({ email: 'nobody@test.local', password: 'password123' })).rejects.toThrow();
  });

  it('issues fresh tokens from a valid refresh token', async () => {
    const reg = await auth.register({ email: 'r@test.local', password: 'password123', displayName: 'R' });
    const refreshed = await auth.refresh(reg.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.user.email).toBe('r@test.local');
  });

  it('rejects an invalid refresh token', async () => {
    await expect(auth.refresh('not-a-real-token')).rejects.toThrow();
  });
});
