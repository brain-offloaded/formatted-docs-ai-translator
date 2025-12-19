import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TranslatorModelPreset } from '@prisma/client';

import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { LoggerService } from '@/nest/logger/logger.service';
import { CreateModelPresetRequestDto } from '../dto/request/create-model-preset.dto';
import { UpdateModelPresetBodyDto } from '../dto/request/update-model-preset-body.dto';

@Injectable()
export class ModelPresetManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async getAllPresets(): Promise<TranslatorModelPreset[]> {
    try {
      return await this.prisma.translatorModelPreset.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error('모델 프리셋 목록 조회 중 오류 발생:', { error });
      throw error;
    }
  }

  async getPresetById(id: number): Promise<TranslatorModelPreset> {
    try {
      const preset = await this.prisma.translatorModelPreset.findUnique({ where: { id } });
      if (!preset) {
        throw new NotFoundException(`ID ${id}에 해당하는 모델 프리셋을 찾을 수 없습니다.`);
      }
      return preset;
    } catch (error) {
      this.logger.error(`ID ${id} 모델 프리셋 조회 중 오류 발생:`, { error });
      throw error;
    }
  }

  async createPreset(dto: CreateModelPresetRequestDto): Promise<TranslatorModelPreset> {
    try {
      const existingPreset = await this.prisma.translatorModelPreset.findUnique({
        where: { name: dto.name },
      });
      if (existingPreset) {
        throw new Error(`'${dto.name}' 이름의 프리셋이 이미 존재합니다.`);
      }

      return await this.prisma.translatorModelPreset.create({
        data: {
          name: dto.name,
          modelProvider: dto.modelProvider,
          baseUrl: dto.baseUrl ?? null,
          apiKey: dto.apiKey,
          modelName: dto.modelName,
          requestsPerMinute: dto.requestsPerMinute,
          maxOutputTokenCount: dto.maxOutputTokenCount,
          maxConcurrentRequests: dto.maxConcurrentRequests,
          useThinking: dto.useThinking,
          setThinkingBudget: dto.setThinkingBudget,
          thinkingBudget: dto.thinkingBudget ?? null,
        },
      });
    } catch (error) {
      this.logger.error('모델 프리셋 생성 중 오류 발생:', { error, dto });
      throw error;
    }
  }

  async updatePreset(id: number, dto: UpdateModelPresetBodyDto): Promise<TranslatorModelPreset> {
    try {
      const preset = await this.getPresetById(id);

      if (dto.name && dto.name !== preset.name) {
        const existingPreset = await this.prisma.translatorModelPreset.findUnique({
          where: { name: dto.name },
        });
        if (existingPreset && existingPreset.id !== id) {
          throw new Error(`'${dto.name}' 이름의 프리셋이 이미 존재합니다.`);
        }
      }

      const data: Prisma.TranslatorModelPresetUpdateInput = {
        name: dto.name ?? preset.name,
        modelProvider: dto.modelProvider ?? preset.modelProvider,
        baseUrl: dto.baseUrl ?? preset.baseUrl,
        apiKey: dto.apiKey ?? preset.apiKey,
        modelName: dto.modelName ?? preset.modelName,
        requestsPerMinute: dto.requestsPerMinute ?? preset.requestsPerMinute,
        maxOutputTokenCount: dto.maxOutputTokenCount ?? preset.maxOutputTokenCount,
        maxConcurrentRequests: dto.maxConcurrentRequests ?? preset.maxConcurrentRequests,
        useThinking: dto.useThinking ?? preset.useThinking,
        setThinkingBudget: dto.setThinkingBudget ?? preset.setThinkingBudget,
        thinkingBudget: dto.thinkingBudget ?? preset.thinkingBudget,
      };

      return await this.prisma.translatorModelPreset.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error(`ID ${id} 모델 프리셋 업데이트 중 오류 발생:`, { error, dto });
      throw error;
    }
  }

  async deletePreset(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const preset = await this.getPresetById(id);
      await this.prisma.translatorModelPreset.delete({ where: { id: preset.id } });
      return { success: true };
    } catch (error) {
      this.logger.error(`ID ${id} 모델 프리셋 삭제 중 오류 발생:`, { error });
      if (error instanceof NotFoundException) {
        return { success: false, message: error.message };
      }
      throw error;
    }
  }
}
