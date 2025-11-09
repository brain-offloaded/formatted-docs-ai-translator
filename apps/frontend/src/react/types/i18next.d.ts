import 'i18next';
import ko from '../locales/ko.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    // 기본 네임스페이스를 'translation'으로 설정
    defaultNS: 'translation';
    // 한국어 번역 파일을 기준으로 타입 생성
    resources: {
      translation: typeof ko;
    };
  }
}
