import { Body, Controller, Delete, Get, Param, Patch, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SettingsService } from './settings.service';
import { SettingKeyParamDto } from './dto/request/setting-key-param.dto';
import { UpdateSettingRequestDto } from './dto/request/update-setting-request.dto';
import { GetSettingResponseDto } from './dto/response/get-setting-response.dto';
import { UpdateSettingResponseDto } from './dto/response/update-setting-response.dto';
import { GetAllSettingsResponseDto } from './dto/response/get-all-settings-response.dto';
import { DeleteSettingResponseDto } from './dto/response/delete-setting-response.dto';
import { AppSettingDto } from './dto/response/app-setting.dto';
import { AppSetting } from '@prisma/client';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  @ApiOkResponse({
    description: '설정 값을 조회합니다.',
    type: GetSettingResponseDto,
  })
  @SerializeOptions({ type: GetSettingResponseDto })
  async getSetting(@Param() { key }: SettingKeyParamDto): Promise<GetSettingResponseDto> {
    const value = await this.settingsService.getSetting(key);

    return {
      success: true,
      message: '설정 값을 조회했습니다.',
      result: value ?? null,
    };
  }

  @Patch(':key')
  @ApiOkResponse({
    description: '설정 값을 생성하거나 업데이트합니다.',
    type: UpdateSettingResponseDto,
  })
  @SerializeOptions({ type: UpdateSettingResponseDto })
  async updateSetting(
    @Param() { key }: SettingKeyParamDto,
    @Body() { value }: UpdateSettingRequestDto
  ): Promise<UpdateSettingResponseDto> {
    const setting = await this.settingsService.updateSetting(key, value);

    return {
      success: true,
      message: '설정 값을 저장했습니다.',
      result: this.mapSetting(setting),
    };
  }

  @Get()
  @ApiOkResponse({
    description: '등록된 모든 설정을 조회합니다.',
    type: GetAllSettingsResponseDto,
  })
  @SerializeOptions({ type: GetAllSettingsResponseDto })
  async getAllSettings(): Promise<GetAllSettingsResponseDto> {
    const settings = await this.settingsService.getAllSettings();

    return {
      success: true,
      message: '설정 목록을 조회했습니다.',
      result: settings.map((setting) => this.mapSetting(setting)),
    };
  }

  @Delete(':key')
  @ApiOkResponse({
    description: '설정을 삭제합니다.',
    type: DeleteSettingResponseDto,
  })
  @SerializeOptions({ type: DeleteSettingResponseDto })
  async deleteSetting(@Param() { key }: SettingKeyParamDto): Promise<DeleteSettingResponseDto> {
    await this.settingsService.deleteSetting(key);

    return {
      success: true,
      message: '설정을 삭제했습니다.',
    };
  }

  private mapSetting(setting: AppSetting): AppSettingDto {
    return {
      key: setting.key,
      value: setting.value,
      createdAt:
        setting.createdAt instanceof Date ? setting.createdAt.toISOString() : setting.createdAt,
      updatedAt:
        setting.updatedAt instanceof Date ? setting.updatedAt.toISOString() : setting.updatedAt,
    };
  }
}
