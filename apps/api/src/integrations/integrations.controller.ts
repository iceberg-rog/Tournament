import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IntegrationsService } from './integrations.service';

const READ = ['ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'SUPPORT'] as const;
const WRITE = ['ADMIN', 'MAIN_ADMIN'] as const; // super_admin/system_admin

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get(':env')
  @Roles(...READ)
  get(@Param('env') env: string) {
    return this.svc.get(env);
  }

  @Get(':env/audit')
  @Roles(...READ)
  audit(@Param('env') _env: string) {
    return this.svc.listAudit();
  }

  @Put(':env')
  @Roles(...WRITE)
  save(@Param('env') env: string, @Body() data: any, @Request() req: { user: { id: string; role: string } }) {
    return this.svc.save(env, data, req.user);
  }

  @Post(':env/audit')
  @Roles(...READ)
  logAction(
    @Param('env') env: string,
    @Body() dto: { action: string; integrationId?: string; field?: string },
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.svc.logAction(env, req.user, dto?.action ?? 'اقدام', dto?.integrationId, dto?.field);
  }
}
