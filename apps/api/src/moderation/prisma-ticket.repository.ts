import { Injectable } from '@nestjs/common';
import type { Ticket, TicketMessage, TicketRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTicketRepository implements TicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(t: Ticket): Promise<void> {
    await this.prisma.ticket.create({
      data: {
        id: t.id,
        userId: t.userId,
        subject: t.subject,
        status: t.status,
        messages: t.messages as unknown as object,
      },
    });
  }
  async get(id: string): Promise<Ticket | null> {
    const t = await this.prisma.ticket.findUnique({ where: { id } });
    return t ? this.from(t) : null;
  }
  async update(t: Ticket): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: t.id },
      data: { status: t.status, messages: t.messages as unknown as object },
    });
  }
  async list(): Promise<Ticket[]> {
    const rows = await this.prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((t) => this.from(t));
  }
  async listForUser(userId: string): Promise<Ticket[]> {
    const rows = await this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((t) => this.from(t));
  }
  private from(t: any): Ticket {
    return {
      id: t.id,
      userId: t.userId,
      subject: t.subject,
      status: t.status,
      messages: t.messages as TicketMessage[],
      createdAt: t.createdAt.toISOString(),
    };
  }
}
