/**
 * 스트리밍 방식의 파일 처리로 대용량 파일 오버헤드 최소화
 */

// 청크 크기 (1MB)
const CHUNK_SIZE = 1024 * 1024;

export interface StreamChunk {
  id: string;
  index: number;
  total: number;
  data: Uint8Array;
  isLast: boolean;
}

export interface StreamMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
}

/**
 * 파일을 청크로 나누어 브라우저 내에서 처리
 * IPC 오버헤드 없이 렌더러 프로세스에서 직접 처리
 */
export async function processFileInChunks<T>(
  file: File,
  processor: (chunk: ArrayBuffer, index: number, total: number) => Promise<T>,
  onProgress?: (progress: number) => void
): Promise<T[]> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const results: T[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();

    const result = await processor(arrayBuffer, i, totalChunks);
    results.push(result);

    if (onProgress) {
      const progress = ((i + 1) / totalChunks) * 100;
      onProgress(progress);
    }
  }

  return results;
}

/**
 * 여러 파일을 병렬로 청크 단위 처리
 */
export async function processMultipleFilesInChunks<T>(
  files: File[],
  processor: (chunk: ArrayBuffer, fileIndex: number, chunkIndex: number) => Promise<T>,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<T[][]> {
  const results: T[][] = [];

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const fileResults = await processFileInChunks(
      file,
      (chunk, chunkIndex, _total) => processor(chunk, fileIndex, chunkIndex),
      (progress) => onProgress?.(fileIndex, progress)
    );
    results.push(fileResults);
  }

  return results;
}

/**
 * 메인 프로세스에서 청크를 수신하여 파일 재구성
 */
export class StreamReceiver {
  private chunks = new Map<string, Map<number, Uint8Array>>();
  private metadata = new Map<string, StreamMetadata>();

  /**
   * 스트리밍 메타데이터 처리
   */
  handleMetadata(meta: StreamMetadata): { success: boolean; message: string } {
    try {
      this.metadata.set(meta.id, meta);
      this.chunks.set(meta.id, new Map());
      return { success: true, message: '메타데이터 수신 완료' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * 청크 데이터 처리
   */
  handleChunk(chunk: StreamChunk): { success: boolean; message: string } {
    try {
      const streamChunks = this.chunks.get(chunk.id);
      if (!streamChunks) {
        throw new Error(`스트림 ${chunk.id}에 대한 메타데이터가 없습니다.`);
      }

      streamChunks.set(chunk.index, chunk.data);

      return { success: true, message: `청크 ${chunk.index} 수신 완료` };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * 스트리밍 완료 처리 및 파일 재구성
   */
  handleComplete(streamId: string): { success: boolean; data?: Uint8Array; message: string } {
    try {
      const meta = this.metadata.get(streamId);
      const streamChunks = this.chunks.get(streamId);

      if (!meta || !streamChunks) {
        throw new Error(`스트림 ${streamId}에 대한 데이터가 불완전합니다.`);
      }

      // 모든 청크가 수신되었는지 확인
      if (streamChunks.size !== meta.totalChunks) {
        throw new Error(`청크 누락: ${streamChunks.size}/${meta.totalChunks}`);
      }

      // 청크들을 순서대로 합치기
      const totalSize = Array.from(streamChunks.values()).reduce(
        (sum, chunk) => sum + chunk.length,
        0
      );

      const result = new Uint8Array(totalSize);
      let offset = 0;

      for (let i = 0; i < meta.totalChunks; i++) {
        const chunk = streamChunks.get(i);
        if (!chunk) {
          throw new Error(`청크 ${i}이 누락되었습니다.`);
        }

        result.set(chunk, offset);
        offset += chunk.length;
      }

      // 메모리 정리
      this.cleanup(streamId);

      return {
        success: true,
        data: result,
        message: `파일 재구성 완료 (${result.length} bytes)`,
      };
    } catch (error) {
      this.cleanup(streamId);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * 스트리밍 중단 처리
   */
  handleAbort(streamId: string, reason: string): { success: boolean; message: string } {
    this.cleanup(streamId);
    return { success: true, message: `스트리밍 중단: ${reason}` };
  }

  /**
   * 메모리 정리
   */
  private cleanup(streamId: string): void {
    this.chunks.delete(streamId);
    this.metadata.delete(streamId);
  }

  /**
   * 현재 진행 중인 스트림 상태 확인
   */
  getStreamStatus(streamId: string): {
    exists: boolean;
    receivedChunks: number;
    totalChunks: number;
    progress: number;
  } {
    const meta = this.metadata.get(streamId);
    const streamChunks = this.chunks.get(streamId);

    if (!meta || !streamChunks) {
      return { exists: false, receivedChunks: 0, totalChunks: 0, progress: 0 };
    }

    const receivedChunks = streamChunks.size;
    const progress = (receivedChunks / meta.totalChunks) * 100;

    return {
      exists: true,
      receivedChunks,
      totalChunks: meta.totalChunks,
      progress,
    };
  }
}
