import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';

@Catch()
export class IpcExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { channel } = host.switchToRpc().getContext();

    this.logger.error(`IPC Exception on channel: ${channel}`, {
      exception,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    return {
      success: false,
      error: {
        message: exception instanceof Error ? exception.message : 'An unknown error occurred',
        name: exception instanceof Error ? exception.name : 'UnknownError',
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    };
  }
}
