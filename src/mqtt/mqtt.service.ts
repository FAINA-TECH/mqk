import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit {
  private readonly logger = new Logger(MqttService.name);
  private mqttClient: MqttClient;

  onModuleInit() {
    const host = '152.42.139.67';
    const port = 18100;
    const clientId = 'mega_backend_server'; // Distinct client ID

    const connectUrl = `mqtt://${host}:${port}`;

    this.mqttClient = connect(connectUrl, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      username: 'mega_WS_10001',
      password: 'mega_WS_10001',
      reconnectPeriod: 1000,
    });

    this.mqttClient.on('connect', () => {
      this.logger.log('✅ Connected to MQTT Broker Server');
      this.logger.log(`Connected to: ${connectUrl}`);

      // Subscribe to ALL kitchen status updates using wildcard
      // Topic structure: megagas/{stoveId}/kitchenStatus
      const wildcardTopic = 'megagas/+/kitchenStatus';
      
      this.mqttClient.subscribe(wildcardTopic, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${wildcardTopic}`, err);
        } else {
          this.logger.log(`Subscribed to ${wildcardTopic}`);
        }
      });
    });

    this.mqttClient.on('error', (error) => {
      this.logger.error('❌ Error connecting to MQTT Broker Server', error);
    });

    this.mqttClient.on('message', (topic, message) => {
      this.logger.log(`📨 Received message on ${topic}: ${message.toString()}`);
      // Here you could add logic to parse status updates from stoves
      // e.g., if a stove reports a fault or confirms a valve state
    });
  }

  publish(topic: string, payload: string): string {
    if (!this.mqttClient || !this.mqttClient.connected) {
      this.logger.error('MQTT client is not connected');
      return 'MQTT client is not connected';
    }

    this.logger.log(`📤 Publishing to ${topic}: ${payload}`);
    this.mqttClient.publish(topic, payload);
    return `Publishing to ${topic}`;
  }

  // ✅ ADDED BACK: Test connection method
  testConnection(): string {
    if (this.mqttClient && this.mqttClient.connected) {
      this.publish(
        'test/ping',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          message: 'Connection test',
        }),
      );
      return 'Connection test sent';
    }
    return 'MQTT client is not connected';
  }

  getConnectionStatus(): { connected: boolean; clientId: string } {
    return {
      connected: this.mqttClient ? this.mqttClient.connected : false,
      clientId: this.mqttClient?.options?.clientId || 'unknown',
    };
  }

  getBrokerInfo(): any {
    if (!this.mqttClient || !this.mqttClient.connected) {
      return { error: 'MQTT client is not connected' };
    }

    // Subscribe to system topics that reveal broker info
    const systemTopics = [
      '$SYS/broker/version',
      '$SYS/broker/timestamp',
      '$SYS/broker/uptime',
      '$SYS/broker/clients/connected',
      '$SYS/broker/clients/total',
      '$SYS/broker/messages/received',
      '$SYS/broker/messages/sent',
    ];

    systemTopics.forEach((topic) => {
      this.mqttClient.subscribe(topic, (err) => {
        if (!err) {
          this.logger.log(`Subscribed to ${topic}`);
        }
      });
    });

    // Listen for system messages
    this.mqttClient.on('message', (topic, message) => {
      if (topic.startsWith('$SYS/')) {
        this.logger.log(`🔍 Broker Info - ${topic}: ${message.toString()}`);
      }
    });

    return {
      message: 'Subscribed to broker system topics, check logs for info',
    };
  }
}