import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    UserModule,
    KitchenModule,
    TimerStateModule,
    SaleTransactionModule,
    SalesModule,
    ReportsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgres://postgres:PqEZUcERaYJ0lPYYEyTykE5p9s99Z9xmYNWeVNRTauhI2uNoL9tPhTezvPbvIxOL@kwcsowsgc4w8sowcsgsko08k:5432/postgres',
      // devurl: 'postgres://postgres:PqEZUcERaYJ0lPYYEyTykE5p9s99Z9xmYNWeVNRTauhI2uNoL9tPhTezvPbvIxOL@185.225.232.140:5436/postgres',
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([Burner, Stove]),
  ],
  controllers: [AppController],
  providers: [AppService, SocketsGateway, MqttService],
})
export class AppModule {}
