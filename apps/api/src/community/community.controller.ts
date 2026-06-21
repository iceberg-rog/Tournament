import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CommunityService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('spaces')
export class CommunityController {
  constructor(private readonly svc: CommunityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: { title: string; tournamentId?: string }) {
    return this.svc.createSpace(dto.title, dto.tournamentId);
  }

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.svc.join(id, req.user.id);
  }

  @Post(':id/post')
  @UseGuards(JwtAuthGuard)
  post(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: { text: string },
  ) {
    return this.svc.post(id, req.user.id, dto.text);
  }
}
