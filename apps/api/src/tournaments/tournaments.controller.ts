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
import { RatingService, TournamentService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto, RegisterDto, ReportDto } from './dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly svc: TournamentService,
    private readonly ratings: RatingService,
    private readonly prisma: PrismaService,
  ) {}

  // ───────── چت زنده‌ی تورنومنت (UC17) ─────────
  @Get(':id/chat')
  chat(@Param('id') id: string) {
    return this.prisma.chatMessage.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  postChat(
    @Param('id') id: string,
    @Request() req: { user: { id: string; email: string } },
    @Body() dto: { text: string },
  ) {
    if (!dto.text || dto.text.trim().length === 0) {
      throw new BadRequestException('متن پیام خالی است');
    }
    return this.prisma.chatMessage.create({
      data: {
        tournamentId: id,
        userId: req.user.id,
        displayName: req.user.email.split('@')[0],
        text: dto.text.slice(0, 500),
      },
    });
  }

  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  rate(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: { score: number; comment?: string },
  ) {
    return this.ratings.rate(id, req.user.id, dto.score, dto.comment);
  }

  @Get(':id/rating')
  ratingSummary(@Param('id') id: string) {
    return this.ratings.summary(id);
  }

  @Get(':id/my-rating')
  @UseGuards(JwtAuthGuard)
  myRating(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.ratings.getUserRating(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto) {
    return this.svc.create({
      title: dto.title,
      game: dto.game,
      format: dto.format,
      genre: dto.genre,
      ffaRounds: dto.ffaRounds,
      swissRounds: dto.swissRounds,
      requireCheckIn: dto.requireCheckIn,
      maxParticipants: dto.maxParticipants,
      entryFee: dto.entryFee,
      prizePool: dto.prizePool,
      streamUrl: dto.streamUrl,
    });
  }

  @Get()
  list() {
    return this.svc.list();
  }

  @Get('games')
  games() {
    return this.svc.gamesCatalog();
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

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string) {
    return this.svc.cancel(id);
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      game?: string;
      maxParticipants?: number;
      entryFee?: number;
      prizePool?: { rank: number; amount: number }[];
      requireCheckIn?: boolean;
      streamUrl?: string;
    },
  ) {
    return this.svc.update(id, dto);
  }

  @Post(':id/copy')
  @UseGuards(JwtAuthGuard)
  copy(@Param('id') id: string) {
    return this.svc.copy(id);
  }

  @Get(':id/ready')
  ready(@Param('id') id: string) {
    return this.svc.ready(id);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.svc.standings(id);
  }

  @Get(':id/results')
  results(@Param('id') id: string) {
    return this.svc.results(id);
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
    return this.svc.reportDuel(id, matchId, dto.winnerId, dto.score);
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

  @Post(':id/matches/:matchId/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: ReportDto,
  ) {
    if (!dto.winnerId) {
      throw new BadRequestException('winnerId is required for dispute resolution');
    }
    return this.svc.resolveDispute(id, matchId, dto.winnerId);
  }
}
