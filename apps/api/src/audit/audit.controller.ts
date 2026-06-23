import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';

/** گزارشِ ممیزی — فقط برای کارکنانِ SHELTER. */
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'SUPPORT')
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.svc.list({ entityType, entityId, actorId });
  }
}
