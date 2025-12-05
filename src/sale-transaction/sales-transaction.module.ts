import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleTransactionController } from './sale-transaction.controller';
import { SaleTransactionService } from './sale-transaction.service';
import { SaleTransaction } from './entities/sale-transaction.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { TimerStateModule } from 'src/timer-state/timer-state.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaleTransaction, Burner]),
    TimerStateModule,
  ],
  controllers: [SaleTransactionController],
  providers: [SaleTransactionService],
  exports: [SaleTransactionService],
})
export class SaleTransactionModule {}
