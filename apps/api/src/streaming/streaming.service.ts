import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../tournament-ops/activity.service';
import { AuditService } from '../audit/audit.service';
import { MockStreamAdapter, STREAM_ADAPTER, type StreamAdapter } from './stream.adapter';

interface Actor {
  id: string;
  role: string;
}

/** persistِ نشستِ استریم + adapter + audit/activity. */
@Injectable()
export class StreamingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
    @Inject(STREAM_ADAPTER) private readonly adapter: StreamAdapter,
  ) {}

  private from(r: any) {
    return {
      tournamentId: r.tournamentId,
      matchId: r.matchId,
      status: r.status,
      visibility: r.visibility,
      viewers: r.viewers,
      bitrate: r.bitrate,
      latency: r.latency,
      dropped: r.dropped,
      caster: r.caster ?? undefined,
      playbackUrl: r.playbackUrl ?? undefined,
      startedAt: r.startedAt?.toISOString?.() ?? null,
      endedAt: r.endedAt?.toISOString?.() ?? null,
    };
  }

  async state(tournamentId: string) {
    const rows = await this.prisma.streamSessionRow.findMany({ where: { tournamentId } });
    const sessions = rows.map((r) => this.from(r));
    const live = sessions.filter((s) => s.status === 'live');
    return {
      tournamentId,
      provider: this.adapter.id,
      enabled: sessions.length > 0,
      liveCount: live.length,
      viewers: live.reduce((a, s) => a + s.viewers, 0),
      sessions,
    };
  }

  /** نشستِ زنده‌ی عمومی برای صفحه‌ی تماشا (بدونِ auth). */
  async publicLive(tournamentId: string) {
    const rows = await this.prisma.streamSessionRow.findMany({ where: { tournamentId, status: 'live', visibility: 'public' } });
    return { tournamentId, provider: this.adapter.id, live: rows.map((r) => this.from(r)) };
  }

  async start(tournamentId: string, matchId: string, opts: { caster?: string; visibility?: string }, actor: Actor) {
    const prov = await this.adapter.provision({ tournamentId, matchId });
    const health = await this.adapter.start({ tournamentId, matchId });
    const data = {
      status: health.status,
      visibility: opts.visibility ?? 'public',
      viewers: health.viewers,
      bitrate: health.bitrate,
      latency: health.latency,
      dropped: health.dropped,
      caster: opts.caster ?? null,
      playbackUrl: prov.playbackUrl,
      startedAt: new Date(),
      endedAt: null,
    };
    const row = await this.prisma.streamSessionRow.upsert({
      where: { tournamentId_matchId: { tournamentId, matchId } },
      create: { tournamentId, matchId, ...data },
      update: data,
    });
    await this.activity.log({ tournamentId, kind: 'stream', actor: actor.id, summary: `شروعِ پخشِ مسابقه ${matchId}`, entityType: 'match', entityId: matchId });
    await this.audit.log({ actorId: actor.id, actorRole: actor.role, action: 'شروعِ استریم', entityType: 'match', entityId: matchId, after: { matchId, playbackUrl: prov.playbackUrl } });
    return this.from(row);
  }

  async stop(tournamentId: string, matchId: string, actor: Actor) {
    const existing = await this.prisma.streamSessionRow.findUnique({ where: { tournamentId_matchId: { tournamentId, matchId } } });
    if (!existing) return null; // توقفِ نشستِ شروع‌نشده = no-op (بدونِ ساختِ رکوردِ ناسازگار)
    await this.adapter.stop({ tournamentId, matchId });
    const row = await this.prisma.streamSessionRow.update({
      where: { tournamentId_matchId: { tournamentId, matchId } },
      data: { status: 'ended', viewers: 0, bitrate: 0, latency: 0, dropped: 0, endedAt: new Date() },
    });
    await this.activity.log({ tournamentId, kind: 'stream', actor: actor.id, summary: `توقفِ پخشِ مسابقه ${matchId}`, entityType: 'match', entityId: matchId });
    await this.audit.log({ actorId: actor.id, actorRole: actor.role, action: 'توقفِ استریم', entityType: 'match', entityId: matchId });
    return this.from(row);
  }
}

export const streamProviders = [{ provide: STREAM_ADAPTER, useClass: MockStreamAdapter }];
