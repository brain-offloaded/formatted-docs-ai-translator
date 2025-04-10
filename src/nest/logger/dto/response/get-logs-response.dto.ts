import { BaseResponseDto } from '@/types/ipc/base-response';

export class GetLogsResponseDto extends BaseResponseDto {
  logs: Array<{
    id: number;
    level: string;
    message: string;
    context: string | null;
    metadata: string | null;
    timestamp: string;
  }>;
  totalItems: number;
}
