import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { DeepPartial, PlatformSettings, SettingsService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/** تنظیمات پایه‌ی داشبورد مدیریت (درگاه پرداخت، کلیدهای API). محافظت‌شده. */
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get()
  get() {
    return this.svc.get();
  }

  @Put()
  update(@Body() body: DeepPartial<PlatformSettings>) {
    return this.svc.update(body);
  }
}
