import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { LadderService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ladders')
export class LaddersController {
  constructor(private readonly svc: LadderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: { title: string }) {
    return this.svc.createLadder(dto.title);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.standings(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.svc.join(id, req.user.id);
  }

  @Post(':id/matchmake')
  @UseGuards(JwtAuthGuard)
  matchmake(@Param('id') id: string) {
    return this.svc.matchmake(id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  report(@Param('id') id: string, @Body() dto: { a: string; b: string; winnerId: string }) {
    return this.svc.reportMatch(id, dto.a, dto.b, dto.winnerId);
  }
}
