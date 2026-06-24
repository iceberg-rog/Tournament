import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OpsService } from './ops.service';
import { OPS_SLICES } from './ops.repository';

type Req = { user: { id: string; role?: string; email?: string } };
const actorOf = (req: Req) => ({ id: req.user.id, role: req.user.role ?? 'ADMIN' });
function assertSlice(slice: string) {
  if (!(OPS_SLICES as readonly string[]).includes(slice)) throw new BadRequestException(`sliceِ ناشناخته: ${slice}`);
}

/**
 * عملیاتِ تورنومنت — persistِ سمتِ سرور.
 * فقط کارکنانِ عملیاتیِ SHELTER. مسیرها under /tournaments/:id/ops.
 */
@Controller('tournaments/:id/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'REFEREE')
export class OpsController {
  constructor(private readonly svc: OpsService) {}

  // ── وضعیتِ کامل ──
  @Get()
  getState(@Param('id') id: string) {
    return this.svc.getState(id);
  }

  // ── persistِ خامِ slice (swap برای localStorage فرانت) ──
  @Get('slice/:slice')
  getSlice(@Param('id') id: string, @Param('slice') slice: string) {
    assertSlice(slice);
    return this.svc.getSlice(id, slice);
  }

  @Put('slice/:slice')
  putSlice(@Param('id') id: string, @Param('slice') slice: string, @Body() body: { data: unknown }) {
    assertSlice(slice);
    // فرمِ پاکت‌بندی‌شده { data } الزامی؛ صریح می‌گیریم تا null/false/0 و مقادیرِ
    // شیء‌مانند درست round-trip شوند (نه nullish-coalescing).
    const value = body && typeof body === 'object' && 'data' in body ? body.data : body;
    return this.svc.putSlice(id, slice, value);
  }

  // ── activity ──
  @Get('activity')
  activity(@Param('id') id: string) {
    return this.svc.listActivity(id);
  }

  @Post('activity')
  addActivity(@Param('id') id: string, @Body() body: { kind: string; summary: string; entityType?: string; entityId?: string }, @Request() req: Req) {
    return this.svc.appendActivity(id, { ...body, actor: req.user.id });
  }

  // ── endpointهای معنایی ──
  @Patch('participants/:pid')
  patchParticipant(@Param('id') id: string, @Param('pid') pid: string, @Body() patch: unknown, @Request() req: Req) {
    return this.svc.patchParticipant(id, pid, patch, actorOf(req));
  }

  @Post('disputes/:did/decision')
  disputeDecision(@Param('id') id: string, @Param('did') did: string, @Body() body: { status: string; resolution?: string }, @Request() req: Req) {
    return this.svc.disputeDecision(id, did, body, actorOf(req));
  }

  @Post('chat/messages')
  addChatMessage(@Param('id') id: string, @Body() msg: { id: string; author: string; role: string; text: string; at: string }, @Request() req: Req) {
    return this.svc.addChatMessage(id, msg, actorOf(req));
  }

  @Post('schedule/:round')
  setSchedule(@Param('id') id: string, @Param('round') round: string, @Body() patch: unknown, @Request() req: Req) {
    return this.svc.setSchedulePatch(id, Number(round), patch, actorOf(req));
  }
}
