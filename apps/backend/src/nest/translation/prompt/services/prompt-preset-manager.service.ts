import { Injectable, NotFoundException } from '@nestjs/common';
import { PromptPreset, Prisma } from '@prisma/client';
import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';
import { LoggerService } from '../../../logger/logger.service';
import { CreatePromptPresetRequestDto } from '../dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetRequestDto } from '../dto/request/update-prompt-preset.dto';

@Injectable()
export class PromptPresetManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async getAllPresets(type?: PromptPresetType): Promise<PromptPreset[]> {
    try {
      const whereCondition: Prisma.PromptPresetWhereInput = type ? { type } : {};

      return await this.prisma.promptPreset.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error('프롬프트 프리셋 목록 조회 중 오류 발생:', { error });
      throw error; // 오류를 다시 던져서 핸들러에서 처리하도록 함
    }
  }

  async getPresetById(id: number): Promise<PromptPreset> {
    try {
      const preset = await this.prisma.promptPreset.findUnique({ where: { id } });
      if (!preset) {
        throw new NotFoundException(`ID ${id}에 해당하는 프롬프트 프리셋을 찾을 수 없습니다.`);
      }
      return preset;
    } catch (error) {
      this.logger.error(`ID ${id} 프롬프트 프리셋 조회 중 오류 발생:`, { error });
      throw error;
    }
  }

  async createPreset(dto: CreatePromptPresetRequestDto): Promise<PromptPreset> {
    try {
      // 이름 중복 확인
      const existingPreset = await this.prisma.promptPreset.findUnique({
        where: { name: dto.name },
      });
      if (existingPreset) {
        throw new Error(`'${dto.name}' 이름의 프리셋이 이미 존재합니다.`); // 핸들러에서 처리할 수 있도록 Error throw
      }

      return await this.prisma.promptPreset.create({ data: dto });
    } catch (error) {
      this.logger.error('프롬프트 프리셋 생성 중 오류 발생:', { error, dto });
      throw error;
    }
  }

  async updatePreset(dto: UpdatePromptPresetRequestDto): Promise<PromptPreset> {
    const { id, name, prompt, type } = dto;
    try {
      const preset = await this.getPresetById(id); // 기존 프리셋 조회 (없으면 NotFoundException 발생)

      // 이름 변경 시 중복 확인
      if (name && name !== preset.name) {
        const existingPreset = await this.prisma.promptPreset.findUnique({ where: { name } });
        if (existingPreset && existingPreset.id !== id) {
          throw new Error(`'${name}' 이름의 프리셋이 이미 존재합니다.`);
        }
      }

      return await this.prisma.promptPreset.update({
        where: { id },
        data: {
          name: name ?? preset.name,
          prompt: prompt ?? preset.prompt,
          type: type ?? preset.type,
        },
      });
    } catch (error) {
      this.logger.error(`ID ${id} 프롬프트 프리셋 업데이트 중 오류 발생:`, { error, dto });
      throw error;
    }
  }

  async deletePreset(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const preset = await this.getPresetById(id); // 프리셋 존재 확인
      await this.prisma.promptPreset.delete({ where: { id: preset.id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`ID ${id} 프롬프트 프리셋 삭제 중 오류 발생:`, { error });
      if (error instanceof NotFoundException) {
        return { success: false, message: error.message };
      }
      throw error; // 예상치 못한 오류는 다시 던짐
    }
  }
}
