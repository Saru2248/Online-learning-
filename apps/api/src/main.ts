// ─────────────────────────────────────────────────────────────────────
//  NestJS Application Bootstrap
// ─────────────────────────────────────────────────────────────────────

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Security ────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ─── Global Validation Pipe ──────────────────────────────────────
  // Automatically validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,      // Auto-transform types (string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global Prefix ───────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Swagger API Documentation ───────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('EduFlow API')
    .setDescription('Online Learning & Course Recommendation Platform API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('courses', 'Course management')
    .addTag('enrollments', 'Course enrollment')
    .addTag('progress', 'Progress tracking')
    .addTag('recommendations', 'AI recommendations')
    .addTag('search', 'Course search')
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 EduFlow API running on: http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at: http://localhost:${port}/api/docs`);
}

bootstrap();
