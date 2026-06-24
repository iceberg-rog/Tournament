import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DELIVERY_DISPATCHER, DeliveryDispatcher } from './delivery.adapter';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, { provide: DELIVERY_DISPATCHER, useClass: DeliveryDispatcher }],
  exports: [DeliveryService],
})
export class NotificationsDeliveryModule {}
