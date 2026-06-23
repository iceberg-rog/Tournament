import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizerRequestsService, SubmitInput } from './organizer-requests.service';

const STAFF = ['ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN'] as const;

@Controller('organizer-requests')
@UseGuards(JwtAuthGuard)
export class OrganizerRequestsController {
  constructor(private readonly svc: OrganizerRequestsService) {}

  /** کاربرِ واردشده درخواستِ همکاری می‌فرستد. */
  @Post()
  submit(@Request() req: { user: { id: string } }, @Body() dto: SubmitInput) {
    return this.svc.submit(req.user.id, dto);
  }

  /** وضعیتِ درخواستِ خودِ کاربر. */
  @Get('mine')
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.mine(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(...STAFF, 'SUPPORT')
  list(@Query('status') status?: string) {
    return this.svc.list(status);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(...STAFF)
  approve(@Param('id') id: string, @Request() req: { user: { id: string; role: string } }) {
    return this.svc.approve(id, req.user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(...STAFF)
  reject(@Param('id') id: string, @Request() req: { user: { id: string; role: string } }, @Body() dto: { reason: string }) {
    return this.svc.reject(id, req.user, dto?.reason ?? '');
  }

  @Post(':id/request-info')
  @UseGuards(RolesGuard)
  @Roles(...STAFF)
  requestInfo(@Param('id') id: string, @Request() req: { user: { id: string; role: string } }) {
    return this.svc.requestInfo(id, req.user);
  }
}
