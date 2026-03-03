import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { UserModule } from './user/user.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketsGateway } from './sockets/sockets.gateway';
import { MqttService } from './mqtt/mqtt.service';
import { SaleTransactionModule } from './sale-transaction/sales-transaction.module';
import { ReportsModule } from './reports/reports.module';
import { TimerStateModule } from './timer-state/timer-state.module';
import { Burner } from './kitchen/entities/burner.entity';
import { Stove } from './kitchen/entities/stove.entity';
import { ScriptedSaleModule } from './scripted-sale/scripted-sale.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    KitchenModule,
    TimerStateModule,
    SaleTransactionModule,
    SalesModule,
    ReportsModule,
    ScriptedSaleModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    }),
    TypeOrmModule.forFeature([Burner, Stove]),
  ],
  controllers: [AppController],
  providers: [AppService, SocketsGateway, MqttService],
})
export class AppModule {}
