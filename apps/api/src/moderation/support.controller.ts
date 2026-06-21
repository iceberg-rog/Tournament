import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SupportService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const STAFF = ['ADMIN', 'SUPPORT'];

/** تیکت پشتیبانی (UC26). */
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  @Post()
  open(
    @Request() req: { user: { id: string } },
    @Body() dto: { subject: string; text: string },
  ) {
    return this.svc.open(req.user.id, dto.subject ?? '', dto.text ?? '');
  }

  @Get()
  mine(@Request() req: { user: { id: string } }) {
    return this.svc.listForUser(req.user.id);
  }

  @Get('open')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  openList() {
    return this.svc.listOpen();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/reply')
  reply(
    @Request() req: { user: { id: string; role: string } },
    @Param('id') id: string,
    @Body() dto: { text: string },
  ) {
    return this.svc.reply(id, req.user.id, dto.text ?? '', STAFF.includes(req.user.role));
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPPORT')
  close(@Param('id') id: string) {
    return this.svc.close(id);
  }
}
