import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    // رمز عبور هرگز برگردانده نمی‌شود
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  }
}
