import { Injectable } from '@nestjs/common';
import type { LedgerEntry, WalletRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(e: LedgerEntry): Promise<void> {
    await this.prisma.ledger.create({
      data: {
        id: e.id,
        userId: e.userId,
        type: e.type,
        availableDelta: e.availableDelta,
        escrowDelta: e.escrowDelta,
        ref: e.ref,
      },
    });
  }

  async entriesFor(userId: string): Promise<LedgerEntry[]> {
    const rows = await this.prisma.ledger.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.from(r));
  }

  async all(): Promise<LedgerEntry[]> {
    const rows = await this.prisma.ledger.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => this.from(r));
  }

  private from(r: any): LedgerEntry {
    return {
      id: r.id,
      userId: r.userId,
      type: r.type,
      availableDelta: Number(r.availableDelta),
      escrowDelta: Number(r.escrowDelta),
      ref: r.ref,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
