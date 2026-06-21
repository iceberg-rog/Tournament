import { Injectable } from '@nestjs/common';
import type { WithdrawalRepository, WithdrawalRequest } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaWithdrawalRepository implements WithdrawalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(w: WithdrawalRequest): Promise<void> {
    await this.prisma.withdrawal.create({
      data: { id: w.id, userId: w.userId, amount: w.amount, iban: w.iban, status: w.status },
    });
  }
  async get(id: string): Promise<WithdrawalRequest | null> {
    const r = await this.prisma.withdrawal.findUnique({ where: { id } });
    return r ? this.from(r) : null;
  }
  async update(w: WithdrawalRequest): Promise<void> {
    await this.prisma.withdrawal.update({
      where: { id: w.id },
      data: {
        status: w.status,
        reason: w.reason ?? null,
        reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : null,
      },
    });
  }
  async list(): Promise<WithdrawalRequest[]> {
    const rows = await this.prisma.withdrawal.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.from(r));
  }
  async listForUser(userId: string): Promise<WithdrawalRequest[]> {
    const rows = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.from(r));
  }
  private from(r: any): WithdrawalRequest {
    return {
      id: r.id,
      userId: r.userId,
      amount: Number(r.amount),
      iban: r.iban,
      status: r.status,
      reason: r.reason ?? undefined,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
    };
  }
}
