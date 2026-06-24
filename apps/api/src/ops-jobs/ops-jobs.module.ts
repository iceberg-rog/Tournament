import { Module } from '@nestjs/common';
import { OpsJobsService } from './ops-jobs.service';
import { NotificationsDeliveryModule } from '../notifications-delivery/notifications-delivery.module';
import { TournamentOpsModule } from '../tournament-ops/tournament-ops.module';

@Module({
  imports: [NotificationsDeliveryModule, TournamentOpsModule],
  providers: [OpsJobsService],
  exports: [OpsJobsService],
})
export class OpsJobsModule {}
