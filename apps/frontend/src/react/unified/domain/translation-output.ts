import JSZip from 'jszip';

type TranslationResult = {
  name: string;
  success: boolean;
  message?: string; // 오류 메시지 또는 원본 파일명 (ImageApplier에서 활용)
  result?: string | Blob;
  /**
   * 원본 파일명을 명시적으로 저장 (이미지 등 복수 아웃풋을 가진 타입)
   */
  originalFileName?: string;
};

export class TranslationOutput {
  constructor(private readonly results: TranslationResult[]) {}

  static merge(outputs: TranslationOutput[]): TranslationOutput {
    const allResults = outputs.flatMap((output) => output.results);
    return new TranslationOutput(allResults);
  }

  getResults(): TranslationResult[] {
    return this.results;
  }

  getResult(): string | Blob | (string | Blob)[] {
    if (this.results.length === 1) {
      return this.results[0].result || '';
    }
    return this.results.map((r) => r.result || '');
  }

  getReport() {
    return {
      results: this.results,
      total: this.results.length,
      success: this.results.filter((r) => r.success).length,
      fail: this.results.filter((r) => !r.success).length,
    };
  }

  /**
   * 원본 입력 파일 기준으로 집계된 리포트.
   * 이미지의 경우 applied/original/json 3개 결과를 1개 성공으로 간주.
   * message 필드에 원본 파일명이 있으면 그것을 사용하고,
   * 그렇지 않으면 이름에서 prefix(applied|original|json)/ 제거 후 basename 사용.
   */
  getAggregatedReport() {
    const groups = new Map<string, { name: string; items: TranslationResult[] }>();
    const prefixRegex = /^(applied|original|json)\/(.+)$/;
    for (const r of this.results) {
      // originalFileName 우선, 없으면 message 필드를 원본 파일명 후보로 간주
      const originalName = r.originalFileName || r.message;
      let groupKey: string;
      let displayName: string;
      if (originalName) {
        groupKey = originalName;
        displayName = originalName;
      } else {
        const m = r.name.match(prefixRegex);
        if (m) {
          groupKey = m[2].replace(/\.(png|json)$/i, '');
          displayName = groupKey;
        } else {
          groupKey = r.name;
          displayName = r.name;
        }
      }
      const existing = groups.get(groupKey);
      if (existing) {
        existing.items.push(r);
      } else {
        groups.set(groupKey, { name: displayName, items: [r] });
      }
    }

    const aggregated = Array.from(groups.values()).map((g) => {
      const success = g.items.every((i) => i.success);
      return { name: g.name, success, items: g.items };
    });

    return {
      results: aggregated,
      total: aggregated.length,
      success: aggregated.filter((g) => g.success).length,
      fail: aggregated.filter((g) => !g.success).length,
    };
  }

  async toZip(): Promise<Blob | null> {
    if (this.results.length === 0) return null;
    if (this.results.length === 1 && this.results[0].result instanceof Blob) {
      return this.results[0].result as Blob;
    }
    if (this.results.length === 1 && typeof this.results[0].result === 'string') {
      return new Blob([this.results[0].result], { type: 'text/plain' });
    }

    const zip = new JSZip();
    for (const result of this.results) {
      if (result.success && result.result) {
        zip.file(result.name, result.result);
      }
    }
    return zip.generateAsync({ type: 'blob' });
  }

  async getSingleFile(): Promise<{ blob: Blob; name: string } | null> {
    if (this.results.length !== 1 || !this.results[0].success) {
      return null;
    }
    const result = this.results[0].result;
    const name = this.results[0].name;

    if (result instanceof Blob) {
      return { blob: result, name };
    }
    if (typeof result === 'string') {
      return { blob: new Blob([result], { type: 'text/plain' }), name };
    }
    return null;
  }
}
