import { Module } from '@nestjs/common';
import { StreamingController, PublicStreamController } from './streaming.controller';
import { StreamingService, streamProviders } from './streaming.service';
import { TournamentOpsModule } from '../tournament-ops/tournament-ops.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TournamentOpsModule, AuditModule],
  controllers: [StreamingController, PublicStreamController],
  providers: [StreamingService, ...streamProviders],
  exports: [StreamingService],
})
export class StreamingModule {}
