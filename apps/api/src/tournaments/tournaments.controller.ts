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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
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
  create(
    @Body() dto: CreateTournamentDto,
    @Request() req: { user: { id: string; email: string } },
  ) {
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
      requireResultConfirmation: dto.requireResultConfirmation,
      scoring: dto.scoring,
      platform: dto.platform,
      startAt: dto.startAt,
      durationHours: dto.durationHours,
      coverImage: dto.coverImage,
      organizerId: req.user.id,
      organizerName: req.user.email.split('@')[0],
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
  async register(
    @Param('id') id: string,
    @Request() req: { user: { id: string; email: string } },
    @Body() body: RegisterDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { displayName: true },
    });
    return this.svc.register(id, {
      id: req.user.id,
      name: body.name ?? user?.displayName ?? req.user.email.split('@')[0],
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
      requireResultConfirmation?: boolean;
      scoring?: { win: number; draw: number; loss: number };
      platform?: string;
      startAt?: string;
      durationHours?: number;
      coverImage?: string;
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

  // ───────── گیتِ تأیید داور (UC11) ─────────
  @Get(':id/pending-confirmations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN')
  pendingConfirmations(@Param('id') id: string) {
    return this.svc.pendingConfirmations(id);
  }

  @Post(':id/matches/:matchId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN')
  confirm(@Param('id') id: string, @Param('matchId') matchId: string) {
    return this.svc.confirmResult(id, matchId);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN')
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

  // ───────── مدیریتِ شرکت‌کننده توسطِ مدیر/داور ─────────
  @Post(':id/participants/:pid/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN')
  removeParticipant(@Param('id') id: string, @Param('pid') pid: string) {
    return this.svc.removeParticipant(id, pid);
  }

  @Post(':id/participants/:pid/message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'REFEREE', 'GAME_ADMIN')
  messageParticipant(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Body() body: { text?: string },
  ) {
    const text = (body.text ?? '').trim();
    if (text.length < 1) throw new BadRequestException('text is required');
    return this.svc.messageParticipant(id, pid, text);
  }
}
