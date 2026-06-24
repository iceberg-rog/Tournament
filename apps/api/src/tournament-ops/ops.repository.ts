import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** sliceهای مجازِ عملیات (برابر با کلیدهای useOpsSlice در فرانت). */
export const OPS_SLICES = [
  'chat-messages',
  'chat-policy',
  'chat-flags',
  'announcements',
  'schedule-patches',
  'schedule-published',
  'dispute-status',
  'participant-patches',
  'stream-config',
  'stream-sessions',
] as const;
export type OpsSlice = (typeof OPS_SLICES)[number];

export interface OpsSliceRecord {
  slice: string;
  data: unknown;
  updatedAt: string;
}

/**
 * قراردادِ ذخیره‌سازیِ عملیات. فرانت همین interface را (محلی یا API) صدا می‌زند؛
 * این پیاده‌سازیِ Prisma است که در پروداکشن جایگزینِ localStorage می‌شود.
 */
export interface OpsRepository {
  getSlice(tournamentId: string, slice: string): Promise<OpsSliceRecord | null>;
  putSlice(tournamentId: string, slice: string, data: unknown): Promise<OpsSliceRecord>;
  getAll(tournamentId: string): Promise<OpsSliceRecord[]>;
}

@Injectable()
export class PrismaOpsRepository implements OpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private from(r: any): OpsSliceRecord {
    return { slice: r.slice, data: r.data, updatedAt: r.updatedAt?.toISOString?.() ?? new Date().toISOString() };
  }

  async getSlice(tournamentId: string, slice: string): Promise<OpsSliceRecord | null> {
    const r = await this.prisma.opsState.findUnique({ where: { tournamentId_slice: { tournamentId, slice } } });
    return r ? this.from(r) : null;
  }

  async putSlice(tournamentId: string, slice: string, data: unknown): Promise<OpsSliceRecord> {
    const r = await this.prisma.opsState.upsert({
      where: { tournamentId_slice: { tournamentId, slice } },
      create: { tournamentId, slice, data: data as any },
      update: { data: data as any },
    });
    return this.from(r);
  }

  async getAll(tournamentId: string): Promise<OpsSliceRecord[]> {
    const rows = await this.prisma.opsState.findMany({ where: { tournamentId } });
    return rows.map((r) => this.from(r));
  }
}
