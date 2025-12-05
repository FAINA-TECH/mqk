// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Kitchen } from '../kitchen/entities/kitchen.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { User } from '../user/entities/user.entity';
import { SaleTransaction } from 'src/sale-transaction/entities/sale-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SaleTransaction, Kitchen, Burner, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
