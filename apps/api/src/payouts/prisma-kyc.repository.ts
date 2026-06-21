import { Injectable } from '@nestjs/common';
import type { KycCase, KycRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaKycRepository implements KycRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(c: KycCase): Promise<void> {
    const data = {
      status: c.status,
      fullName: c.fullName,
      nationalId: c.nationalId,
      reason: c.reason ?? null,
      reviewedAt: c.reviewedAt ? new Date(c.reviewedAt) : null,
    };
    await this.prisma.kycCase.upsert({
      where: { userId: c.userId },
      create: { userId: c.userId, ...data },
      update: data,
    });
  }
  async get(userId: string): Promise<KycCase | null> {
    const r = await this.prisma.kycCase.findUnique({ where: { userId } });
    return r ? this.from(r) : null;
  }
  async list(): Promise<KycCase[]> {
    const rows = await this.prisma.kycCase.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  private from(r: any): KycCase {
    return {
      userId: r.userId,
      status: r.status,
      fullName: r.fullName,
      nationalId: r.nationalId,
      reason: r.reason ?? undefined,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
    };
  }
}
