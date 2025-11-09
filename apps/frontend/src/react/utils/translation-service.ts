/**
 * Translation service helpers (placeholder)
 *
 * 현재 프로젝트에서는 번역 파이프라인이 Electron IPC로만 처리됩니다.
 * 이 파일은 향후 브라우저 전용 실행(웹 빌드)이나 테스트 더블을 위한
 * 얇은 어댑터/스텁을 제공하기 위한 자리표시자입니다.
 *
 * 주의: 현재 코드베이스 어디에서도 이 모듈을 import 하지 않습니다.
 *       실제 구현이 추가되기 전까지는 아래의 최소 타입과 no-op 함수만 유지합니다.
 */

export type TranslationJob = {
  input: string;
  options?: Record<string, unknown>;
};

/**
 * NO-OP translate stub. Electron IPC가 불가한 테스트 환경에서만 사용을 가정합니다.
 */
export async function translateStub(job: TranslationJob): Promise<{ output: string }> {
  // 단순 에코 변환(실제 번역 아님)
  return { output: job.input };
}
