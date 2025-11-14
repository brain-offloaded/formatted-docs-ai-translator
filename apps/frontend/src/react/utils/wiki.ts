const WIKI_BASE_URL = 'https://github.com/brain-offloaded/formatted-docs-ai-translator/wiki';

type WikiLanguage = 'en' | 'ko';

const WIKI_PAGE_SLUGS = {
  presetGuide: {
    en: 'en-Practical-Preset-Guide',
    ko: 'ko-프리셋-작성-실전-가이드',
  },
  cacheGuide: {
    en: 'en-Cache-Management-Guide',
    ko: 'ko-캐시-관리-가이드',
  },
  gettingStarted: {
    en: 'en-Getting-Started',
    ko: 'ko-시작하기',
  },
} as const;

export type WikiPageKey = keyof typeof WIKI_PAGE_SLUGS;

const normalizeLanguage = (language?: string): WikiLanguage => {
  if (!language) {
    return 'en';
  }

  const normalized = language.split('-')[0]?.toLowerCase();
  return normalized === 'ko' ? 'ko' : 'en';
};

export const getWikiUrl = (page: WikiPageKey, language?: string): string => {
  const locale = normalizeLanguage(language);
  const slug = WIKI_PAGE_SLUGS[page][locale];
  return `${WIKI_BASE_URL}/${slug}`;
};
