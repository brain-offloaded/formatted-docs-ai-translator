import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import TranslationTypeSelector from '@/react/components/common/TranslationTypeSelector';
import { TranslationType } from '@/react/contexts/TranslationContext';
import {
  SourceLanguage,
  TargetLanguage,
  sourceLanguages,
  targetLanguages,
} from '@apps/common/dist/language';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import type { CustomOptionComponentProps } from '@/react/types/translation-types';
import { useTranslation } from 'react-i18next';
import { InfoTooltip } from '@/react/components/common/InfoTooltip';
import { getWikiUrl } from '@/react/utils/wiki';

interface TranslationSettingsPanelProps {
  translationType: TranslationType;
  translationTypeLabel: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  cacheTag: string;
  isTranslating: boolean;
  onSourceLanguageChange: (event: SelectChangeEvent<SourceLanguage>) => void;
  onTargetLanguageChange: (event: SelectChangeEvent<TargetLanguage>) => void;
  onCacheTagChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTranslationTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  OptionComponent?: React.ComponentType<CustomOptionComponentProps> | null;
  optionComponentProps: CustomOptionComponentProps;
}

export const TranslationSettingsPanel: React.FC<TranslationSettingsPanelProps> = ({
  translationType,
  translationTypeLabel,
  sourceLanguage,
  targetLanguage,
  cacheTag,
  isTranslating,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onCacheTagChange,
  onTranslationTypeChange,
  OptionComponent,
  optionComponentProps,
}) => {
  const { t, i18n } = useTranslation();
  const cacheTagLabel = (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {t('cache.tagLabel')}
      <InfoTooltip
        title={t('tooltips.cacheTag')}
        infoAriaLabel={t('tooltips.aria.info', { subject: t('cache.tagLabel') })}
        wikiUrl={getWikiUrl('cacheGuide', i18n.language)}
        wikiAriaLabel={t('tooltips.links.cacheGuide')}
      />
    </Box>
  );
  const renderSourceOptions = () =>
    sourceLanguages.map((language) => (
      <MenuItem key={language} value={language}>
        {t(`language.${language}`)}
      </MenuItem>
    ));
  const renderTargetOptions = () =>
    targetLanguages.map((language) => (
      <MenuItem key={language} value={language}>
        {t(`language.${language}`)}
      </MenuItem>
    ));

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <InputLabel id="source-language-label">{t('translation.sourceLanguageLabel')}</InputLabel>
        <Select
          labelId="source-language-label"
          id="source-language"
          value={sourceLanguage}
          onChange={onSourceLanguageChange}
          label={t('translation.sourceLanguageLabel')}
        >
          {renderSourceOptions()}
        </Select>
      </FormControl>

      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <InputLabel id="target-language-label">{t('translation.targetLanguage')}</InputLabel>
        <Select
          labelId="target-language-label"
          id="target-language"
          value={targetLanguage}
          onChange={onTargetLanguageChange}
          label={t('translation.targetLanguage')}
        >
          {renderTargetOptions()}
        </Select>
      </FormControl>

      <TextField
        label={cacheTagLabel}
        fullWidth
        value={cacheTag}
        onChange={onCacheTagChange}
        disabled={isTranslating}
        placeholder={DEFAULT_CACHE_TAG}
        sx={{ mb: 2 }}
        helperText={t('cache.tagHelperText')}
      />

      <TranslationTypeSelector selectedType={translationType} onChange={onTranslationTypeChange} />

      {OptionComponent && (
        <OptionComponent
          {...optionComponentProps}
          label={`${translationTypeLabel} ${t('common.options')}`}
          translationType={translationType}
        />
      )}
    </Box>
  );
};
