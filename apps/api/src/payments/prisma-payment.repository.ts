import { Injectable } from '@nestjs/common';
import type { Payment, PaymentRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(p: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: {
        id: p.id,
        amount: p.amount,
        description: p.description,
        status: p.status,
        authority: p.authority,
        ref: p.ref ?? null,
      },
    });
  }

  async get(id: string): Promise<Payment | null> {
    const r = await this.prisma.payment.findUnique({ where: { id } });
    return r ? this.from(r) : null;
  }

  async update(p: Payment): Promise<void> {
    await this.prisma.payment.update({
      where: { id: p.id },
      data: { status: p.status, ref: p.ref ?? null },
    });
  }

  private from(r: any): Payment {
    return {
      id: r.id,
      amount: Number(r.amount),
      description: r.description,
      status: r.status,
      authority: r.authority,
      ref: r.ref ?? undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
