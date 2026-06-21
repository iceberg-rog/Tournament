import { Injectable } from '@nestjs/common';
import type { PlatformSettings, SettingsRepository } from '@tournament/core';
import { PrismaService } from '../prisma/prisma.service';

const KEY = 'platform';

/** ذخیره‌ی تنظیمات پلتفرم در یک رکورد Setting (key="platform"، value JSON). */
@Injectable()
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<Partial<PlatformSettings> | null> {
    const row = await this.prisma.setting.findUnique({ where: { key: KEY } });
    return row ? (row.value as unknown as Partial<PlatformSettings>) : null;
  }

  async save(s: PlatformSettings): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: s as unknown as object },
      update: { value: s as unknown as object },
    });
  }
}
