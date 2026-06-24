import { Injectable } from '@nestjs/common';
import { PrismaOpsRepository } from './ops.repository';
import { ActivityService } from './activity.service';
import { AuditService } from '../audit/audit.service';

interface Actor {
  id: string;
  role: string;
}

/**
 * سرویسِ عملیاتِ تورنومنت — هم persistِ خامِ slice (swap برای localStorage)،
 * هم endpointهای معنایی (تصمیمِ اختلاف، اعلان، پیامِ چت) که slice + activity + audit
 * را با هم می‌نویسند.
 */
@Injectable()
export class OpsService {
  constructor(
    private readonly repo: PrismaOpsRepository,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
  ) {}

  // ── persistِ خامِ slice ──
  getSlice(tournamentId: string, slice: string) {
    return this.repo.getSlice(tournamentId, slice);
  }
  putSlice(tournamentId: string, slice: string, data: unknown) {
    return this.repo.putSlice(tournamentId, slice, data);
  }

  async getState(tournamentId: string) {
    const [slices, activity] = await Promise.all([
      this.repo.getAll(tournamentId),
      this.activity.list(tournamentId, 50),
    ]);
    const audit = await this.audit.list({ entityType: 'tournament', entityId: tournamentId });
    const bySlice: Record<string, unknown> = {};
    for (const s of slices) bySlice[s.slice] = s.data;
    return { tournamentId, slices: bySlice, activity, audit };
  }

  // ── endpointهای معنایی (compose: slice + activity + audit) ──

  /** ادغامِ یک patch در یک slice که map از id→مقدار است. */
  private async mergeMap(tournamentId: string, slice: string, key: string, value: unknown) {
    const current = (await this.repo.getSlice(tournamentId, slice))?.data as Record<string, unknown> | undefined;
    const next = { ...(current ?? {}), [key]: value };
    return this.repo.putSlice(tournamentId, slice, next);
  }

  /** افزودنِ آیتم به یک slice که آرایه است. */
  private async pushArray(tournamentId: string, slice: string, item: unknown) {
    const current = (await this.repo.getSlice(tournamentId, slice))?.data as unknown[] | undefined;
    const next = [...(current ?? []), item];
    return this.repo.putSlice(tournamentId, slice, next);
  }

  async patchParticipant(tournamentId: string, participantId: string, patch: unknown, actor: Actor) {
    await this.mergeMap(tournamentId, 'participant-patches', participantId, patch);
    await this.activity.log({ tournamentId, kind: 'admin', actor: actor.id, summary: `به‌روزرسانیِ شرکت‌کننده ${participantId}`, entityType: 'participant', entityId: participantId });
    await this.audit.log({ actorId: actor.id, actorRole: actor.role, action: 'به‌روزرسانیِ شرکت‌کننده', entityType: 'participant', entityId: participantId, after: patch });
    return { ok: true };
  }

  async disputeDecision(tournamentId: string, disputeId: string, decision: { status: string; resolution?: string }, actor: Actor) {
    await this.mergeMap(tournamentId, 'dispute-status', disputeId, decision);
    await this.activity.log({ tournamentId, kind: 'dispute', actor: actor.id, summary: `تصمیمِ اختلاف ${disputeId}: ${decision.status}`, entityType: 'dispute', entityId: disputeId });
    await this.audit.log({ actorId: actor.id, actorRole: actor.role, action: 'تصمیمِ اختلاف', entityType: 'dispute', entityId: disputeId, reason: decision.resolution, after: decision });
    return { ok: true };
  }

  async addChatMessage(tournamentId: string, message: { id: string; author: string; role: string; text: string; at: string }, actor: Actor) {
    await this.pushArray(tournamentId, 'chat-messages', message);
    await this.activity.log({ tournamentId, kind: 'chat', actor: actor.id, summary: `پیامِ چت از ${message.author}`, entityType: 'chat', entityId: message.id });
    return { ok: true, message };
  }

  async setSchedulePatch(tournamentId: string, round: number, patch: unknown, actor: Actor) {
    await this.mergeMap(tournamentId, 'schedule-patches', String(round), patch);
    await this.activity.log({ tournamentId, kind: 'admin', actor: actor.id, summary: `تغییرِ زمان‌بندیِ دورِ ${round}`, entityType: 'schedule', entityId: String(round) });
    await this.audit.log({ actorId: actor.id, actorRole: actor.role, action: 'تغییرِ برنامه‌ی زمان‌بندی', entityType: 'schedule', entityId: `${tournamentId}:${round}`, after: patch });
    return { ok: true };
  }

  listActivity(tournamentId: string) {
    return this.activity.list(tournamentId);
  }

  appendActivity(tournamentId: string, body: { kind: string; summary: string; actor?: string; entityType?: string; entityId?: string }) {
    return this.activity.log({ tournamentId, ...body });
  }
}
