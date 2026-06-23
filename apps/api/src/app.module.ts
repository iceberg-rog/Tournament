import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ModerationModule } from './moderation/moderation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { GamesModule } from './games/games.module';
import { SeasonsModule } from './seasons/seasons.module';
import { CommunityModule } from './community/community.module';
import { LaddersModule } from './ladders/ladders.module';
import { AuditModule } from './audit/audit.module';
import { OrganizerRequestsModule } from './organizer-requests/organizer-requests.module';
import { ControlBoardModule } from './control-board/control-board.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TournamentsModule,
    SettingsModule,
    PaymentsModule,
    WalletModule,
    PayoutsModule,
    ModerationModule,
    NotificationsModule,
    AdminModule,
    GamesModule,
    SeasonsModule,
    CommunityModule,
    LaddersModule,
    AuditModule,
    OrganizerRequestsModule,
    ControlBoardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
