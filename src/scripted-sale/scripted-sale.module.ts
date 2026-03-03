// src/scripted-sale/scripted-sale.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScriptedSaleTransaction } from './entities/scripted-sale-transaction.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { Kitchen } from '../kitchen/entities/kitchen.entity';
import { ScriptedSaleService } from './scripted-sale.service';
import { ScriptedSaleController } from './scripted-sale.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScriptedSaleTransaction, Burner, Kitchen]),
  ],
  controllers: [ScriptedSaleController],
  providers: [ScriptedSaleService],
  exports: [ScriptedSaleService],
})
export class ScriptedSaleModule {}
