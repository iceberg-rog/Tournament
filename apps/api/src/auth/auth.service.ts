import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
