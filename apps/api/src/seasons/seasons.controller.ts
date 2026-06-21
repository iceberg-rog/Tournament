import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SeasonService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly svc: SeasonService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: { title: string }) {
    return this.svc.create(dto.title);
  }

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/tournaments')
  @UseGuards(JwtAuthGuard)
  addTournament(@Param('id') id: string, @Body() dto: { tournamentId: string }) {
    return this.svc.addTournament(id, dto.tournamentId);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.standings(id);
  }
}
