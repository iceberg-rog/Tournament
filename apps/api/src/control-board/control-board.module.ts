import { Module } from '@nestjs/common';
import { ControlBoardService } from './control-board.service';
import { ControlBoardController } from './control-board.controller';

@Module({
  controllers: [ControlBoardController],
  providers: [ControlBoardService],
})
export class ControlBoardModule {}
