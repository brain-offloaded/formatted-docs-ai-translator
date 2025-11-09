export function scaleForContain(imgW: number, imgH: number, boxW: number, boxH: number) {
  return Math.min(boxW / Math.max(1, imgW), boxH / Math.max(1, imgH));
}

export interface TextPlacementResultBase {
  mode: 'side' | 'horizontal-bar' | 'overlay';
}

export interface SidePlacement extends TextPlacementResultBase {
  mode: 'side';
  sideWidth: number; // panel width
  overlap: number; // 텍스트 패널이 이미지 방향으로 겹쳐 들어가는 픽셀 (0~sideWidth*0.6)
}

export interface HorizontalBarPlacement extends TextPlacementResultBase {
  mode: 'horizontal-bar';
  barHeight: number;
  position: 'top' | 'bottom';
  width: number; // bar width (centered)
}

export interface OverlayPlacement extends TextPlacementResultBase {
  mode: 'overlay';
  width: number;
  height: number;
  anchor: 'right-center' | 'right-bottom' | 'right-top';
  offset: number; // px margin from edges
}

export type TextPlacementResult = SidePlacement | HorizontalBarPlacement | OverlayPlacement;

// 새 배치 알고리즘: 먼저 letterbox 여백 활용 후 내부 overlay로 폴백
export function computeTextPlacement(
  viewportW: number,
  viewportH: number,
  imgNaturalW: number,
  imgNaturalH: number
): TextPlacementResult {
  // 사이드 모드만 유지하도록 단순화
  const scale = scaleForContain(imgNaturalW, imgNaturalH, viewportW, viewportH);
  const dispW = imgNaturalW * scale;
  const hPad = Math.max(0, viewportW - dispW);
  const MIN_SIDE = Math.min(Math.max(viewportW * 0.18, 220), 420);
  const GAP = 16;

  // 기본 sideWidth 계산 (원래 조건 충족 시 기존 알고리즘 활용)
  let sideWidth: number;
  let overlap = 0;
  if (hPad >= MIN_SIDE + GAP * 2) {
    sideWidth = Math.min(Math.max(MIN_SIDE, Math.min(420, dispW * 0.35)), (hPad - GAP * 2) * 0.9);
    const availableForImage = viewportW - sideWidth;
    const scaleSide = scaleForContain(imgNaturalW, imgNaturalH, availableForImage, viewportH);
    const dispWInSide = imgNaturalW * scaleSide;
    const innerGap = Math.max(0, availableForImage - dispWInSide);
    const halfGap = innerGap / 2;
    const desiredGap = 12;
    if (halfGap > desiredGap) {
      overlap = Math.min(halfGap - desiredGap, sideWidth * 0.6);
    }
  } else {
    // 여유 공간이 부족해도 강제로 사이드 패널 생성 (이미지 위로 겹침)
    sideWidth = Math.min(Math.max(MIN_SIDE, Math.min(420, dispW * 0.38)), viewportW * 0.5);
    overlap = sideWidth * 0.5; // 절반 정도 겹치기
  }
  return { mode: 'side', sideWidth, overlap };
}

// (구) 인터페이스에 대한 임시 wrapper - 향후 제거 가능
export function decideTextLayout(
  viewportW: number,
  viewportH: number,
  imgNaturalW: number,
  imgNaturalH: number
) {
  const p = computeTextPlacement(viewportW, viewportH, imgNaturalW, imgNaturalH);
  if (p.mode === 'side') {
    return {
      sideWidth: p.sideWidth,
      overlayWidth: p.sideWidth, // 사용되지 않음
      overlayHeight: 0,
      useSide: true,
    } as const;
  }
  if (p.mode === 'overlay') {
    return {
      sideWidth: 0,
      overlayWidth: p.width,
      overlayHeight: p.height,
      useSide: false,
    } as const;
  }
  // horizontal-bar => overlay 처럼 취급 (높이는 barHeight)
  return {
    sideWidth: 0,
    overlayWidth: p.width,
    overlayHeight: p.barHeight,
    useSide: false,
  } as const;
}
