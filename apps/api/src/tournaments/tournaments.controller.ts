import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TournamentService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTournamentDto, RegisterDto, ReportDto } from './dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly svc: TournamentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto) {
    return this.svc.create({
      title: dto.title,
      format: dto.format,
      genre: dto.genre,
      ffaRounds: dto.ffaRounds,
      swissRounds: dto.swissRounds,
      requireCheckIn: dto.requireCheckIn,
      maxParticipants: dto.maxParticipants,
    });
  }

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  register(
    @Param('id') id: string,
    @Request() req: { user: { id: string; email: string } },
    @Body() body: RegisterDto,
  ) {
    return this.svc.register(id, {
      id: req.user.id,
      name: body.name ?? req.user.email,
      seed: 0,
      skill: 0,
    });
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  start(@Param('id') id: string) {
    return this.svc.start(id);
  }

  @Post(':id/withdraw')
  @UseGuards(JwtAuthGuard)
  withdraw(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.svc.withdraw(id, req.user.id);
  }

  @Get(':id/ready')
  ready(@Param('id') id: string) {
    return this.svc.ready(id);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.standings(id);
  }

  @Post(':id/matches/:matchId/report')
  @UseGuards(JwtAuthGuard)
  report(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: ReportDto,
  ) {
    if (dto.rankedIds && dto.rankedIds.length > 0) {
      return this.svc.reportLobby(id, matchId, dto.rankedIds);
    }
    if (!dto.winnerId) {
      throw new BadRequestException('winnerId (DUEL) or rankedIds (LOBBY) is required');
    }
    return this.svc.reportDuel(id, matchId, dto.winnerId);
  }

  @Post(':id/matches/:matchId/checkin')
  @UseGuards(JwtAuthGuard)
  checkin(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.svc.checkIn(id, matchId, req.user.id);
  }

  @Post(':id/matches/:matchId/no-show')
  @UseGuards(JwtAuthGuard)
  noShow(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.svc.declareNoShow(id, matchId, req.user.id);
  }
}
