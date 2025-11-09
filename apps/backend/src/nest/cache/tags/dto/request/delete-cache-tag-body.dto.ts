import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, ValidateIf } from 'class-validator';

export enum CacheTagDeletionModeDto {
  STRICT = 'strict',
  CASCADE = 'cascade',
  REASSIGN = 'reassign',
}

export class DeleteCacheTagBodyDto {
  @ApiProperty({
    description: '삭제 모드',
    enum: CacheTagDeletionModeDto,
    default: CacheTagDeletionModeDto.STRICT,
    required: false,
  })
  @IsEnum(CacheTagDeletionModeDto)
  @IsOptional()
  @Expose()
  mode?: CacheTagDeletionModeDto;

  @ApiProperty({
    description: '재할당 대상 캐시 태그 ID (mode가 reassign일 경우 필수)',
    example: 3,
    required: false,
  })
  @ValidateIf((o) => o.mode === CacheTagDeletionModeDto.REASSIGN)
  @IsInt()
  @Type(() => Number)
  @Expose()
  targetTagId?: number;
}
