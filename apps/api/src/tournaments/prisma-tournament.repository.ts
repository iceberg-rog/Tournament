import { Injectable } from '@nestjs/common';
import type { TournamentRecord, TournamentRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

/** پیاده‌سازی Prisma از مخزن تورنومنت (مدل replay → ستون‌های JSON). */
@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(rec: TournamentRecord): Promise<void> {
    await this.prisma.tournament.create({ data: this.toRow(rec) });
  }

  async get(id: string): Promise<TournamentRecord | null> {
    const row = await this.prisma.tournament.findUnique({ where: { id } });
    return row ? this.fromRow(row) : null;
  }

  async update(rec: TournamentRecord): Promise<void> {
    await this.prisma.tournament.update({ where: { id: rec.id }, data: this.toRow(rec) });
  }

  async list(): Promise<TournamentRecord[]> {
    const rows = await this.prisma.tournament.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.fromRow(r));
  }

  private toRow(rec: TournamentRecord) {
    return {
      id: rec.id,
      title: rec.title,
      game: rec.game ?? null,
      format: rec.format,
      genre: rec.genre,
      status: rec.status,
      ffaRounds: rec.ffaRounds ?? null,
      swissRounds: rec.swissRounds ?? null,
      participants: rec.participants as unknown as object,
      events: rec.events as unknown as object,
      meta: {
        maxParticipants: rec.maxParticipants ?? null,
        waitlist: rec.waitlist ?? [],
        requireCheckIn: rec.requireCheckIn ?? false,
        prizePool: rec.prizePool ?? null,
        entryFee: rec.entryFee ?? null,
        streamUrl: rec.streamUrl ?? null,
        requireResultConfirmation: rec.requireResultConfirmation ?? false,
        scoring: rec.scoring ?? null,
        heldFees: rec.heldFees ?? [],
        paidOut: rec.paidOut ?? false,
      } as unknown as object,
    };
  }

  private fromRow(r: any): TournamentRecord {
    const m = (r.meta ?? {}) as Record<string, any>;
    return {
      id: r.id,
      title: r.title,
      game: r.game ?? undefined,
      format: r.format,
      genre: r.genre,
      status: r.status,
      ffaRounds: r.ffaRounds ?? undefined,
      swissRounds: r.swissRounds ?? undefined,
      participants: r.participants,
      events: r.events,
      maxParticipants: m.maxParticipants ?? undefined,
      waitlist: m.waitlist ?? [],
      requireCheckIn: m.requireCheckIn ?? false,
      prizePool: m.prizePool ?? undefined,
      entryFee: m.entryFee ?? undefined,
      streamUrl: m.streamUrl ?? undefined,
      requireResultConfirmation: m.requireResultConfirmation ?? false,
      scoring: m.scoring ?? undefined,
      heldFees: m.heldFees ?? [],
      paidOut: m.paidOut ?? false,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
