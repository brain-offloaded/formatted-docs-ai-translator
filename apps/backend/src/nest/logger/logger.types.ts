import { GetLogsResponseDto } from './dto/response/get-logs-response.dto';
import { GetLogDetailResponseDto } from './dto/response/get-log-detail-response.dto';
import { LogSearchParamsDto } from './dto/request/log-search-params.dto';

export interface LogMetadata {
  context?: string;
  [key: string]: unknown;
}

export interface GetLogsParams {
  page: number;
  itemsPerPage: number;
  levels?: string[];
  startDate?: string;
  endDate?: string;
}

export interface GetLogDetailParams {
  id: number;
}

export type GetLogsResult = GetLogsResponseDto;
export type GetLogDetailResult = GetLogDetailResponseDto;
export type DeleteLogsFilterParams = LogSearchParamsDto;

export type LoggerWithDb = {
  error: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  warn: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  info: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
  debug: (message: string, metadata?: LogMetadata, ...args: unknown[]) => LoggerWithDb;
};
