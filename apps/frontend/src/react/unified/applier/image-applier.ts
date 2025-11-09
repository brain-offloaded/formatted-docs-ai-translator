import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { applyTextToImage } from '@/react/utils/imageTextOverlay';
import { Box2D } from '@apps/common/dist/utils/box2d';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { extractImageAsBase64 } from '../parser/utils/extract-image-as-base64';
import type { ImageTextBoundingBoxDto } from '@/react/api/generated/models/ImageTextBoundingBoxDto';
// 개별 이미지 적용 결과를 zip 최종 단계에서 applied/original/json 폴더 구조로 만들기 위해
// 내부에서 zip을 만들지 않고 파일 경로 형태(applied/..., original/..., json/...)로 반환

export class ImageApplier
  implements IApplier<TranslationInput<BaseParseOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<BaseParseOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    if (translatedTexts.length === 0) {
      const { base64, name: fileName } = await extractImageAsBase64(originalInput);
      if (!base64) {
        return new TranslationOutput([]);
      }

      const toBlobFromBase64 = (b64: string, mime = 'image/png'): Blob => {
        const byteString = atob(b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        return new Blob([ab], { type: mime });
      };

      const originalBlob = toBlobFromBase64(base64);
      const safeBaseName = this.stripExt(fileName);
      const jsonPayload = {
        ocr_result: [],
        translated_result: [],
      };

      return new TranslationOutput([
        {
          name: `applied/${safeBaseName}.png`,
          success: true,
          result: originalBlob,
          message: fileName,
          originalFileName: fileName,
        },
        {
          name: `original/${safeBaseName}.png`,
          success: true,
          result: originalBlob,
          message: fileName,
          originalFileName: fileName,
        },
        {
          name: `json/${safeBaseName}.json`,
          success: true,
          result: JSON.stringify(jsonPayload, null, 2),
          message: fileName,
          originalFileName: fileName,
        },
      ]);
    }

    // 모든 유닛은 동일한 base64 / 파일명을 공유 (translator에서 구성한 key 규칙)
    const firstParts = translatedTexts[0].key.split('|');
    const fileName = firstParts[0];
    const originalImageBase64 = firstParts[2];

    const ocrResults: ImageTextBoundingBoxDto[] = translatedTexts.map((unit) => {
      const [, box2dStr] = unit.key.split('|');
      return { text: unit.source, box_2d: JSON.parse(box2dStr) as Box2D };
    });
    const translatedBlocks: ImageTextBoundingBoxDto[] = translatedTexts.map((unit) => {
      const [, box2dStr] = unit.key.split('|');
      return { text: unit.target || '', box_2d: JSON.parse(box2dStr) as Box2D };
    });

    // 적용된 이미지 생성
    const appliedBase64 = await applyTextToImage({
      originalImageBase64,
      translatedBlocks,
      ocrResults,
    });

    const toBlobFromBase64 = (b64: string, mime = 'image/png'): Blob => {
      const byteString = atob(b64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      return new Blob([ab], { type: mime });
    };

    const originalBlob = toBlobFromBase64(originalImageBase64);
    const appliedBlob = toBlobFromBase64(appliedBase64);

    // json 구조(TranslateImageResponseDto.result 호환)
    const jsonPayload = {
      ocr_result: ocrResults.map((o) => ({ text: o.text, box_2d: o.box_2d })),
      translated_result: translatedBlocks.map((t) => ({ text: t.text, box_2d: t.box_2d })),
    };

    const safeBaseName = this.stripExt(fileName);

    return new TranslationOutput([
      // message 필드에 원본 파일명을 담아 집계(report) 시 원본 파일 단위로 묶을 수 있게 함
      {
        name: `applied/${safeBaseName}.png`,
        success: true,
        result: appliedBlob,
        message: fileName,
        originalFileName: fileName,
      },
      {
        name: `original/${safeBaseName}.png`,
        success: true,
        result: originalBlob,
        message: fileName,
        originalFileName: fileName,
      },
      {
        name: `json/${safeBaseName}.json`,
        success: true,
        result: JSON.stringify(jsonPayload, null, 2),
        message: fileName,
        originalFileName: fileName,
      },
    ]);
  }

  private stripExt(name: string) {
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.substring(0, dot) : name;
  }
}
