import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StreamingService } from './streaming.service';

type Req = { user: { id: string; role?: string } };
const actorOf = (req: Req) => ({ id: req.user.id, role: req.user.role ?? 'ADMIN' });

/** کنترلِ استریم — کارکنانِ عملیاتی. */
@Controller('tournaments/:id/stream')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'REFEREE')
export class StreamingController {
  constructor(private readonly svc: StreamingService) {}

  @Get()
  state(@Param('id') id: string) {
    return this.svc.state(id);
  }

  @Post(':matchId/start')
  start(@Param('id') id: string, @Param('matchId') matchId: string, @Body() body: { caster?: string; visibility?: string }, @Request() req: Req) {
    return this.svc.start(id, matchId, body ?? {}, actorOf(req));
  }

  @Post(':matchId/stop')
  stop(@Param('id') id: string, @Param('matchId') matchId: string, @Request() req: Req) {
    return this.svc.stop(id, matchId, actorOf(req));
  }
}

/** صفحه‌ی پخشِ عمومی — بدونِ احرازِ هویت. */
@Controller('public/tournaments/:id/live')
export class PublicStreamController {
  constructor(private readonly svc: StreamingService) {}

  @Get()
  live(@Param('id') id: string) {
    return this.svc.publicLive(id);
  }
}
