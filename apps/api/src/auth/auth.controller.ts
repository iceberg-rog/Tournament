import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  /** ورود اجتماعی (UC02). در sandbox، ایمیلِ provider را می‌پذیرد و توکن صادر می‌کند. */
  @Post('oauth/:provider')
  oauth(@Param('provider') provider: string, @Body() dto: { email: string; displayName?: string }) {
    return this.auth.oauthLogin(provider, dto.email, dto.displayName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  setup2fa(@Request() req: { user: { id: string } }) {
    return this.auth.setup2fa(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  enable2fa(@Request() req: { user: { id: string } }, @Body() dto: { code: string }) {
    return this.auth.enable2fa(req.user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  disable2fa(@Request() req: { user: { id: string } }, @Body() dto: { code: string }) {
    return this.auth.disable2fa(req.user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: { user: unknown }) {
    return req.user;
  }
}
