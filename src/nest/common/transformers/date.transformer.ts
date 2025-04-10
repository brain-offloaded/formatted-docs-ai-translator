/**
 * 날짜 변환기
 * SQLite에서 가져온 값을 JavaScript Date 객체로 변환하고,
 * JavaScript Date 객체를 SQLite에 저장할 때 사용합니다.
 */
export class DateTransformer {
  /**
   * DB에서 가져온 값을 JavaScript Date 객체로 변환합니다.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from(value: any): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    // 숫자인 경우 (타임스탬프)
    if (typeof value === 'number') {
      return new Date(value);
    }

    // 문자열인 경우
    if (typeof value === 'string') {
      return new Date(value);
    }

    return value;
  }

  /**
   * JavaScript Date 객체를 DB에 저장할 수 있는 형식으로 변환합니다.
   */
  static to(value: Date | null): Date | null {
    return value;
  }
}

/**
 * 날짜 변환에 사용할 TypeORM 트랜스포머 설정
 */
export const dateTransformer = {
  from: DateTransformer.from,
  to: DateTransformer.to,
};
