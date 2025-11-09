import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from '../locales/ko.json';
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';

// 타입 안전성을 위한 리소스 정의
const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  zh: { translation: zh },
} as const;

// 시스템 언어 감지 (기본값: 한국어)
const getSystemLanguage = (): string => {
  if (typeof window !== 'undefined' && window.navigator) {
    const lang = window.navigator.language.toLowerCase();
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('zh')) return 'zh';
  }
  return 'ko'; // 기본값
};

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getSystemLanguage(), // 초기 언어는 시스템 언어 또는 저장된 값
    fallbackLng: 'ko', // 폴백 언어
    interpolation: {
      escapeValue: false, // React는 기본적으로 XSS 보호
    },
    react: {
      useSuspense: false, // Suspense 사용 안 함 (선택사항)
    },
  });

export default i18n;
