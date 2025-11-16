import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HTTP_HOST, HTTP_PORT } from '@/nest/constants/http';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './logger/logger.service';

async function registerSwagger(app: NestFastifyApplication, host: string, port: number) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Formatted Docs AI Translator API')
    .setDescription('Electron 메인 프로세스에서 접근하는 Nest 기반 REST API')
    .setVersion('1.0.0')
    .addServer(`http://${host}:${port}`)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  await SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });
}

export async function bootstrapNestJs(): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    // enfource a higher body limit for image uploads
    bodyLimit: 50 * 1024 * 1024, // 50 MiB
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const loggerService = app.get(LoggerService);
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      strategy: 'excludeAll',
      exposeUnsetFields: false,
      enableImplicitConversion: true,
    })
  );

  await registerSwagger(app, HTTP_HOST, HTTP_PORT);
  await app.listen({ host: HTTP_HOST, port: HTTP_PORT });

  return app;
}
