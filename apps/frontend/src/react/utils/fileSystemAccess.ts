/**
 * File System Access API를 사용한 파일 처리 유틸리티
 * 렌더러 프로세스에서 직접 파일 시스템에 접근하여 IPC 오버헤드 제거
 */

// File System Access API 타입 정의
declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;

    showSaveFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      suggestedName?: string;
    }) => Promise<FileSystemFileHandle>;
  }
}

/**
 * File System Access API 지원 여부 확인
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * ZIP 파일 선택 (File System Access API 사용)
 */
export async function pickZipFileNative(): Promise<File | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API가 지원되지 않습니다.');
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker!({
      types: [
        {
          description: 'ZIP 파일',
          accept: {
            'application/zip': ['.zip'],
          },
        },
      ],
      multiple: false,
    });

    return await fileHandle.getFile();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null; // 사용자가 취소함
    }
    throw error;
  }
}

/**
 * ZIP 파일 저장 (File System Access API 사용)
 */
export async function saveZipFileNative(
  blob: Blob,
  suggestedName: string = 'translated_images.zip'
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API가 지원되지 않습니다.');
  }

  try {
    const fileHandle = await window.showSaveFilePicker!({
      types: [
        {
          description: 'ZIP 파일',
          accept: {
            'application/zip': ['.zip'],
          },
        },
      ],
      suggestedName,
    });

    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return false; // 사용자가 취소함
    }
    throw error;
  }
}

/**
 * 스트리밍 방식으로 ZIP 파일 읽기
 * 대용량 파일 처리 시 메모리 사용량 최적화
 */
export async function readZipFileStreamNative(file: File): Promise<ReadableStream<Uint8Array>> {
  if (!file.stream) {
    // 폴백: 전체 파일을 ArrayBuffer로 읽기
    const buffer = await file.arrayBuffer();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });
  }

  return file.stream();
}

/**
 * IndexedDB를 사용한 임시 파일 캐싱
 * 대용량 파일의 경우 메모리 대신 디스크 저장소 활용
 */
export class TempFileCache {
  private dbName = 'temp-file-cache';
  private storeName = 'files';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async storeFile(key: string, blob: Blob): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(blob, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFile(key: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
