import { Injectable } from '@nestjs/common';
import type { LadderRecord, LadderRepository, RatingEntry } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaLadderRepository implements LadderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(l: LadderRecord): Promise<void> {
    await this.prisma.ladder.create({
      data: {
        id: l.id,
        title: l.title,
        queue: l.queue as unknown as object,
        ratings: l.ratings as unknown as object,
      },
    });
  }
  async get(id: string): Promise<LadderRecord | null> {
    const r = await this.prisma.ladder.findUnique({ where: { id } });
    return r ? this.from(r) : null;
  }
  async update(l: LadderRecord): Promise<void> {
    await this.prisma.ladder.update({
      where: { id: l.id },
      data: { title: l.title, queue: l.queue as unknown as object, ratings: l.ratings as unknown as object },
    });
  }
  async list(): Promise<LadderRecord[]> {
    const rows = await this.prisma.ladder.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  private from(r: any): LadderRecord {
    return {
      id: r.id,
      title: r.title,
      queue: r.queue as string[],
      ratings: r.ratings as Record<string, RatingEntry>,
    };
  }
}
