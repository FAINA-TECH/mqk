import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { Kitchen } from './entities/kitchen.entity';
import { Stove } from './entities/stove.entity';
import { Burner } from './entities/burner.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kitchen, Stove, Burner]), UserModule],
  controllers: [KitchenController],
  providers: [KitchenService],
  exports: [KitchenService],
})
export class KitchenModule {}