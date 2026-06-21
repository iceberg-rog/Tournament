import { Injectable } from '@nestjs/common';
import type { Rating, RatingRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaRatingRepository implements RatingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(r: Rating): Promise<void> {
    await this.prisma.rating.upsert({
      where: { tournamentId_userId: { tournamentId: r.tournamentId, userId: r.userId } },
      create: {
        id: r.id,
        tournamentId: r.tournamentId,
        userId: r.userId,
        score: r.score,
        comment: r.comment ?? null,
      },
      update: { score: r.score, comment: r.comment ?? null },
    });
  }
  async listFor(tournamentId: string): Promise<Rating[]> {
    const rows = await this.prisma.rating.findMany({ where: { tournamentId } });
    return rows.map((r) => this.from(r));
  }
  async getUserRating(tournamentId: string, userId: string): Promise<Rating | null> {
    const r = await this.prisma.rating.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });
    return r ? this.from(r) : null;
  }
  private from(r: any): Rating {
    return {
      id: r.id,
      tournamentId: r.tournamentId,
      userId: r.userId,
      score: r.score,
      comment: r.comment ?? undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
