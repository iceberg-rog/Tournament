import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

/** کنسول مدیریت — فقط ADMIN/MAIN_ADMIN (UC04/UC05/UC31). */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MAIN_ADMIN')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('users')
  users() {
    return this.svc.listUsers();
  }

  @Post('users/:id/role')
  setRole(@Param('id') id: string, @Body() dto: { role: string }) {
    return this.svc.setRole(id, dto.role);
  }

  @Post('users/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.svc.setStatus(id, dto.status);
  }

  @Get('stats')
  stats() {
    return this.svc.stats();
  }
}
