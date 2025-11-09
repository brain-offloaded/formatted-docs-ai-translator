/**
 * 날짜 유틸리티 함수 모음
 */

/**
 * 1개월 전 날짜를 기본 시작일로 반환합니다
 */
export const getDefaultStartDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return formatDate(date);
};

/**
 * 현재 날짜를 기본 종료일로 반환합니다
 */
export const getDefaultEndDate = (): string => {
  return formatDate(new Date());
};

/**
 * 내일 날짜를 기본 종료일로 반환합니다
 */
export const getDefaultEndDateTomorrow = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDate(date);
};

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 포맷팅합니다
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 YYYY/MM/DD 형식의 문자열로 포맷팅합니다
 */
export const formatDateWithSlash = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 날짜 문자열을 HTML date 입력에 사용 가능한 형식으로 변환합니다
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * 상대적인 날짜 표시 형식으로 변환합니다 (오늘, 어제 등)
 */
export const formatRelativeDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  // 날짜 비교를 위해 시간 부분 제거
  const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayWithoutTime = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (dateWithoutTime.getTime() === todayWithoutTime.getTime()) {
    // 오늘인 경우 시간만 표시
    return `오늘 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (dateWithoutTime.getTime() === yesterdayWithoutTime.getTime()) {
    // 어제인 경우
    return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else {
    // 그 외의 경우
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
};
