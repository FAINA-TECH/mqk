import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { MqttService } from './mqtt/mqtt.service';
import { ApiBody, ApiOperation, ApiProperty } from '@nestjs/swagger';

// Define DTO class for Swagger documentation
class TestCommandDto {
  @ApiProperty({ example: 'mega_10009', description: 'The hardware ID of the stove' })
  stoveId: string;

  @ApiProperty({ example: 1, description: 'Burner position (1-4)' })
  burnerPosition: number;

  @ApiProperty({ example: 'start', enum: ['start', 'stop'], description: 'Command to send' })
  command: 'start' | 'stop';
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mqttService: MqttService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('mqtt/status')
  getMqttStatus() {
    return this.mqttService.getConnectionStatus();
  }

  @Get('mqtt/test')
  testMqttConnection() {
    return this.mqttService.testConnection();
  }

  @Get('mqtt/broker-info')
  getBrokerInfo() {
    return this.mqttService.getBrokerInfo();
  }

  // ✅ NEW: Specific endpoint to test hardware commands
  @Post('mqtt/test-command')
  @ApiOperation({ summary: 'Manually send an open/close command to a specific stove' })
  @ApiBody({ type: TestCommandDto })
  testMqttCommand(@Body() body: TestCommandDto) {
    // 1. Construct the topic based on the new structure
    // Topic: megagas/{stoveId}/kitchen
    const topic = `megagas/${body.stoveId}/kitchen`;

    // 2. Construct payload
    // Payload: { "burner": 1, "command": "start" }
    const payload = JSON.stringify({
      burner: body.burnerPosition,
      command: body.command,
    });

    // 3. Publish
    const result = this.mqttService.publish(topic, payload);
    
    return {
      status: 'Command Sent',
      topic: topic,
      payload: JSON.parse(payload),
      mqttResult: result
    };
  }
}