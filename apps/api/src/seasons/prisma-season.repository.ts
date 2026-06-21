import { Injectable } from '@nestjs/common';
import type { SeasonRecord, SeasonRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSeasonRepository implements SeasonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(s: SeasonRecord): Promise<void> {
    await this.prisma.season.create({
      data: { id: s.id, title: s.title, tournamentIds: s.tournamentIds as unknown as object },
    });
  }
  async get(id: string): Promise<SeasonRecord | null> {
    const r = await this.prisma.season.findUnique({ where: { id } });
    return r ? { id: r.id, title: r.title, tournamentIds: r.tournamentIds as unknown as string[] } : null;
  }
  async update(s: SeasonRecord): Promise<void> {
    await this.prisma.season.update({
      where: { id: s.id },
      data: { title: s.title, tournamentIds: s.tournamentIds as unknown as object },
    });
  }
  async list(): Promise<SeasonRecord[]> {
    const rows = await this.prisma.season.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      tournamentIds: r.tournamentIds as unknown as string[],
    }));
  }
}
