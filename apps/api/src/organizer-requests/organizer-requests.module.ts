import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OrganizerRequestsService } from './organizer-requests.service';
import { OrganizerRequestsController } from './organizer-requests.controller';

@Module({
  imports: [AuditModule],
  controllers: [OrganizerRequestsController],
  providers: [OrganizerRequestsService],
})
export class OrganizerRequestsModule {}
