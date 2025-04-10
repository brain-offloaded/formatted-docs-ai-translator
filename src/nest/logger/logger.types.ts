import { GetLogsRequestDto } from './dto/request/get-logs-request.dto';
import { GetLogsResponseDto } from './dto/response/get-logs-response.dto';

export interface LogMetadata {
  context?: string;
  [key: string]: unknown;
}

export type GetLogsParams = GetLogsRequestDto;
export type GetLogsResult = GetLogsResponseDto;

export type LoggerWithDb = {
  error: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  warn: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  info: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  debug: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
};
