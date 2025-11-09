import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  process.env.IS_SWAGGER_GEN_MODE = 'true';
  let app: INestApplication | null = null;
  try {
    app = await NestFactory.create(AppModule, new FastifyAdapter(), {
      logger: ['error', 'warn'], // Keep logs minimal
    });

    const config = new DocumentBuilder().setTitle('FormattedDocs API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);

    fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2));

    console.log('Swagger JSON file has been generated successfully at swagger.json');
  } catch (error) {
    console.error('Error generating Swagger JSON file:', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
    process.exit(0);
  }
}

bootstrap();
