import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // ✅ FIXED: Added X-User-Identifier to allowedHeaders
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Id',
      'X-User-Identifier',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Session-Id', 'X-User-Identifier'], // if  need to read these from responses
  });

  const config = new DocumentBuilder()
    .setTitle('Megagas Community Kitchen')
    .setDescription('Megagas Community Kitchen API')
    .setVersion('1.0')
    .addTag('commskitchen')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(8080);
}
bootstrap();
