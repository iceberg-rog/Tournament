import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { KycService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** احراز هویت KYC (UC30). کاربر ثبت می‌کند؛ مدیر تأیید/رد می‌کند. */
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly svc: KycService) {}

  @Post()
  submit(
    @Request() req: { user: { id: string } },
    @Body() dto: { fullName: string; nationalId: string },
  ) {
    return this.svc.submit(req.user.id, dto.fullName ?? '', dto.nationalId ?? '');
  }

  @Get()
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.get(req.user.id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  pending() {
    return this.svc.listPending();
  }

  @Post(':userId/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  approve(@Param('userId') userId: string) {
    return this.svc.approve(userId);
  }

  @Post(':userId/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  reject(@Param('userId') userId: string, @Body() dto: { reason?: string }) {
    return this.svc.reject(userId, dto.reason ?? 'رد شد');
  }
}
