import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { ActivityService } from './activity.service';
import { PrismaOpsRepository } from './ops.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [OpsController],
  providers: [OpsService, ActivityService, PrismaOpsRepository],
  exports: [OpsService, ActivityService, PrismaOpsRepository],
})
export class TournamentOpsModule {}
