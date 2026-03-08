import { deriveFileTranslationOutcome } from '../file-translation-outcome';

describe('deriveFileTranslationOutcome', () => {
  it('strict 실패가 하나라도 있으면 전체 상태만 실패로 승격하고 개수는 유지한다', () => {
    const result = deriveFileTranslationOutcome({
      aggregated: [
        {
          name: 'ok.txt',
          success: true,
          items: [{ success: true }],
        },
        {
          name: 'bad.txt',
          success: false,
          items: [{ success: false, message: '세그먼트 번역 실패 1건 (플레이스홀더 불일치)' }],
        },
      ],
      strictFailureAbortMessage: 'strict 실패로 전체 작업을 실패 처리했습니다.',
    });

    expect(result.hasStrictFailure).toBe(true);
    expect(result.total).toBe(2);
    expect(result.success).toBe(1);
    expect(result.fail).toBe(1);
    expect(result.isFatalError).toBe(true);
    expect(result.errorMessage).toBe('strict 실패로 전체 작업을 실패 처리했습니다.');
    expect(result.items).toEqual([
      {
        name: 'ok.txt',
        success: true,
        errorMessage: undefined,
      },
      {
        name: 'bad.txt',
        success: false,
        errorMessage: '세그먼트 번역 실패 1건 (플레이스홀더 불일치)',
      },
    ]);
  });

  it('strict 실패가 없는 다른 실패 파일에 abort 메시지를 덮어쓰지 않는다', () => {
    const result = deriveFileTranslationOutcome({
      aggregated: [
        {
          name: 'strict.txt',
          success: false,
          items: [{ success: false, message: '세그먼트 번역 실패 1건 (플레이스홀더 불일치)' }],
        },
        {
          name: 'other.txt',
          success: false,
          items: [{ success: false }],
        },
      ],
      strictFailureAbortMessage: 'strict 실패로 전체 작업을 실패 처리했습니다.',
    });

    expect(result.hasStrictFailure).toBe(true);
    expect(result.errorMessage).toBe('strict 실패로 전체 작업을 실패 처리했습니다.');
    expect(result.items).toEqual([
      {
        name: 'strict.txt',
        success: false,
        errorMessage: '세그먼트 번역 실패 1건 (플레이스홀더 불일치)',
      },
      {
        name: 'other.txt',
        success: false,
        errorMessage: undefined,
      },
    ]);
  });

  it('strict 실패가 없으면 기존 집계를 유지한다', () => {
    const result = deriveFileTranslationOutcome({
      aggregated: [
        {
          name: 'ok.txt',
          success: true,
          items: [{ success: true }],
        },
        {
          name: 'bad.txt',
          success: false,
          items: [{ success: false, message: '일반 오류' }],
        },
      ],
      strictFailureAbortMessage: 'strict 실패로 전체 작업을 실패 처리했습니다.',
    });

    expect(result.hasStrictFailure).toBe(false);
    expect(result.errorMessage).toBeUndefined();
    expect(result.success).toBe(1);
    expect(result.fail).toBe(1);
    expect(result.items).toEqual([
      {
        name: 'ok.txt',
        success: true,
        errorMessage: undefined,
      },
      {
        name: 'bad.txt',
        success: false,
        errorMessage: '일반 오류',
      },
    ]);
  });
});
