import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TempWorkspaceIdParamDto {
  @ApiProperty({
    description: '정리할 임시 작업 공간 ID',
    example: '2f6d1bc5-1b3d-4c5f-9c8a-dc2a1426dd01',
  })
  @IsString()
  workspaceId: string;
}
