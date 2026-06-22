import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { TournamentService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** آمار تجمیعیِ کاربرِ جاری برای داشبورد (UC22). */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly svc: TournamentService) {}

  @Get('stats')
  stats(@Request() req: { user: { id: string } }) {
    return this.svc.userStats(req.user.id);
  }
}
