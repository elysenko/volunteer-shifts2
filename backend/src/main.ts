import 'reflect-metadata';
import { NestFactory, NestApplication } from '@nestjs/core';
import { Logger, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // All REST endpoints live under /api; health probes stay at the root so
  // infrastructure liveness checks can hit /health without the prefix.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/deep', method: RequestMethod.GET },
    ],
  });

  // The browser reaches the API through the same ingress host as the SPA, so
  // reflecting the request origin keeps credentialed requests working in every
  // environment (dev proxy, single-host deploy).
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Volunteer Shift Scheduler API')
    .setDescription('NestJS REST backend for the Volunteer Shift Scheduler')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
