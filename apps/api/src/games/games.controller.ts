import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** کاتالوگ بازی‌ها (UC06): فهرست عمومی + مدیریت توسط مدیر. */
@Controller('games')
export class GamesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.game.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN')
  create(@Body() dto: { slug: string; name: string; platforms?: string[] }) {
    return this.prisma.game.upsert({
      where: { slug: dto.slug },
      create: { slug: dto.slug, name: dto.name, platforms: (dto.platforms ?? []) as unknown as object, active: true },
      update: { name: dto.name, platforms: (dto.platforms ?? []) as unknown as object, active: true },
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MAIN_ADMIN', 'GAME_ADMIN')
  remove(@Param('id') id: string) {
    return this.prisma.game.update({ where: { id }, data: { active: false } });
  }
}
