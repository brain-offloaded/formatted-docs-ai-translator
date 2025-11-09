import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggerService } from '@/nest/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';
import * as JSZip from 'jszip';
import { CategorizedFile } from '@apps/common/dist/types/temp-workspace';
import { getTempDirectory } from '@/nest/db/path';

export interface TempWorkspace {
  id: string;
  path: string;
}

@Injectable()
export class TempWorkspaceService implements OnModuleDestroy {
  private readonly baseDir = getTempDirectory();
  private readonly workspaces = new Map<string, TempWorkspace>();

  constructor(private readonly logger: LoggerService) {
    this.init();
  }

  private async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      this.logger.error('임시 작업 공간 기본 디렉터리 생성 실패:', { error });
    }
  }

  async createWorkspace(): Promise<TempWorkspace> {
    const id = uuidv4();
    const workspacePath = path.join(this.baseDir, id);
    try {
      await fs.mkdir(workspacePath, { recursive: true });
      const workspace: TempWorkspace = { id, path: workspacePath };
      this.workspaces.set(id, workspace);
      this.logger.info(`임시 작업 공간 생성됨: ${workspacePath}`);
      return workspace;
    } catch (error) {
      this.logger.error('임시 작업 공간 생성 실패:', { error });
      throw error;
    }
  }

  getWorkspace(id: string): TempWorkspace | undefined {
    return this.workspaces.get(id);
  }

  async cleanupWorkspace(id: string): Promise<void> {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      try {
        await fs.rm(workspace.path, { recursive: true, force: true });
        this.workspaces.delete(id);
        // this.logger.info(`임시 작업 공간 정리됨: ${workspace.path}`);
      } catch {
        // this.logger.error('임시 작업 공간 정리 실패:', { path: workspace.path, error });
      }
    }
  }

  async onModuleDestroy() {
    // this.logger.info('모듈 파괴, 모든 임시 작업 공간 정리 시작...');
    const cleanupPromises = Array.from(this.workspaces.keys()).map((id) =>
      this.cleanupWorkspace(id)
    );
    await Promise.all(cleanupPromises);
    // this.logger.info('모든 임시 작업 공간 정리 완료.');
  }

  async extractZipToWorkspace(workspaceId: string, zipBuffer: Buffer): Promise<CategorizedFile[]> {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('존재하지 않는 작업 공간입니다.');
    }

    const zip = await JSZip.loadAsync(zipBuffer);
    const originals: Record<string, string> = {};
    const applieds: Record<string, string> = {};
    const jsons: Record<string, string> = {};
    const texts: Record<string, string[]> = {};

    const toKey = (name: string) => {
      const n = name.split('/').pop() || name;
      const dot = n.lastIndexOf('.');
      return dot >= 0 ? n.substring(0, dot) : n;
    };

    const isImage = (name: string) => /\.(png|jpe?g|webp|bmp|gif)$/i.test(name);
    const isJson = (name: string) => /\.json$/i.test(name);

    for (const relativePath in zip.files) {
      const entry = zip.files[relativePath];
      if (entry.dir) continue;

      const buffer = await entry.async('nodebuffer');
      const filePath = path.join(workspace.path, relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);

      const name = relativePath.replace(/^\.*\/?/, '');
      const key = toKey(name.split('/').pop() || name);
      const lowerPath = name.toLowerCase();

      if (lowerPath.includes('/original/') || lowerPath.startsWith('original/')) {
        if (isImage(name)) originals[key] = filePath;
      } else if (lowerPath.includes('/applied/') || lowerPath.startsWith('applied/')) {
        if (isImage(name)) applieds[key] = filePath;
      } else if (lowerPath.includes('/json/') || lowerPath.startsWith('json/')) {
        if (isJson(name)) {
          jsons[key] = filePath;
          try {
            const content = JSON.parse(buffer.toString('utf-8'));
            if (content.translated_result && Array.isArray(content.translated_result)) {
              texts[key] = content.translated_result
                .map((item: { text: string }) => item.text)
                .filter(Boolean);
            }
          } catch (e) {
            this.logger.warn(`JSON 파싱 실패: ${relativePath}`, { error: e });
          }
        }
      } else {
        if (isJson(name)) {
          jsons[key] = filePath;
          try {
            const content = JSON.parse(buffer.toString('utf-8'));
            if (content.translated_result && Array.isArray(content.translated_result)) {
              texts[key] = content.translated_result
                .map((item: { text: string }) => item.text)
                .filter(Boolean);
            }
          } catch (e) {
            this.logger.warn(`JSON 파싱 실패: ${relativePath}`, { error: e });
          }
        } else if (isImage(name)) {
          if (!applieds[key]) applieds[key] = filePath;
          else if (!originals[key]) originals[key] = filePath;
        }
      }
    }

    const keys = Array.from(
      new Set([
        ...Object.keys(originals),
        ...Object.keys(applieds),
        ...Object.keys(jsons),
        ...Object.keys(texts),
      ])
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    return keys.map((k) => ({
      key: k,
      original: originals[k],
      applied: applieds[k],
      json: jsons[k],
      texts: texts[k],
    }));
  }
}
