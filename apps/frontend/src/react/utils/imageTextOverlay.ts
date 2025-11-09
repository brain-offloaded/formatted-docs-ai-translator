import { Box2D } from '@apps/common/dist/utils/box2d';
import type { ImageTextBoundingBoxDto } from '@/react/api/generated/models/ImageTextBoundingBoxDto';

export interface ApplyTextToImageOptions {
  originalImageBase64: string;
  translatedBlocks: ImageTextBoundingBoxDto[];
  ocrResults: ImageTextBoundingBoxDto[];
}

export async function applyTextToImage(options: ApplyTextToImageOptions): Promise<string> {
  const { originalImageBase64, translatedBlocks, ocrResults } = options;

  // Base64를 이미지로 변환
  const img = new Image();
  const imageLoadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  img.src = `data:image/png;base64,${originalImageBase64}`;
  await imageLoadPromise;

  // Canvas 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  canvas.width = img.width;
  canvas.height = img.height;

  // 원본 이미지 그리기
  ctx.drawImage(img, 0, 0);

  // 실제로 번역된 블록들만 필터링
  const reallyTranslatedBlocks = translatedBlocks.filter((translatedBlock, index) => {
    const ocrResult = ocrResults[index];
    return ocrResult.text.trim() !== translatedBlock.text.trim();
  });

  // 각 번역 블록에 대해 텍스트 오버레이 적용
  for (const block of reallyTranslatedBlocks) {
    await applyTextBlock(ctx, block);
  }

  // Canvas를 Base64로 변환
  return canvas.toDataURL('image/png').split(',')[1]; // data:image/png;base64, 부분 제거
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(/(\s+)/); // 공백도 포함해서 분리
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      // 현재 줄이 비어있지 않으면 저장
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      // 단어 자체가 maxWidth보다 크면 강제로 분리
      if (ctx.measureText(word).width > maxWidth) {
        const chars = word.split('');
        let charLine = '';
        for (const char of chars) {
          const testCharLine = charLine + char;
          if (ctx.measureText(testCharLine).width <= maxWidth) {
            charLine = testCharLine;
          } else {
            if (charLine) {
              lines.push(charLine);
            }
            charLine = char;
          }
        }
        currentLine = charLine;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.filter((line) => line.length > 0);
}

async function applyTextBlock(
  ctx: CanvasRenderingContext2D,
  block: ImageTextBoundingBoxDto
): Promise<void> {
  const bbox = block.box_2d as Box2D;
  const { x1, y1, x2, y2 } = Box2D.getCoordinate(bbox);
  const width = x2 - x1;
  const height = y2 - y1;

  // 배경을 흰색으로 칠하기
  ctx.fillStyle = 'white';
  ctx.fillRect(x1, y1, width, height);

  // 텍스트가 비어있으면 종료
  if (!block.text.trim()) {
    return;
  }

  // 텍스트 스타일 설정
  const fontFamily = 'Arial, sans-serif';
  const lineHeightRatio = 1.2;
  const padding = Math.min(width, height) * 0.05; // 5% 패딩
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  // 최적 폰트 크기 찾기
  const initialFontSize = Math.min(availableHeight, availableWidth / 2); // 초기 추정값
  let bestFontSize = 1;
  let bestLines: string[] = [];

  // 이진 탐색으로 최적 폰트 크기 찾기
  let minSize = 1;
  let maxSize = initialFontSize;

  for (let i = 0; i < 20; i++) {
    // 최대 20번 반복
    const testSize = Math.floor((minSize + maxSize) / 2);
    ctx.font = `${testSize}px ${fontFamily}`;

    const lines = wrapText(ctx, block.text, availableWidth);
    const totalHeight = lines.length * testSize * lineHeightRatio;

    if (totalHeight <= availableHeight && lines.length > 0) {
      bestFontSize = testSize;
      bestLines = lines;
      minSize = testSize + 1;
    } else {
      maxSize = testSize - 1;
    }

    if (minSize > maxSize) {
      break;
    }
  }

  // 최종 폰트 크기 검증 및 조정
  if (bestFontSize < 1) {
    bestFontSize = 1;
  }

  // 최종 텍스트 렌더링
  ctx.fillStyle = 'black';
  ctx.font = `${bestFontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 텍스트 중앙 정렬을 위한 계산
  const lineHeight = bestFontSize * lineHeightRatio;
  const totalTextHeight = bestLines.length * lineHeight;
  const startY = y1 + height / 2 - totalTextHeight / 2 + lineHeight / 2;

  // 각 줄 그리기
  bestLines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    const centerX = x1 + width / 2;

    // 텍스트가 박스를 벗어나지 않도록 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.rect(x1 + padding, y1 + padding, availableWidth, availableHeight);
    ctx.clip();

    ctx.fillText(line, centerX, lineY);
    ctx.restore();
  });
}
