import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ModerationService, ReportAction, ReportCategory } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** گزارش تخلف (UC27) و رسیدگی (UC18). */
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly svc: ModerationService) {}

  @Post()
  file(
    @Request() req: { user: { id: string } },
    @Body()
    dto: { targetUserId?: string; tournamentId?: string; category: ReportCategory; reason: string },
  ) {
    return this.svc.file(req.user.id, {
      targetUserId: dto.targetUserId,
      tournamentId: dto.tournamentId,
      category: dto.category ?? 'OTHER',
      reason: dto.reason ?? '',
    });
  }

  @Get('open')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'REFEREE', 'GAME_ADMIN')
  open() {
    return this.svc.listOpen();
  }

  @Get('flags/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'REFEREE', 'GAME_ADMIN')
  flags(@Param('userId') userId: string) {
    return this.svc.flagsForUser(userId);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'REFEREE', 'GAME_ADMIN')
  resolve(@Param('id') id: string, @Body() dto: { action: ReportAction; resolution: string }) {
    return this.svc.resolve(id, dto.action ?? 'NONE', dto.resolution ?? '');
  }

  @Post(':id/dismiss')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'REFEREE', 'GAME_ADMIN')
  dismiss(@Param('id') id: string, @Body() dto: { resolution: string }) {
    return this.svc.dismiss(id, dto.resolution ?? '');
  }
}
