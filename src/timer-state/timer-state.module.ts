// src/timer-state/timer-state.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimerStateController } from './timer-state.controller';
import { TimerStateService } from './timer-state.service';
import { Burner } from '../kitchen/entities/burner.entity';
import { SaleTransaction } from '../sale-transaction/entities/sale-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Burner, SaleTransaction])],
  controllers: [TimerStateController],
  providers: [TimerStateService],
  exports: [TimerStateService],
})
export class TimerStateModule {}
