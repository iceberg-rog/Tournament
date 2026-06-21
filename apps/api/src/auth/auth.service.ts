import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateBase32Secret, otpauthUri, verifyTotp } from './totp';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('این ایمیل قبلاً ثبت شده است');

    const passwordHash = await hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        wallet: { create: {} },
      },
    });
    return this.issueTokens(user.id, user.email, user.role, user.displayName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');

    const ok = await verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');

    if (user.twoFactorEnabled) {
      if (!dto.code) throw new UnauthorizedException('کد احراز هویت دومرحله‌ای لازم است');
      if (!user.twoFactorSecret || !verifyTotp(user.twoFactorSecret, dto.code)) {
        throw new UnauthorizedException('کد دومرحله‌ای نادرست است');
      }
    }

    return this.issueTokens(user.id, user.email, user.role, user.displayName);
  }

  // ───────── احراز هویت دومرحله‌ای TOTP (UC03) ─────────

  /** ساخت رمزِ مشترک و بازگرداندن otpauth URI برای اسکن (هنوز فعال نشده). */
  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const secret = generateBase32Secret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    return { secret, otpauthUri: otpauthUri(user.email, secret) };
  }

  /** فعال‌سازی پس از تأیید یک کد معتبر. */
  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new UnauthorizedException('ابتدا setup را اجرا کنید');
    if (!verifyTotp(user.twoFactorSecret, code ?? '')) {
      throw new UnauthorizedException('کد نادرست است');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { twoFactorEnabled: true };
  }

  async disable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret || !verifyTotp(user.twoFactorSecret, code ?? '')) {
      throw new UnauthorizedException('کد نادرست است');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { twoFactorEnabled: false };
  }

  // ───────── ورود اجتماعی OAuth (UC02) ─────────

  /**
   * ورود/ثبت‌نام با حساب اجتماعی. در نبودِ کلیدِ واقعیِ provider (sandbox)،
   * با ایمیلِ تأییدشده‌ی provider کاربر ساخته/متصل و توکن صادر می‌شود؛ ساختار
   * برای جریانِ واقعیِ code→token آماده است.
   */
  async oauthLogin(provider: string, email: string, displayName?: string) {
    if (!email) throw new UnauthorizedException('ایمیلِ OAuth لازم است');
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await hash(randomBytes(24).toString('hex')); // ورود فقط با OAuth
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: displayName ?? email.split('@')[0],
          oauthProvider: provider,
          wallet: { create: {} },
        },
      });
    }
    return this.issueTokens(user.id, user.email, user.role, user.displayName);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user.id, user.email, user.role, user.displayName);
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }

  private async issueTokens(
    sub: string,
    email: string,
    role: string,
    displayName: string,
  ) {
    const payload = { sub, email, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as unknown as number,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as unknown as number,
    });
    return {
      accessToken,
      refreshToken,
      user: { id: sub, email, role, displayName },
    };
  }
}
