import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ControlBoardService } from './control-board.service';

/** اتاقِ کنترل — فقط کارکنانِ عملیاتیِ SHELTER. */
@Controller('control-board')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN', 'REFEREE')
export class ControlBoardController {
  constructor(private readonly svc: ControlBoardService) {}

  @Get(':tournamentId')
  get(@Param('tournamentId') tournamentId: string) {
    return this.svc.get(tournamentId);
  }

  @Put(':tournamentId')
  save(@Param('tournamentId') tournamentId: string, @Body() core: any) {
    return this.svc.save(tournamentId, core);
  }

  @Delete(':tournamentId')
  remove(@Param('tournamentId') tournamentId: string) {
    return this.svc.remove(tournamentId);
  }
}
