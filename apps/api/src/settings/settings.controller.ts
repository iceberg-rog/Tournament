import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { DeepPartial, PlatformSettings, SettingsService } from '@tournament/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/** تنظیمات پایه‌ی داشبورد مدیریت (درگاه پرداخت، کلیدهای API). فقط مدیر. */
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
