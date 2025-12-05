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
import { Burner } from './kitchen/entities/burner.entity'; // ✅ Import Burner entity
import { TimerStateModule } from './timer-state/timer-state.module';

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
      url: 'postgresql://neondb_owner:npg_era1mIQuSNv9@ep-plain-voice-a23e540q-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([Burner]), // ✅ Add this line
  ],
  controllers: [AppController],
  providers: [AppService, SocketsGateway, MqttService],
})
export class AppModule {}
