import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ROLES = ['USER', 'GAME_ADMIN', 'REFEREE', 'SUPPORT', 'MAIN_ADMIN', 'ADMIN'];
const STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED'];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** فهرست کاربران (UC04). */
  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        accountStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** تخصیص نقش/سطح دسترسی (UC05). */
  setRole(id: string, role: string) {
    if (!ROLES.includes(role)) throw new BadRequestException('نقش نامعتبر است');
    return this.prisma.user.update({ where: { id }, data: { role }, select: { id: true, role: true } });
  }

  /** تعلیق/مسدودسازی حساب (اقدام تعدیلی). */
  setStatus(id: string, accountStatus: string) {
    if (!STATUSES.includes(accountStatus)) throw new BadRequestException('وضعیت نامعتبر است');
    return this.prisma.user.update({
      where: { id },
      data: { accountStatus },
      select: { id: true, accountStatus: true },
    });
  }

  /** داشبورد تحلیلی (UC31). */
  async stats() {
    const [users, draft, running, completed, cancelled, paid, pendingW, openR, openT] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.tournament.count({ where: { status: 'DRAFT' } }),
        this.prisma.tournament.count({ where: { status: 'RUNNING' } }),
        this.prisma.tournament.count({ where: { status: 'COMPLETED' } }),
        this.prisma.tournament.count({ where: { status: 'CANCELLED' } }),
        this.prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PAID' } }),
        this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
        this.prisma.report.count({ where: { status: 'OPEN' } }),
        this.prisma.ticket.count({ where: { NOT: { status: 'CLOSED' } } }),
      ]);
    return {
      users,
      tournaments: { draft, running, completed, cancelled, total: draft + running + completed + cancelled },
      payments: { paidCount: paid._count, paidTotal: Number(paid._sum.amount ?? 0) },
      pendingWithdrawals: pendingW,
      openReports: openR,
      openTickets: openT,
    };
  }
}
