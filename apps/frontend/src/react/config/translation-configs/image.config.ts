import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

export const imageConfig: TranslationConfigDefinition<BaseParseOptionsDto> = {
  type: TranslationType.Image,
  label: '이미지 번역',
  translator: {
    inputLabel: '',
    inputPlaceholder: '',
    fileExtension: 'image/*',
    fileLabel: '이미지 파일',
  },
  parser: {
    options: {
      label: '',
    },
  },
};
