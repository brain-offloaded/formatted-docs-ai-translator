import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PromptPreset } from '../../../db/typeorm/entities/prompt-preset.entity';
import { LoggerService } from '../../../logger/logger.service';
import { CreatePromptPresetRequestDto } from '../dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetRequestDto } from '../dto/request/update-prompt-preset.dto';

@Injectable()
export class PromptPresetManagerService {
  constructor(
    @InjectRepository(PromptPreset)
    private readonly promptPresetRepository: Repository<PromptPreset>,
    private readonly logger: LoggerService
  ) {}

  async getAllPresets(): Promise<PromptPreset[]> {
    try {
      return await this.promptPresetRepository.find({
        order: { createdAt: 'ASC' }, // 생성 시간 오름차순 정렬
      });
    } catch (error) {
      this.logger.error('프롬프트 프리셋 목록 조회 중 오류 발생:', { error });
      throw error; // 오류를 다시 던져서 핸들러에서 처리하도록 함
    }
  }

  async getPresetById(id: number): Promise<PromptPreset> {
    try {
      const preset = await this.promptPresetRepository.findOne({ where: { id } });
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
      const existingPreset = await this.promptPresetRepository.findOne({
        where: { name: dto.name },
      });
      if (existingPreset) {
        throw new Error(`'${dto.name}' 이름의 프리셋이 이미 존재합니다.`); // 핸들러에서 처리할 수 있도록 Error throw
      }

      const newPreset = this.promptPresetRepository.create(dto);
      return await this.promptPresetRepository.save(newPreset);
    } catch (error) {
      this.logger.error('프롬프트 프리셋 생성 중 오류 발생:', { error, dto });
      throw error;
    }
  }

  async updatePreset(dto: UpdatePromptPresetRequestDto): Promise<PromptPreset> {
    const { id, name, prompt } = dto;
    try {
      const preset = await this.getPresetById(id); // 기존 프리셋 조회 (없으면 NotFoundException 발생)

      // 이름 변경 시 중복 확인
      if (name && name !== preset.name) {
        const existingPreset = await this.promptPresetRepository.findOne({ where: { name } });
        if (existingPreset && existingPreset.id !== id) {
          throw new Error(`'${name}' 이름의 프리셋이 이미 존재합니다.`);
        }
        preset.name = name;
      }

      if (prompt !== undefined) {
        preset.prompt = prompt;
      }

      return await this.promptPresetRepository.save(preset);
    } catch (error) {
      this.logger.error(`ID ${id} 프롬프트 프리셋 업데이트 중 오류 발생:`, { error, dto });
      throw error;
    }
  }

  async deletePreset(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const preset = await this.getPresetById(id); // 프리셋 존재 확인
      await this.promptPresetRepository.remove(preset);
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
