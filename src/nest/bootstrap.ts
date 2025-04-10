import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

export async function bootstrapNestJs() {
  // NestJS 애플리케이션 생성 (HTTP 서버 없이)
  const app = await NestFactory.createApplicationContext(AppModule);

  // 오류 처리
  app.enableShutdownHooks();

  return app;
}
