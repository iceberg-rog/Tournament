import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** ذخیره و بازخوانیِ «بُردِ عملیاتِ» اتاقِ کنترل (وضعیتِ زنده‌ی هر تورنومنت). */
@Injectable()
export class ControlBoardService {
  constructor(private readonly prisma: PrismaService) {}

  private toCore(b: any) {
    return {
      tournamentId: b.tournamentId,
      title: b.title,
      game: b.game,
      format: b.format,
      prize: b.prize,
      phase: b.phase,
      currentRound: b.currentRound,
      totalRounds: b.totalRounds,
      roundName: b.roundName,
      nextScheduled: b.nextScheduled ?? undefined,
      estimatedFinish: b.estimatedFinish ?? undefined,
      participants: b.participants,
      matches: b.matches,
      disputes: b.disputes,
      activity: b.activity,
      auditLog: (b.meta as any)?.auditLog ?? [],
      noShowPolicy: (b.meta as any)?.noShowPolicy ?? undefined,
      progressionSettings: (b.meta as any)?.progressionSettings ?? undefined,
      updatedAt: b.updatedAt?.toISOString?.() ?? undefined,
    };
  }

  async get(tournamentId: string) {
    const b = await this.prisma.controlBoard.findUnique({ where: { tournamentId } });
    return b ? this.toCore(b) : null;
  }

  async save(tournamentId: string, core: any) {
    const data = {
      title: String(core?.title ?? ''),
      game: String(core?.game ?? ''),
      format: String(core?.format ?? 'single_elimination'),
      prize: Number(core?.prize ?? 0),
      phase: String(core?.phase ?? 'round_active'),
      currentRound: Number(core?.currentRound ?? 0),
      totalRounds: Number(core?.totalRounds ?? 0),
      roundName: String(core?.roundName ?? ''),
      nextScheduled: core?.nextScheduled ?? null,
      estimatedFinish: core?.estimatedFinish ?? null,
      participants: core?.participants ?? [],
      matches: core?.matches ?? [],
      disputes: core?.disputes ?? [],
      activity: core?.activity ?? [],
      meta: { auditLog: core?.auditLog ?? [], noShowPolicy: core?.noShowPolicy ?? null, progressionSettings: core?.progressionSettings ?? null },
    };
    const b = await this.prisma.controlBoard.upsert({
      where: { tournamentId },
      create: { tournamentId, ...data },
      update: data,
    });
    return this.toCore(b);
  }

  async remove(tournamentId: string) {
    await this.prisma.controlBoard.deleteMany({ where: { tournamentId } });
    return { ok: true };
  }
}
