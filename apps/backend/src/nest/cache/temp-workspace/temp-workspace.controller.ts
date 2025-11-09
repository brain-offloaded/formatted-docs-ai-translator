import { Controller, Delete, Param, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TempWorkspaceService } from './temp-workspace.service';
import { TempWorkspaceIdParamDto } from './dto/request/temp-workspace-id-param.dto';
import { DeleteTempWorkspaceResponseDto } from './dto/response/delete-temp-workspace-response.dto';
import { LoggerService } from '@/nest/logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';

@ApiTags('temp-workspaces')
@Controller('temp-workspaces')
export class TempWorkspaceController {
  constructor(
    private readonly tempWorkspaceService: TempWorkspaceService,
    private readonly logger: LoggerService
  ) {}

  @Delete(':workspaceId')
  @ApiOkResponse({
    description: '임시 작업 공간을 정리합니다.',
    type: DeleteTempWorkspaceResponseDto,
  })
  @SerializeOptions({ type: DeleteTempWorkspaceResponseDto })
  async deleteTempWorkspace(
    @Param() { workspaceId }: TempWorkspaceIdParamDto
  ): Promise<DeleteTempWorkspaceResponseDto> {
    try {
      await this.tempWorkspaceService.cleanupWorkspace(workspaceId);
      return {
        success: true,
        message: '임시 작업 공간 정리에 성공했습니다.',
      };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('임시 작업 공간 정리 실패', { workspaceId, error: message });
      return {
        success: false,
        message,
      };
    }
  }
}
