import { Injectable } from '@nestjs/common';
import type { Post, Space, SpaceRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSpaceRepository implements SpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(s: Space): Promise<void> {
    await this.prisma.space.create({
      data: {
        id: s.id,
        title: s.title,
        tournamentId: s.tournamentId ?? null,
        memberIds: s.memberIds as unknown as object,
        posts: s.posts as unknown as object,
      },
    });
  }
  async get(id: string): Promise<Space | null> {
    const r = await this.prisma.space.findUnique({ where: { id } });
    return r ? this.from(r) : null;
  }
  async update(s: Space): Promise<void> {
    await this.prisma.space.update({
      where: { id: s.id },
      data: {
        title: s.title,
        tournamentId: s.tournamentId ?? null,
        memberIds: s.memberIds as unknown as object,
        posts: s.posts as unknown as object,
      },
    });
  }
  async list(): Promise<Space[]> {
    const rows = await this.prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  private from(r: any): Space {
    return {
      id: r.id,
      title: r.title,
      tournamentId: r.tournamentId ?? undefined,
      memberIds: r.memberIds as string[],
      posts: r.posts as Post[],
    };
  }
}
