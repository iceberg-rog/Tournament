import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface SubmitInput {
  org: string;
  contact: string;
  reason: string;
  experience?: string;
  links?: string;
}
interface Reviewer {
  id: string;
  role: string;
}

const OPEN = ['submitted', 'under_review'];

/** برنامه‌ی برگزارکننده‌ها: کاربر درخواست می‌دهد، کارکنان تأیید/رد می‌کنند. */
@Injectable()
export class OrganizerRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(userId: string, dto: SubmitInput) {
    if (!dto?.org?.trim() || !dto?.contact?.trim() || !dto?.reason?.trim())
      throw new BadRequestException('نام سازمان، راه ارتباطی و دلیل لازم است.');
    const existing = await this.prisma.organizerRequest.findFirst({ where: { userId, status: { in: OPEN } } });
    if (existing) throw new ConflictException('یک درخواستِ در حالِ بررسی از قبل دارید.');
    return this.prisma.organizerRequest.create({
      data: {
        userId,
        org: dto.org.trim(),
        contact: dto.contact.trim(),
        reason: dto.reason.trim(),
        experience: dto.experience?.trim() ?? '',
        links: dto.links?.trim() || null,
        status: 'submitted',
      },
    });
  }

  mine(userId: string) {
    return this.prisma.organizerRequest.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  list(status?: string) {
    return this.prisma.organizerRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  private async get(id: string) {
    const r = await this.prisma.organizerRequest.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('درخواست پیدا نشد.');
    return r;
  }

  async approve(id: string, reviewer: Reviewer) {
    const r = await this.get(id);
    const updated = await this.prisma.organizerRequest.update({
      where: { id },
      data: { status: 'approved', reviewerId: reviewer.id, decisionReason: null },
    });
    // ارتقای نقشِ کاربر به برگزارکننده‌ی تأییدشده
    await this.prisma.user.update({ where: { id: r.userId }, data: { role: 'ORGANIZER' } });
    await this.audit.log({
      actorId: reviewer.id,
      actorRole: reviewer.role,
      action: 'تأییدِ برگزارکننده',
      entityType: 'organizer_request',
      entityId: id,
      before: { status: r.status },
      after: { status: 'approved', userRole: 'ORGANIZER' },
    });
    return updated;
  }

  async reject(id: string, reviewer: Reviewer, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('دلیلِ رد لازم است.');
    const r = await this.get(id);
    const updated = await this.prisma.organizerRequest.update({
      where: { id },
      data: { status: 'rejected', reviewerId: reviewer.id, decisionReason: reason.trim() },
    });
    await this.audit.log({
      actorId: reviewer.id,
      actorRole: reviewer.role,
      action: 'ردِ برگزارکننده',
      entityType: 'organizer_request',
      entityId: id,
      reason: reason.trim(),
      before: { status: r.status },
      after: { status: 'rejected' },
    });
    return updated;
  }

  async requestInfo(id: string, reviewer: Reviewer) {
    const r = await this.get(id);
    const updated = await this.prisma.organizerRequest.update({ where: { id }, data: { status: 'under_review', reviewerId: reviewer.id } });
    await this.audit.log({
      actorId: reviewer.id,
      actorRole: reviewer.role,
      action: 'درخواستِ اطلاعاتِ بیشتر',
      entityType: 'organizer_request',
      entityId: id,
      before: { status: r.status },
      after: { status: 'under_review' },
    });
    return updated;
  }
}
