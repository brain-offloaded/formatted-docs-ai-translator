import { FastifyReply } from 'fastify';

import { LoggerService } from '@/nest/logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';
import { Catch, ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`HTTP Exception: ${status}`, {
      exception,
      stringifiedException: errorToString(exception),
    });

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    response.status(status).send({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
