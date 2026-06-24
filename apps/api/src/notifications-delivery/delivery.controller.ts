import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DeliveryService, type CreateNotification } from './delivery.service';

@Controller('notifications-delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'REFEREE')
export class DeliveryController {
  constructor(private readonly svc: DeliveryService) {}

  @Post()
  create(@Body() body: CreateNotification) {
    return this.svc.create(body);
  }

  @Get()
  list(@Query('tournamentId') tournamentId?: string, @Query('userId') userId?: string) {
    return this.svc.list({ tournamentId, userId });
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.svc.retry(id);
  }
}
