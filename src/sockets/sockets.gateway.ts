import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { TimerEvents } from './events';

import {
  getBurnerIdSession,
  startTimerForBurner,
  stopTimerForBurner,
  pauseTimerForBurner,
  resumeTimerForBurner,
  getTimerState,
  isTimerOwnedByUser,
} from './burners';

import { MqttService } from 'src/mqtt/mqtt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Burner } from 'src/kitchen/entities/burner.entity';
import { SaleTransactionService } from 'src/sale-transaction/sale-transaction.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://megagasdashboard-production.up.railway.app',
    ],
    credentials: true,
  },
})
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(
    private readonly mqttService: MqttService,
    private readonly saleTransactionService: SaleTransactionService,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
  ) {}

  handleConnection(@ConnectedSocket() client: any) {
    if (!client.handshake.query?.burnerId) {
      console.error('Burner ID is missing in the query parameters.');
      return;
    }

    const burnerId = client.handshake.query.burnerId.toString();
    console.log(`User connected to burner ${burnerId} socket ${client.id}`);

    client.join(getBurnerIdSession(burnerId));

    const currentState = getTimerState(burnerId);
    if (currentState.remainingTime > 0 || currentState.burnerIsRunning) {
      client.emit('timerStateSync', currentState);
    }
  }

  handleDisconnect(@ConnectedSocket() client: any) {
    console.log(`Socket Disconnected: ${client.id}`);
  }

  @SubscribeMessage('getTimerState')
  handleGetTimerState(@ConnectedSocket() client: any): void {
    const burnerId = client.handshake.query.burnerId.toString();
    const currentState = getTimerState(burnerId);
    client.emit('timerStateSync', currentState);
  }

  // ✅ DYNAMIC MQTT COMMAND
  private async sendMqttCommand(burnerId: string, command: 'start' | 'stop') {
    // 1. Fetch burner with Stove relationship
    const burner = await this.burnerRepository.findOne({
        where: { id: burnerId },
        relations: ['stove']
    });

    if (!burner || !burner.stove) {
        console.error(`Cannot send MQTT command: Burner ${burnerId} or Stove not found`);
        return;
    }

    const stoveId = burner.stove.stoveId; // e.g. "mega_10009"
    const burnerPosition = burner.position; // e.g. 1, 2, 3, 4

    // 2. Construct topic based on Stove ID
    // Publish Topic: "megagas/{stoveId}/kitchen"
    const topic = `megagas/${stoveId}/kitchen`;

    // 3. Payload: { burner: 1, command: 'start' }
    const message = JSON.stringify({
      burner: burnerPosition,
      command: command,
    });

    this.mqttService.publish(topic, message);
  }

  @SubscribeMessage(TimerEvents.timerStart.toString())
  async startMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any) {
    try {
      const burnerId = client.handshake.query.burnerId.toString();

      const ownershipInfo = {
        userId: body.userIdentifier || body.phone,
        userName: body.userName || 'Unknown User',
        customerPhone: body.phone,
        sessionId: body.sessionId,
      };

      // Callback when timer naturally finishes (hits 0)
      const mqttCallback = async (bId: string, cmd: string) => {
        await this.sendMqttCommand(bId, cmd as 'start' | 'stop');

        if (cmd === 'stop') {
            await this.saleTransactionService.deactivateBurner(bId);
        }
      };

      // Start the logical timer
      startTimerForBurner(
        this.server,
        burnerId,
        body.dur,
        mqttCallback,
        ownershipInfo,
      );

      // Send immediate hardware start command
      await this.sendMqttCommand(burnerId, 'start');

      client.emit('timerStarted', {
        message: 'Timer successfully started',
        burnerId: burnerId,
        ownershipInfo: ownershipInfo,
      });
    } catch (error) {
      console.error("Error starting timer:", error);
      client.emit('timerError', {
        message: 'Error starting the timer',
        error: error.message,
      });
    }
  }

  @SubscribeMessage(TimerEvents.timerStop.toString())
  async stopMyTimer(
    @ConnectedSocket() client: any,
    @MessageBody() body: any,
  ) {
    const burnerId = client.handshake.query.burnerId.toString();
    
    // Check ownership logic...
    const userIdentifier = body?.userIdentifier || body?.phone;
    const sessionId = body?.sessionId;

    if (!isTimerOwnedByUser(burnerId, userIdentifier, sessionId)) {
      client.emit('timerError', {
        message: 'Access Denied',
        error: 'You can only stop timers that you created',
        action: 'stop',
      });
      return;
    }

    stopTimerForBurner(this.server, burnerId);
    
    // Send immediate hardware stop command
    await this.sendMqttCommand(burnerId, 'stop');
    await this.saleTransactionService.deactivateBurner(burnerId);
  }

  @SubscribeMessage(TimerEvents.timerPause.toString())
  async pauseMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any) {
    const burnerId = client.handshake.query.burnerId.toString();
    
    if (!isTimerOwnedByUser(burnerId, body?.userIdentifier, body?.sessionId)) {
        return; 
    }

    pauseTimerForBurner(this.server, burnerId);
    // Pause usually implies stopping the gas flow physically
    await this.sendMqttCommand(burnerId, 'stop');
  }

  @SubscribeMessage(TimerEvents.timerResume.toString())
  async resumeMyTimer(
    @ConnectedSocket() client: any,
    @MessageBody() body: any,
  ) {
    const burnerId = client.handshake.query.burnerId.toString();

    if (!isTimerOwnedByUser(burnerId, body?.userIdentifier, body?.sessionId)) {
        return;
    }

    resumeTimerForBurner(this.server, burnerId);
    await this.sendMqttCommand(burnerId, 'start');
  }
}