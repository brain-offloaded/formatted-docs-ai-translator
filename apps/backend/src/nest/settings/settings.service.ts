import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { AppSetting } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async updateSetting(key: string, value: string): Promise<AppSetting> {
    return this.prisma.appSetting.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
      },
    });
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return this.prisma.appSetting.findMany();
  }

  async deleteSetting(key: string): Promise<void> {
    await this.prisma.appSetting.deleteMany({ where: { key } });
  }
}
