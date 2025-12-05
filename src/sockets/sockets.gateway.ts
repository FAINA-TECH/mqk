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
  getLastDigitFromString,
  getTimerState,
  isTimerOwnedByUser, // ✅ NEW import
} from './burners';

import { MqttService } from 'src/mqtt/mqtt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Burner } from 'src/kitchen/entities/burner.entity';
import { SaleTransactionService } from 'src/sale-transaction/sale-transaction.service';

const topic = `megagas/kayole/kitchenOne`;

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
    console.log(`User ${burnerId} with socket ${client.id} connected`);

    client.join(getBurnerIdSession(burnerId));

    // ✅ NEW: Send current timer state with ownership info immediately upon connection
    const currentState = getTimerState(burnerId);
    if (currentState.remainingTime > 0 || currentState.burnerIsRunning) {
      console.log(
        `Sending current timer state to reconnected client:`,
        currentState,
      );
      client.emit('timerStateSync', currentState);
    }
  }

  handleDisconnect(@ConnectedSocket() client: any) {
    console.log(
      `User ${client.handshake.query.burnerId} with socket ${client.id} DISCONNECTED`,
    );
  }

  @SubscribeMessage('getTimerState')
  handleGetTimerState(@ConnectedSocket() client: any): void {
    const burnerId = client.handshake.query.burnerId.toString();
    const currentState = getTimerState(burnerId);

    console.log(`Timer state requested for ${burnerId}:`, currentState);

    client.emit('timerStateSync', currentState);
  }

  // ✅ Helper function to send MQTT commands
  private sendMqttCommand(burnerId: string, command: 'start' | 'stop') {
    const burnerNumber = getLastDigitFromString(burnerId);
    const message = JSON.stringify({
      burner: burnerNumber,
      command: command,
    });
    this.mqttService.publish(topic, message);
  }

  // ✅ Helper to get actual burner ID from socket burner ID
  private async getBurnerIdFromSocketBurnerId(
    socketBurnerId: string,
  ): Promise<string | null> {
    const burnerNumber = getLastDigitFromString(socketBurnerId);
    if (!burnerNumber) return null;

    const burner = await this.burnerRepository
      .createQueryBuilder('burner')
      .where('burner.name LIKE :pattern', { pattern: `%${burnerNumber}%` })
      .getOne();

    return burner?.id || null;
  }

  @SubscribeMessage(TimerEvents.timerStart.toString())
  startMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any): void {
    try {
      const burnerId = client.handshake.query.burnerId.toString();

      // ✅ NEW: Extract ownership information from the request
      const ownershipInfo = {
        userId: body.userIdentifier || body.phone,
        userName: body.userName || 'Unknown User',
        customerPhone: body.phone,
        sessionId: body.sessionId,
      };

      // ✅ Create MQTT callback for timer completion
      const mqttCallback = async (bId: string, cmd: string) => {
        this.sendMqttCommand(bId, cmd as 'start' | 'stop');

        if (cmd === 'stop') {
          const actualBurnerId = await this.getBurnerIdFromSocketBurnerId(bId);
          if (actualBurnerId) {
            await this.saleTransactionService.deactivateBurner(actualBurnerId);
          }
        }
      };

      // ✅ UPDATED: Start a new timer with ownership info
      startTimerForBurner(
        this.server,
        burnerId,
        body.dur,
        mqttCallback,
        ownershipInfo,
      );

      this.sendMqttCommand(burnerId, 'start');

      client.emit('timerStarted', {
        message: 'Timer successfully started',
        burnerId: burnerId,
        ownershipInfo: ownershipInfo,
      });
    } catch (error) {
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
  ): Promise<void> {
    const burnerId = client.handshake.query.burnerId.toString();

    // ✅ NEW: Check ownership before allowing stop
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

    const actualBurnerId = await this.getBurnerIdFromSocketBurnerId(burnerId);
    if (actualBurnerId) {
      await this.saleTransactionService.deactivateBurner(actualBurnerId);
    }
  }

  @SubscribeMessage(TimerEvents.timerPause.toString())
  pauseMyTimer(@ConnectedSocket() client: any, @MessageBody() body: any): void {
    const burnerId = client.handshake.query.burnerId.toString();

    // ✅ NEW: Check ownership before allowing pause
    const userIdentifier = body?.userIdentifier || body?.phone;
    const sessionId = body?.sessionId;

    if (!isTimerOwnedByUser(burnerId, userIdentifier, sessionId)) {
      client.emit('timerError', {
        message: 'Access Denied',
        error: 'You can only pause timers that you created',
        action: 'pause',
      });
      return;
    }

    pauseTimerForBurner(this.server, burnerId);
    this.sendMqttCommand(burnerId, 'stop');
  }

  @SubscribeMessage(TimerEvents.timerResume.toString())
  resumeMyTimer(
    @ConnectedSocket() client: any,
    @MessageBody() body: any,
  ): void {
    const burnerId = client.handshake.query.burnerId.toString();

    // ✅ NEW: Check ownership before allowing resume
    const userIdentifier = body?.userIdentifier || body?.phone;
    const sessionId = body?.sessionId;

    if (!isTimerOwnedByUser(burnerId, userIdentifier, sessionId)) {
      client.emit('timerError', {
        message: 'Access Denied',
        error: 'You can only resume timers that you created',
        action: 'resume',
      });
      return;
    }

    resumeTimerForBurner(this.server, burnerId);
    this.sendMqttCommand(burnerId, 'start');
  }
}
