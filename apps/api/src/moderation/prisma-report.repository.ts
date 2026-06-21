import { Injectable } from '@nestjs/common';
import type { Report, ReportRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(r: Report): Promise<void> {
    await this.prisma.report.create({
      data: {
        id: r.id,
        reporterId: r.reporterId,
        targetUserId: r.targetUserId ?? null,
        tournamentId: r.tournamentId ?? null,
        category: r.category,
        reason: r.reason,
        status: r.status,
      },
    });
  }
  async get(id: string): Promise<Report | null> {
    const r = await this.prisma.report.findUnique({ where: { id } });
    return r ? this.from(r) : null;
  }
  async update(r: Report): Promise<void> {
    await this.prisma.report.update({
      where: { id: r.id },
      data: {
        status: r.status,
        action: r.action ?? null,
        resolution: r.resolution ?? null,
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : null,
      },
    });
  }
  async list(): Promise<Report[]> {
    const rows = await this.prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  private from(r: any): Report {
    return {
      id: r.id,
      reporterId: r.reporterId,
      targetUserId: r.targetUserId ?? undefined,
      tournamentId: r.tournamentId ?? undefined,
      category: r.category,
      reason: r.reason,
      status: r.status,
      action: r.action ?? undefined,
      resolution: r.resolution ?? undefined,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
    };
  }
}
